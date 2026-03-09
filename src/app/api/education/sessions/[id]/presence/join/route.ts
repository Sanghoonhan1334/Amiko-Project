import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { requireEducationAuth } from '@/lib/education-auth'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// POST /api/education/sessions/[id]/presence/join
// Registra el ingreso de un participante a la sesión.
// Llamar DESPUÉS de obtener el token vía access-token.
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
        id, status, session_number, scheduled_at, duration_minutes, course_id,
        course:education_courses(
          id, instructor_id,
          instructor:instructor_profiles(user_id)
        )
      `)
      .eq('id', id)
      .single()

    if (error || !session) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 })
    }

    if (['cancelled', 'rescheduled', 'completed'].includes(session.status)) {
      return NextResponse.json({
        error: `Session is ${session.status}. Cannot join.`
      }, { status: 400 })
    }

    const instructor = (session.course as { instructor?: { user_id?: string } } | null)?.instructor
    const isInstructor = instructor?.user_id === user_id

    const now = new Date().toISOString()

    if (!isInstructor) {
      // Verificar inscripción
      const { data: enrollment } = await supabase
        .from('education_enrollments')
        .select('id, payment_status')
        .eq('course_id', session.course_id)
        .eq('student_id', user_id)
        .single()

      if (!enrollment || enrollment.payment_status !== 'completed') {
        return NextResponse.json({ error: 'Not enrolled in this course' }, { status: 403 })
      }

      // Registrar/actualizar presencia del estudiante
      await supabase
        .from('education_attendance')
        .upsert({
          session_id: id,
          student_id: user_id,
          status: 'joined',
          joined_at: now
        }, { onConflict: 'session_id,student_id' })
    } else {
      // Si el instructor entra y la sesión está en scheduled/ready, pasarla a live
      if (['scheduled', 'ready'].includes(session.status)) {
        await supabase
          .from('education_sessions')
          .update({ status: 'live', started_at: now })
          .eq('id', id)
      }
    }

    return NextResponse.json({
      success: true,
      joined_at: now,
      session_id: id,
      is_instructor: isInstructor,
      session_status: isInstructor && ['scheduled', 'ready'].includes(session.status) ? 'live' : session.status
    })
  } catch (err) {
    console.error('[Education] presence/join error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
