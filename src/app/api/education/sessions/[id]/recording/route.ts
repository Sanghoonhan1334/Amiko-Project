import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { requireEducationAuth, isAdminUser } from '@/lib/education-auth'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const AGORA_APP_ID = process.env.NEXT_PUBLIC_AGORA_APP_ID!
const AGORA_CUSTOMER_ID = process.env.AGORA_CUSTOMER_ID || ''
const AGORA_CUSTOMER_SECRET = process.env.AGORA_CUSTOMER_SECRET || ''
const AGORA_BUCKET_NAME = process.env.AGORA_RECORDING_BUCKET || ''
const AGORA_BUCKET_ACCESS_KEY = process.env.AGORA_RECORDING_ACCESS_KEY || ''
const AGORA_BUCKET_SECRET_KEY = process.env.AGORA_RECORDING_SECRET_KEY || ''
const AGORA_BUCKET_REGION = parseInt(process.env.AGORA_RECORDING_REGION || '0', 10)
const AGORA_BUCKET_VENDOR = parseInt(process.env.AGORA_RECORDING_VENDOR || '1', 10)

function agoraAuth(): string {
  return Buffer.from(`${AGORA_CUSTOMER_ID}:${AGORA_CUSTOMER_SECRET}`).toString('base64')
}

async function agoraRequest(path: string, method: string, body?: unknown) {
  const url = `https://api.agora.io/v1/apps/${AGORA_APP_ID}/cloud_recording${path}`
  const res = await fetch(url, {
    method,
    headers: { 'Content-Type': 'application/json', Authorization: `Basic ${agoraAuth()}` },
    body: body ? JSON.stringify(body) : undefined,
  })
  return res.json()
}

async function verifyInstructor(sessionId: string, userId: string) {
  const { data: session, error } = await supabase
    .from('education_sessions')
    .select('id, course_id, status, course:education_courses(instructor:instructor_profiles(user_id))')
    .eq('id', sessionId)
    .single()

  if (error || !session) return { session: null, authorized: false }

  const instructorUserId = (
    (session.course as { instructor?: { user_id?: string } } | null)?.instructor
  )?.user_id
  const admin = await isAdminUser(userId)
  return {
    session,
    authorized: instructorUserId === userId || admin,
  }
}

// ─── GET — status ──────────────────────────────────────────────────────────────
/**
 * GET /api/education/sessions/[id]/recording
 * Returns the current recording row for the session.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireEducationAuth(request)
    if (auth.error) return auth.error

    const { id: sessionId } = await params

    const { data, error } = await (supabase as any)
      .from('session_recordings')
      .select('*')
      .eq('session_id', sessionId)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    return NextResponse.json({ recording: data || null })
  } catch (err) {
    console.error('[Recording] GET error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// ─── POST — start / stop ───────────────────────────────────────────────────────
/**
 * POST /api/education/sessions/[id]/recording
 * Body: { action: 'start'|'stop', channel_name?, token?, uid? }
 * Instructor-only.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireEducationAuth(request)
    if (auth.error) return auth.error
    const userId = auth.user.id

    const { id: sessionId } = await params
    const { action, channel_name, token, uid } = await request.json()

    if (!action || !['start', 'stop'].includes(action)) {
      return NextResponse.json({ error: 'action must be "start" or "stop"' }, { status: 400 })
    }

    const { session, authorized } = await verifyInstructor(sessionId, userId)
    if (!session) return NextResponse.json({ error: 'Session not found' }, { status: 404 })
    if (!authorized) return NextResponse.json({ error: 'Only the instructor can manage recordings' }, { status: 403 })

    // ── START ─────────────────────────────────────────────────────────────────
    if (action === 'start') {
      if (!channel_name || !token || !uid) {
        return NextResponse.json({ error: 'channel_name, token, uid required' }, { status: 400 })
      }

      // Create a recording row
      const { data: recRow, error: recErr } = await (supabase as any)
        .from('session_recordings')
        .insert({
          session_id: sessionId,
          course_id: (session as any).course_id,
          status: 'pending',
        })
        .select()
        .single()

      if (recErr) {
        console.error('[Recording] create row error:', recErr)
        return NextResponse.json({ error: 'Failed to create recording record' }, { status: 500 })
      }

      // Fallback — no Agora credentials
      if (!AGORA_CUSTOMER_ID || !AGORA_CUSTOMER_SECRET) {
        await (supabase as any)
          .from('session_recordings')
          .update({ status: 'recording', started_at: new Date().toISOString(), agora_uid: String(uid) })
          .eq('id', recRow.id)

        return NextResponse.json({ recording_active: true, recording_id: recRow.id, fallback: true })
      }

      // Agora: acquire resource
      const acquireRes = await agoraRequest('/acquire', 'POST', {
        cname: channel_name,
        uid: String(uid),
        clientRequest: { resourceExpiredHour: 24 },
      })

      if (!acquireRes.resourceId) {
        await (supabase as any).from('session_recordings').update({ status: 'failed', error_message: JSON.stringify(acquireRes) }).eq('id', recRow.id)
        return NextResponse.json({ error: 'Failed to acquire Agora resource' }, { status: 500 })
      }

      // Agora: start
      const startRes = await agoraRequest(
        `/resourceid/${acquireRes.resourceId}/mode/mix/start`,
        'POST',
        {
          cname: channel_name,
          uid: String(uid),
          clientRequest: {
            token,
            recordingConfig: {
              maxIdleTime: 300,
              streamTypes: 2,
              audioProfile: 1,
              channelType: 0,
              videoStreamType: 0,
              transcodingConfig: {
                height: 720, width: 1280, bitrate: 2000, fps: 15,
                mixedVideoLayout: 1,
                backgroundColor: '#000000',
              },
            },
            recordingFileConfig: { avFileType: ['hls', 'mp4'] },
            storageConfig: {
              vendor: AGORA_BUCKET_VENDOR,
              region: AGORA_BUCKET_REGION,
              bucket: AGORA_BUCKET_NAME,
              accessKey: AGORA_BUCKET_ACCESS_KEY,
              secretKey: AGORA_BUCKET_SECRET_KEY,
              fileNamePrefix: ['education', sessionId],
            },
          },
        }
      )

      if (!startRes.sid) {
        await (supabase as any).from('session_recordings').update({ status: 'failed', error_message: JSON.stringify(startRes) }).eq('id', recRow.id)
        return NextResponse.json({ error: 'Failed to start Agora recording' }, { status: 500 })
      }

      await (supabase as any)
        .from('session_recordings')
        .update({
          agora_resource_id: acquireRes.resourceId,
          agora_sid: startRes.sid,
          agora_uid: String(uid),
          status: 'recording',
          started_at: new Date().toISOString(),
        })
        .eq('id', recRow.id)

      return NextResponse.json({ recording_active: true, recording_id: recRow.id, resourceId: acquireRes.resourceId, sid: startRes.sid })
    }

    // ── STOP ──────────────────────────────────────────────────────────────────
    if (action === 'stop') {
      const { data: recRow, error: fetchErr } = await (supabase as any)
        .from('session_recordings')
        .select('*')
        .eq('session_id', sessionId)
        .eq('status', 'recording')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle()

      if (fetchErr || !recRow) {
        return NextResponse.json({ message: 'No active recording found', recording_active: false })
      }

      // Fallback — no Agora credentials
      if (!AGORA_CUSTOMER_ID || !AGORA_CUSTOMER_SECRET || !recRow.agora_resource_id) {
        await (supabase as any)
          .from('session_recordings')
          .update({ status: 'stopped', stopped_at: new Date().toISOString() })
          .eq('id', recRow.id)

        return NextResponse.json({ recording_active: false, recording_id: recRow.id, fallback: true })
      }

      const stopRes = await agoraRequest(
        `/resourceid/${recRow.agora_resource_id}/sid/${recRow.agora_sid}/mode/mix/stop`,
        'POST',
        { cname: channel_name, uid: recRow.agora_uid, clientRequest: {} }
      )

      const fileList = stopRes?.serverResponse?.fileList
      let fileUrls: unknown[] = []
      if (typeof fileList === 'string') {
        fileUrls = [{ fileName: fileList }]
      } else if (Array.isArray(fileList)) {
        fileUrls = fileList
      }

      const stoppedAt = new Date().toISOString()
      await (supabase as any)
        .from('session_recordings')
        .update({
          status: 'stopped',
          stopped_at: stoppedAt,
          file_urls: fileUrls.length ? fileUrls : null,
        })
        .eq('id', recRow.id)

      // Also update education_sessions.recording_url for backwards compat
      const mp4 = (fileUrls as { fileName?: string }[]).find(f => f.fileName?.endsWith('.mp4'))
      const primaryUrl = mp4?.fileName || (fileUrls[0] as { fileName?: string })?.fileName || null
      if (primaryUrl) {
        await supabase.from('education_sessions').update({ recording_url: primaryUrl }).eq('id', sessionId)
      }

      return NextResponse.json({ recording_active: false, recording_id: recRow.id, file_urls: fileUrls })
    }
  } catch (err) {
    console.error('[Recording] POST error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
