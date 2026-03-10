import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { requireEducationAuth } from '@/lib/education-auth'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// Agora Real-Time STT API configuration
const AGORA_APP_ID = process.env.NEXT_PUBLIC_AGORA_APP_ID || process.env.AGORA_APP_ID || ''
const AGORA_CUSTOMER_ID = process.env.AGORA_CUSTOMER_ID || ''
const AGORA_CUSTOMER_SECRET = process.env.AGORA_CUSTOMER_SECRET || ''

function getAgoraAuth(): string {
  return Buffer.from(`${AGORA_CUSTOMER_ID}:${AGORA_CUSTOMER_SECRET}`).toString('base64')
}

/**
 * POST /api/education/sessions/[id]/captions/start
 *
 * Starts Agora Real-Time STT for the session.
 * Only the instructor (or admin) can start captions.
 *
 * Body: { languages?: string[] }
 *   languages: ISO 639-1 codes for expected spoken languages (default: course teaching_language)
 *
 * Flow:
 *   1. Validate session is live
 *   2. Check no active STT task exists
 *   3. Acquire Agora STT resource → start transcription task
 *   4. Store task metadata in education_stt_tasks
 *   5. Return task info
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: sessionId } = await params
    const auth = await requireEducationAuth(request)
    if (auth.error) return auth.error
    const userId = auth.user.id

    const body = await request.json().catch(() => ({}))
    const requestedLanguages: string[] = body.languages || []

    // 1. Load the session + course + instructor
    const { data: session, error: sessionError } = await supabase
      .from('education_sessions')
      .select(`
        id, status, agora_channel, course_id, duration_minutes,
        course:education_courses(
          id, teaching_language, status,
          instructor:instructor_profiles(user_id)
        )
      `)
      .eq('id', sessionId)
      .single()

    if (sessionError || !session) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 })
    }

    // 2. Only live sessions
    if (session.status !== 'live') {
      return NextResponse.json({
        error: `Session is ${session.status}. Captions can only start on a live session.`
      }, { status: 400 })
    }

    // 3. Only instructor or admin
    const course = session.course as {
      id: string
      teaching_language: string
      instructor?: { user_id?: string }
    } | null

    const isInstructor = course?.instructor?.user_id === userId
    if (!isInstructor) {
      // Check admin
      const { data: adminCheck } = await supabase
        .from('admin_users')
        .select('id')
        .eq('user_id', userId)
        .single()

      if (!adminCheck) {
        return NextResponse.json({ error: 'Only the instructor can start captions' }, { status: 403 })
      }
    }

    // 4. Check for existing active task
    const { data: existingTask } = await supabase
      .from('education_stt_tasks')
      .select('id, status, task_id')
      .eq('session_id', sessionId)
      .in('status', ['pending', 'starting', 'active'])
      .limit(1)

    if (existingTask && existingTask.length > 0) {
      return NextResponse.json({
        error: 'STT task already active for this session',
        task: existingTask[0]
      }, { status: 409 })
    }

    // 5. Determine languages
    const sourceLanguages = requestedLanguages.length > 0
      ? requestedLanguages
      : [mapTeachingLanguage(course?.teaching_language || 'ko')]

    const channelName = session.agora_channel || `edu_${session.course_id.slice(0, 8)}_1`

    // 6. Generate a deterministic UID for the STT bot (distinct from any user)
    const sttBotUid = 999900 + Math.floor(Math.random() * 99)

    // 7. Create task record first (status: starting)
    const { data: sttTask, error: taskError } = await supabase
      .from('education_stt_tasks')
      .insert({
        session_id: sessionId,
        course_id: session.course_id,
        status: 'starting',
        source_languages: sourceLanguages,
        agora_channel: channelName,
        agora_uid: sttBotUid,
        created_by: userId,
      })
      .select()
      .single()

    if (taskError) {
      console.error('[Education STT] Task creation failed:', taskError)
      return NextResponse.json({ error: 'Failed to create STT task' }, { status: 500 })
    }

    // 8. Start Agora Real-Time STT (or fallback if credentials missing)
    if (!AGORA_CUSTOMER_ID || !AGORA_CUSTOMER_SECRET || !AGORA_APP_ID) {
      // Fallback: mark as active without real Agora call (dev mode)
      await supabase
        .from('education_stt_tasks')
        .update({ status: 'active', started_at: new Date().toISOString() })
        .eq('id', sttTask.id)

      return NextResponse.json({
        task_id: sttTask.id,
        status: 'active',
        source_languages: sourceLanguages,
        channel: channelName,
        fallback: true,
        message: 'STT task started in fallback mode (Agora credentials not configured)'
      }, { status: 201 })
    }

    try {
      // Acquire resource
      const acquireRes = await agoraSttRequest('/acquire', 'POST', {
        instanceId: sttTask.id.replace(/-/g, '').slice(0, 32),
      })

      if (!acquireRes.tokenName) {
        throw new Error(`Acquire failed: ${JSON.stringify(acquireRes)}`)
      }

      const builderToken = acquireRes.tokenName

      // Start transcription
      const startRes = await agoraSttRequest(
        `/tasks?builderToken=${builderToken}`,
        'POST',
        {
          audio: {
            subscribeSource: 'AGORARTC',
            agoraRtcConfig: {
              channelName,
              uid: String(sttBotUid),
              channelType: 'LIVE_TYPE',
              subscribeAudioUids: ['#allStream#'],
              // Token for STT bot to join the channel
              token: await generateSttBotToken(channelName, sttBotUid, session.duration_minutes || 60),
            },
          },
          config: {
            features: ['RECOGNIZE'],
            recognizeConfig: {
              language: sourceLanguages[0] === 'ko' ? 'ko-KR' : sourceLanguages[0] === 'es' ? 'es-ES' : 'en-US',
              profanityFilter: false,
              output: {
                destinations: ['AgoraRTCDataStream'],
                agoraRTCDataStream: {
                  channelName,
                  uid: String(sttBotUid),
                },
              },
            },
          },
        }
      )

      if (!startRes.taskId) {
        throw new Error(`Start failed: ${JSON.stringify(startRes)}`)
      }

      // Update task with Agora metadata
      await supabase
        .from('education_stt_tasks')
        .update({
          task_id: startRes.taskId,
          builder_token: builderToken,
          status: 'active',
          started_at: new Date().toISOString(),
        })
        .eq('id', sttTask.id)

      return NextResponse.json({
        task_id: sttTask.id,
        agora_task_id: startRes.taskId,
        status: 'active',
        source_languages: sourceLanguages,
        channel: channelName,
      }, { status: 201 })
    } catch (err: any) {
      // Mark task as failed but don't block the session
      console.error('[Education STT] Agora STT start error:', err)
      await supabase
        .from('education_stt_tasks')
        .update({ status: 'failed', error_message: err.message || 'Unknown error' })
        .eq('id', sttTask.id)

      return NextResponse.json({
        error: 'STT start failed. The class continues without captions.',
        details: err.message,
        session_continues: true,
      }, { status: 502 })
    }
  } catch (err) {
    console.error('[Education STT] start error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// ── Helpers ──────────────────────────────────────────

function mapTeachingLanguage(lang: string): string {
  const map: Record<string, string> = { ko: 'ko', korean: 'ko', es: 'es', spanish: 'es', en: 'en', bilingual: 'ko' }
  return map[lang] || lang
}

async function agoraSttRequest(path: string, method: string, body?: unknown) {
  const url = `https://api.agora.io/api/speech-to-text/v1/projects/${AGORA_APP_ID}${path}`
  const res = await fetch(url, {
    method,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Basic ${getAgoraAuth()}`,
    },
    body: body ? JSON.stringify(body) : undefined,
  })
  return res.json()
}

async function generateSttBotToken(channel: string, uid: number, durationMinutes: number): Promise<string> {
  // Build an RTC token for the STT bot to join the channel
  const { RtcTokenBuilder, RtcRole } = await import('agora-token')
  const appId = AGORA_APP_ID
  const appCertificate = process.env.AGORA_APP_CERTIFICATE || ''
  if (!appCertificate) return ''

  const expireSeconds = Math.max((durationMinutes + 15) * 60, 600)
  return RtcTokenBuilder.buildTokenWithUid(
    appId, appCertificate, channel, uid,
    RtcRole.SUBSCRIBER, expireSeconds, expireSeconds
  )
}
