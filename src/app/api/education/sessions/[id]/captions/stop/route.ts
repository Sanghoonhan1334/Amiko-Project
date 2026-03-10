import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { requireEducationAuth } from '@/lib/education-auth'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const AGORA_APP_ID = process.env.NEXT_PUBLIC_AGORA_APP_ID || process.env.AGORA_APP_ID || ''
const AGORA_CUSTOMER_ID = process.env.AGORA_CUSTOMER_ID || ''
const AGORA_CUSTOMER_SECRET = process.env.AGORA_CUSTOMER_SECRET || ''

function getAgoraAuth(): string {
  return Buffer.from(`${AGORA_CUSTOMER_ID}:${AGORA_CUSTOMER_SECRET}`).toString('base64')
}

/**
 * POST /api/education/sessions/[id]/captions/stop
 *
 * Stops the active STT task for this session.
 * Only the instructor (or admin) can stop captions.
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

    // 1. Load session for auth check
    const { data: session, error: sessionError } = await supabase
      .from('education_sessions')
      .select(`
        id, course_id,
        course:education_courses(
          instructor:instructor_profiles(user_id)
        )
      `)
      .eq('id', sessionId)
      .single()

    if (sessionError || !session) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 })
    }

    // 2. Only instructor or admin
    const isInstructor = (session.course as { instructor?: { user_id?: string } } | null)
      ?.instructor?.user_id === userId

    if (!isInstructor) {
      const { data: adminCheck } = await supabase
        .from('admin_users')
        .select('id')
        .eq('user_id', userId)
        .single()

      if (!adminCheck) {
        return NextResponse.json({ error: 'Only the instructor can stop captions' }, { status: 403 })
      }
    }

    // 3. Find active STT task
    const { data: activeTask } = await supabase
      .from('education_stt_tasks')
      .select('id, task_id, builder_token, status, agora_channel')
      .eq('session_id', sessionId)
      .in('status', ['active', 'starting'])
      .order('created_at', { ascending: false })
      .limit(1)

    if (!activeTask || activeTask.length === 0) {
      return NextResponse.json({ error: 'No active STT task found' }, { status: 404 })
    }

    const task = activeTask[0]

    // 4. Stop Agora STT task (if real credentials exist)
    if (task.task_id && task.builder_token && AGORA_CUSTOMER_ID && AGORA_CUSTOMER_SECRET && AGORA_APP_ID) {
      try {
        const url = `https://api.agora.io/api/speech-to-text/v1/projects/${AGORA_APP_ID}/tasks/${task.task_id}?builderToken=${task.builder_token}`
        await fetch(url, {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Basic ${getAgoraAuth()}`,
          },
        })
      } catch (err) {
        console.error('[Education STT] Agora stop error (non-fatal):', err)
        // Non-fatal: still mark as stopped locally
      }
    }

    // 5. Mark task as stopped
    const now = new Date().toISOString()
    await supabase
      .from('education_stt_tasks')
      .update({ status: 'stopped', stopped_at: now })
      .eq('id', task.id)

    return NextResponse.json({
      task_id: task.id,
      status: 'stopped',
      stopped_at: now,
    })
  } catch (err) {
    console.error('[Education STT] stop error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
