import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { requireEducationAuth } from '@/lib/education-auth'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// GET /api/education/sessions/[id]/access-status?userId=xxx
// Verifica si el usuario puede entrar a esta sesión y en qué ventana de tiempo está
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const auth = await requireEducationAuth(request)
    if (auth.error) return auth.error
    const userId = auth.user.id

    // Obtener sesión con datos del curso
    const { data: session, error } = await supabase
      .from('education_sessions')
      .select(`
        id, session_number, title, status, scheduled_at, duration_minutes,
        course_id, agora_channel,
        course:education_courses(
          id, status, instructor_id, title,
          instructor:instructor_profiles(user_id)
        )
      `)
      .eq('id', id)
      .single()

    if (error || !session) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 })
    }

    const now = new Date()
    const scheduledAt = new Date(session.scheduled_at)
    const durationMs = (session.duration_minutes || 60) * 60 * 1000

    // Calcular ventana: abre 15 min antes, cierra al final de la clase
    const windowOpensAt = new Date(scheduledAt.getTime() - 15 * 60 * 1000)
    const windowClosesAt = new Date(scheduledAt.getTime() + durationMs)

    // Determinar rol
    const isInstructor = (session.course as { instructor?: { user_id?: string } } | null)
      ?.instructor?.user_id === userId

    let viewerRole: 'instructor' | 'student' | 'none' = 'none'
    let isEnrolled = false

    if (isInstructor) {
      viewerRole = 'instructor'
      isEnrolled = true
    } else {
      const { data: enrollment } = await supabase
        .from('education_enrollments')
        .select('id, enrollment_status, payment_status')
        .eq('course_id', session.course_id)
        .eq('student_id', userId)
        .single()

      if (enrollment && enrollment.payment_status === 'completed') {
        viewerRole = 'student'
        isEnrolled = true
      }
    }

    // Calcular si puede entrar
    let canEnter = false
    let reason: string | null = null

    if (!isEnrolled) {
      reason = 'not_enrolled'
    } else if (['cancelled', 'rescheduled'].includes(session.status)) {
      reason = 'session_unavailable'
    } else if (session.status === 'completed') {
      reason = 'session_ended'
    } else if (now < windowOpensAt) {
      reason = 'too_early'
    } else if (now > windowClosesAt && session.status !== 'live') {
      reason = 'window_closed'
    } else {
      canEnter = true
    }

    return NextResponse.json({
      can_enter: canEnter,
      reason,
      session_status: session.status,
      viewer_role: viewerRole,
      is_enrolled: isEnrolled,
      session_id: session.id,
      course_id: session.course_id,
      session_number: session.session_number,
      title: session.title,
      window_opens_at: windowOpensAt.toISOString(),
      window_closes_at: windowClosesAt.toISOString(),
      scheduled_at: session.scheduled_at,
      duration_minutes: session.duration_minutes,
      minutes_until_open: canEnter ? 0 : Math.max(0, Math.ceil((windowOpensAt.getTime() - now.getTime()) / 60000))
    })
  } catch (err) {
    console.error('[Education] access-status error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
