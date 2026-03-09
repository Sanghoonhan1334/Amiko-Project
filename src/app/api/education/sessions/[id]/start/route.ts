import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { requireEducationAuth } from '@/lib/education-auth'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// POST /api/education/sessions/[id]/start
// Inicia oficialmente la sesión. Solo puede ser llamado por el instructor o por el sistema.
// Body: { user_id: string }
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const auth = await requireEducationAuth(request)
    if (auth.error) return auth.error
    const user_id = auth.user.id

    const { data: session, error } = await supabase
      .from('education_sessions')
      .select(`
        id, status, session_number, scheduled_at, duration_minutes, agora_channel,
        course_id,
        course:education_courses(
          id, title, instructor_id,
          instructor:instructor_profiles(user_id, display_name)
        )
      `)
      .eq('id', id)
      .single()

    if (error || !session) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 })
    }

    const isInstructor = (session.course as { instructor?: { user_id?: string } } | null)
      ?.instructor?.user_id === user_id

    if (!isInstructor) {
      return NextResponse.json({ error: 'Only the instructor can start the session' }, { status: 403 })
    }

    if (!['scheduled', 'ready'].includes(session.status)) {
      return NextResponse.json({
        error: `Session cannot be started from status "${session.status}"`
      }, { status: 400 })
    }

    const now = new Date()
    const scheduledAt = new Date(session.scheduled_at)
    // Permitir iniciar hasta 30 min antes
    const earliestStart = new Date(scheduledAt.getTime() - 30 * 60 * 1000)

    if (now < earliestStart) {
      return NextResponse.json({
        error: 'Too early to start the session. You can start up to 30 minutes before the scheduled time.',
        earliest_start: earliestStart.toISOString()
      }, { status: 425 })
    }

    const { data: updated, error: updateError } = await supabase
      .from('education_sessions')
      .update({
        status: 'live',
        started_at: now.toISOString()
      })
      .eq('id', id)
      .select()
      .single()

    if (updateError) {
      console.error('[Education] session start error:', updateError)
      return NextResponse.json({ error: updateError.message }, { status: 500 })
    }

    // Notificar a los estudiantes inscritos que la clase inició
    const { data: enrollments } = await supabase
      .from('education_enrollments')
      .select('student_id')
      .eq('course_id', session.course_id)
      .eq('payment_status', 'completed')

    if (enrollments?.length) {
      const courseTitle = (session.course as { title?: string } | null)?.title || 'clase'
      const notifications = enrollments.map(e => ({
        user_id: e.student_id,
        type: 'education_session_started',
        title: '🔴 ¡Clase en vivo ahora!',
        message: `La clase #${session.session_number} de "${courseTitle}" está en curso. ¡Únete ahora!`,
        link: `/education/class/${session.id}`,
        is_read: false
      }))
      await supabase.from('notifications').insert(notifications)
    }

    return NextResponse.json({
      session: updated,
      started_at: now.toISOString(),
      ends_at: new Date(now.getTime() + (session.duration_minutes || 60) * 60 * 1000).toISOString()
    })
  } catch (err) {
    console.error('[Education] session start error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
