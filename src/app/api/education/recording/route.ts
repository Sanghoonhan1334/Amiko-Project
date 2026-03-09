import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { requireEducationAuth, isAdminUser } from '@/lib/education-auth'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// Agora Cloud Recording API configuration
const AGORA_APP_ID = process.env.NEXT_PUBLIC_AGORA_APP_ID!
const AGORA_CUSTOMER_ID = process.env.AGORA_CUSTOMER_ID || ''
const AGORA_CUSTOMER_SECRET = process.env.AGORA_CUSTOMER_SECRET || ''
const AGORA_BUCKET_NAME = process.env.AGORA_RECORDING_BUCKET || ''
const AGORA_BUCKET_ACCESS_KEY = process.env.AGORA_RECORDING_ACCESS_KEY || ''
const AGORA_BUCKET_SECRET_KEY = process.env.AGORA_RECORDING_SECRET_KEY || ''
const AGORA_BUCKET_REGION = parseInt(process.env.AGORA_RECORDING_REGION || '0', 10)
const AGORA_BUCKET_VENDOR = parseInt(process.env.AGORA_RECORDING_VENDOR || '1', 10)

function getAgoraAuth(): string {
  return Buffer.from(`${AGORA_CUSTOMER_ID}:${AGORA_CUSTOMER_SECRET}`).toString('base64')
}

async function agoraRequest(path: string, method: string, body?: unknown) {
  const url = `https://api.agora.io/v1/apps/${AGORA_APP_ID}/cloud_recording${path}`
  const res = await fetch(url, {
    method,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Basic ${getAgoraAuth()}`
    },
    body: body ? JSON.stringify(body) : undefined
  })
  return res.json()
}

// POST /api/education/recording - Start or stop recording
export async function POST(request: NextRequest) {
  try {
    const auth = await requireEducationAuth(request)
    if (auth.error) return auth.error
    const userId = auth.user.id

    const { action, session_id, channel_name, token, uid } = await request.json()

    if (!action || !session_id) {
      return NextResponse.json({ error: 'action and session_id required' }, { status: 400 })
    }

    // Verify the session exists
    const { data: session, error: sessionError } = await supabase
      .from('education_sessions')
      .select(`
        id, course_id, status, recording_url,
        course:education_courses(instructor:instructor_profiles(user_id))
      `)
      .eq('id', session_id)
      .single()

    if (sessionError || !session) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 })
    }

    // Verify user is the instructor
    const instructorUserId = ((session.course as { instructor?: { user_id?: string } } | null)?.instructor)?.user_id
    const admin = await isAdminUser(userId)
    if (instructorUserId !== userId && !admin) {
      return NextResponse.json({ error: 'Only the instructor can manage recordings' }, { status: 403 })
    }

    // Check if Agora credentials are configured
    if (!AGORA_CUSTOMER_ID || !AGORA_CUSTOMER_SECRET) {
      // Fallback: If Agora Cloud Recording is not configured,
      // just mark the session as being recorded (for future configuration)
      if (action === 'start') {
        await supabase
          .from('education_sessions')
          .update({ recording_url: 'recording_in_progress' })
          .eq('id', session_id)

        return NextResponse.json({
          message: 'Recording marked (Agora Cloud Recording not configured - local recording only)',
          recording_active: true,
          fallback: true
        })
      } else {
        await supabase
          .from('education_sessions')
          .update({ recording_url: null })
          .eq('id', session_id)

        return NextResponse.json({
          message: 'Recording stopped',
          recording_active: false,
          fallback: true
        })
      }
    }

    if (action === 'start') {
      if (!channel_name || !token || !uid) {
        return NextResponse.json({ error: 'channel_name, token, and uid required for start' }, { status: 400 })
      }

      // Step 1: Acquire resource
      const acquireRes = await agoraRequest('/acquire', 'POST', {
        cname: channel_name,
        uid: String(uid),
        clientRequest: {
          resourceExpiredHour: 24
        }
      })

      if (!acquireRes.resourceId) {
        console.error('[Recording] Acquire failed:', acquireRes)
        return NextResponse.json({ error: 'Failed to acquire recording resource' }, { status: 500 })
      }

      const resourceId = acquireRes.resourceId

      // Step 2: Start recording
      const startRes = await agoraRequest(
        `/resourceid/${resourceId}/mode/mix/start`,
        'POST',
        {
          cname: channel_name,
          uid: String(uid),
          clientRequest: {
            token,
            recordingConfig: {
              maxIdleTime: 300,
              streamTypes: 2, // audio + video
              audioProfile: 1,
              channelType: 0, // communication
              videoStreamType: 0,
              transcodingConfig: {
                height: 720,
                width: 1280,
                bitrate: 2000,
                fps: 15,
                mixedVideoLayout: 1, // best fit
                backgroundColor: '#000000'
              }
            },
            recordingFileConfig: {
              avFileType: ['hls', 'mp4']
            },
            storageConfig: {
              vendor: AGORA_BUCKET_VENDOR,
              region: AGORA_BUCKET_REGION,
              bucket: AGORA_BUCKET_NAME,
              accessKey: AGORA_BUCKET_ACCESS_KEY,
              secretKey: AGORA_BUCKET_SECRET_KEY,
              fileNamePrefix: ['education', session_id]
            }
          }
        }
      )

      if (!startRes.sid) {
        console.error('[Recording] Start failed:', startRes)
        return NextResponse.json({ error: 'Failed to start recording' }, { status: 500 })
      }

      // Save recording info to session
      await supabase
        .from('education_sessions')
        .update({
          recording_url: JSON.stringify({
            resourceId,
            sid: startRes.sid,
            uid: String(uid),
            status: 'recording'
          })
        })
        .eq('id', session_id)

      return NextResponse.json({
        recording_active: true,
        resourceId,
        sid: startRes.sid
      })
    }

    if (action === 'stop') {
      // Get recording metadata from session
      let recordingMeta: { resourceId: string; sid: string; uid: string } | null = null
      try {
        recordingMeta = session.recording_url ? JSON.parse(session.recording_url) : null
      } catch {
        // Not JSON, might be 'recording_in_progress'
      }

      if (!recordingMeta?.resourceId || !recordingMeta?.sid) {
        return NextResponse.json({
          message: 'No active recording found',
          recording_active: false
        })
      }

      const stopRes = await agoraRequest(
        `/resourceid/${recordingMeta.resourceId}/sid/${recordingMeta.sid}/mode/mix/stop`,
        'POST',
        {
          cname: channel_name,
          uid: recordingMeta.uid,
          clientRequest: {}
        }
      )

      // Extract the recording file URL
      const fileList = stopRes?.serverResponse?.fileList
      let recordingUrl = null
      if (fileList && typeof fileList === 'string') {
        recordingUrl = fileList
      } else if (Array.isArray(fileList) && fileList.length > 0) {
        const mp4File = fileList.find((f: { fileName: string }) => f.fileName?.endsWith('.mp4'))
        recordingUrl = mp4File?.fileName || fileList[0]?.fileName || null
      }

      // Update session with recording URL
      await supabase
        .from('education_sessions')
        .update({ recording_url: recordingUrl })
        .eq('id', session_id)

      return NextResponse.json({
        recording_active: false,
        recording_url: recordingUrl
      })
    }

    return NextResponse.json({ error: 'Invalid action. Use "start" or "stop"' }, { status: 400 })
  } catch (err) {
    console.error('[Education] recording error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
