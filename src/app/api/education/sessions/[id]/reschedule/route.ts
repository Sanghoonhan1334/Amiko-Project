import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { requireEducationAuth } from '@/lib/education-auth'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// POST /api/education/sessions/[id]/reschedule
// Reprograma una sesión, notifica a estudiantes y recalcula recordatorios
// Body: { user_id: string, new_scheduled_at: string, timezone?: string, reason?: string }
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const auth = await requireEducationAuth(request)
    if (auth.error) return auth.error
    const user_id = auth.user.id
    const { new_scheduled_at, timezone, reason } = await request.json()

    if (!new_scheduled_at) {
      return NextResponse.json({ error: 'new_scheduled_at is required' }, { status: 400 })
    }

    // Validar que la nueva fecha sea futura
    const newDate = new Date(new_scheduled_at)
    if (isNaN(newDate.getTime()) || newDate <= new Date()) {
      return NextResponse.json({ error: 'new_scheduled_at must be a valid future date' }, { status: 400 })
    }

    // Obtener sesión con instructor
    const { data: session, error } = await supabase
      .from('education_sessions')
      .select(`
        id, status, scheduled_at, session_number, course_id,
        course:education_courses(
          id, title,
          instructor:instructor_profiles(user_id, display_name)
        )
      `)
      .eq('id', id)
      .single()

    if (error || !session) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 })
    }

    const instructorUserId = (session.course as { instructor?: { user_id?: string } } | null)
      ?.instructor?.user_id

    if (instructorUserId !== user_id) {
      return NextResponse.json({ error: 'Only the instructor can reschedule this session' }, { status: 403 })
    }

    if (['completed', 'live', 'cancelled'].includes(session.status)) {
      return NextResponse.json({
        error: `Session cannot be rescheduled from status "${session.status}"`
      }, { status: 400 })
    }

    // Verificar que no haya conflicto con otra sesión del mismo curso en esa fecha
    const windowStart = new Date(newDate.getTime() - 30 * 60 * 1000)
    const windowEnd = new Date(newDate.getTime() + 90 * 60 * 1000) // 60 min clase + buffer

    const { data: conflicting } = await supabase
      .from('education_sessions')
      .select('id, session_number, scheduled_at')
      .eq('course_id', session.course_id)
      .neq('id', id)
      .neq('status', 'cancelled')
      .gte('scheduled_at', windowStart.toISOString())
      .lte('scheduled_at', windowEnd.toISOString())

    if (conflicting && conflicting.length > 0) {
      return NextResponse.json({
        error: 'New date conflicts with another session in this course',
        conflicting_session: conflicting[0]
      }, { status: 409 })
    }

    // Guardar fecha anterior y actualizar
    const previousScheduledAt = session.scheduled_at
    const { data: updated, error: updateError } = await supabase
      .from('education_sessions')
      .update({
        status: 'rescheduled',
        rescheduled_to: new_scheduled_at,
        scheduled_at: new_scheduled_at,
        timezone_origin: timezone || null
      })
      .eq('id', id)
      .select()
      .single()

    if (updateError) {
      console.error('[Education] reschedule error:', updateError)
      return NextResponse.json({ error: updateError.message }, { status: 500 })
    }

    // Eliminar recordatorios anteriores (se regeneran vía trigger al actualizar scheduled_at)
    await supabase
      .from('education_reminders')
      .delete()
      .eq('session_id', id)
      .eq('sent', false)

    // Notificar a todos los estudiantes inscritos
    const { data: enrollments } = await supabase
      .from('education_enrollments')
      .select('student_id')
      .eq('course_id', session.course_id)
      .eq('payment_status', 'completed')

    const courseTitle = (session.course as { title?: string } | null)?.title || 'curso'
    const newDateDisplay = newDate.toLocaleString('es', { timeZone: timezone || 'UTC', dateStyle: 'medium', timeStyle: 'short' })

    if (enrollments?.length) {
      const notifications = enrollments.map(e => ({
        user_id: e.student_id,
        type: 'education_session_rescheduled',
        title: '📅 Clase reprogramada',
        message: `La clase #${session.session_number} de "${courseTitle}" fue reprogramada para el ${newDateDisplay}.${reason ? ` Motivo: ${reason}` : ''}`,
        link: `/education/class/${session.id}`,
        is_read: false
      }))
      await supabase.from('notifications').insert(notifications)
    }

    return NextResponse.json({
      session: updated,
      previous_scheduled_at: previousScheduledAt,
      new_scheduled_at,
      message: 'Session rescheduled successfully'
    })
  } catch (err) {
    console.error('[Education] reschedule error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
