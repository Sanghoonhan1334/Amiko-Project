import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { requireEducationAuth } from '@/lib/education-auth'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// POST /api/education/sessions/[id]/cancel
// Cancela una sesión individual. Solo instructor o admin.
// Body: { user_id: string, reason: string, replacement_scheduled_at?: string }
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const auth = await requireEducationAuth(request)
    if (auth.error) return auth.error
    const user_id = auth.user.id
    const { reason, replacement_scheduled_at } = await request.json()

    if (!reason) {
      return NextResponse.json({ error: 'reason is required' }, { status: 400 })
    }

    const { data: session, error } = await supabase
      .from('education_sessions')
      .select(`
        id, status, session_number, scheduled_at, course_id,
        course:education_courses(
          id, title,
          instructor:instructor_profiles(user_id)
        )
      `)
      .eq('id', id)
      .single()

    if (error || !session) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 })
    }

    const instructorUserId = (session.course as { instructor?: { user_id?: string } } | null)
      ?.instructor?.user_id

    // Verificar que sea instructor o admin
    const isInstructor = instructorUserId === user_id
    if (!isInstructor) {
      // Verificar si es admin
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user_id)
        .single()

      if (profile?.role !== 'admin') {
        return NextResponse.json({ error: 'Only the instructor or an admin can cancel this session' }, { status: 403 })
      }
    }

    if (['completed', 'cancelled'].includes(session.status)) {
      return NextResponse.json({
        error: `Session is already ${session.status}`
      }, { status: 400 })
    }

    // Cancelar sesión
    const { data: updated, error: updateError } = await supabase
      .from('education_sessions')
      .update({ status: 'cancelled' })
      .eq('id', id)
      .select()
      .single()

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 })
    }

    // Eliminar recordatorios pendientes
    await supabase
      .from('education_reminders')
      .delete()
      .eq('session_id', id)
      .eq('sent', false)

    // Notificar a estudiantes
    const { data: enrollments } = await supabase
      .from('education_enrollments')
      .select('student_id')
      .eq('course_id', session.course_id)
      .eq('payment_status', 'completed')

    const courseTitle = (session.course as { title?: string } | null)?.title || 'curso'
    const replacementMsg = replacement_scheduled_at
      ? ` Se reprogramará para otra fecha.`
      : ''

    if (enrollments?.length) {
      const notifications = enrollments.map(e => ({
        user_id: e.student_id,
        type: 'education_session_cancelled',
        title: '⚠️ Clase cancelada',
        message: `La clase #${session.session_number} de "${courseTitle}" fue cancelada. Motivo: ${reason}.${replacementMsg}`,
        link: `/education/class/${session.id}`,
        is_read: false
      }))
      await supabase.from('notifications').insert(notifications)
    }

    // Si se provee fecha de reposición, crear nueva sesión
    let replacementSession = null
    if (replacement_scheduled_at) {
      const replacementDate = new Date(replacement_scheduled_at)
      if (replacementDate > new Date()) {
        const { data: newSession } = await supabase
          .from('education_sessions')
          .insert({
            course_id: session.course_id,
            session_number: session.session_number,
            title: `Reposición - Clase #${session.session_number}`,
            scheduled_at: replacement_scheduled_at,
            duration_minutes: 60,
            agora_channel: `edu_${session.course_id.slice(0, 8)}_${session.session_number}_r`,
            status: 'scheduled'
          })
          .select()
          .single()
        replacementSession = newSession
      }
    }

    return NextResponse.json({
      session: updated,
      replacement_session: replacementSession,
      message: 'Session cancelled successfully'
    })
  } catch (err) {
    console.error('[Education] session cancel error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
