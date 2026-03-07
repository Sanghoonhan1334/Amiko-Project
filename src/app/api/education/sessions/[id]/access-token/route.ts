import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { requireEducationAuth } from '@/lib/education-auth'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// POST /api/education/sessions/[id]/access-token
// Genera un token Agora efímero para entrar a la sesión.
// Separado del join/presence para que el frontend pueda obtener el token
// antes de mostrar la interfaz de videollamada.
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

    // Obtener sesión
    const { data: session, error } = await supabase
      .from('education_sessions')
      .select(`
        id, session_number, status, scheduled_at, duration_minutes, agora_channel,
        course_id,
        course:education_courses(
          id, status, allow_recording,
          instructor:instructor_profiles(user_id)
        )
      `)
      .eq('id', id)
      .single()

    if (error || !session) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 })
    }

    // Verificar que la sesión no esté cancelada o completada
    if (['cancelled', 'rescheduled', 'completed'].includes(session.status)) {
      return NextResponse.json({
        error: `Session is ${session.status}. Token cannot be issued.`
      }, { status: 400 })
    }

    // Verificar ventana de acceso (15 min antes hasta fin de clase)
    const now = new Date()
    const scheduledAt = new Date(session.scheduled_at)
    const windowOpensAt = new Date(scheduledAt.getTime() - 15 * 60 * 1000)
    const windowClosesAt = new Date(scheduledAt.getTime() + (session.duration_minutes || 60) * 60 * 1000)

    const isInstructor = (session.course as { instructor?: { user_id?: string } } | null)
      ?.instructor?.user_id === user_id

    if (!isInstructor) {
      // Verificar inscripción activa
      const { data: enrollment } = await supabase
        .from('education_enrollments')
        .select('id, payment_status, enrollment_status')
        .eq('course_id', session.course_id)
        .eq('student_id', user_id)
        .single()

      if (!enrollment || enrollment.payment_status !== 'completed') {
        return NextResponse.json({ error: 'Not enrolled in this course' }, { status: 403 })
      }

      if (enrollment.enrollment_status === 'blocked') {
        return NextResponse.json({ error: 'Access blocked' }, { status: 403 })
      }

      // Validar ventana
      if (now < windowOpensAt) {
        return NextResponse.json({
          error: 'Too early. Access window has not opened yet.',
          window_opens_at: windowOpensAt.toISOString(),
          minutes_until_open: Math.ceil((windowOpensAt.getTime() - now.getTime()) / 60000)
        }, { status: 425 })
      }

      if (now > windowClosesAt && session.status !== 'live') {
        return NextResponse.json({
          error: 'Access window has closed.',
          window_closed_at: windowClosesAt.toISOString()
        }, { status: 410 })
      }
    }

    // Generar UID numérico único para Agora basado en user_id (determinístico)
    const uid = Math.abs(
      user_id.split('-').reduce((acc: number, part: string) => acc ^ parseInt(part, 16), 0)
    ) % 100000 || Math.floor(Math.random() * 100000)

    const channelName = session.agora_channel || `edu_${session.course_id.slice(0, 8)}_${session.session_number}`

    // Solicitar token al endpoint Agora existente
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
    const tokenResponse = await fetch(`${appUrl}/api/agora/token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ channelName, uid })
    })

    const tokenData = await tokenResponse.json()

    // Duración del token: hasta que termine la clase + 10 min de gracia
    const expiresAt = new Date(windowClosesAt.getTime() + 10 * 60 * 1000)

    return NextResponse.json({
      app_id: process.env.NEXT_PUBLIC_AGORA_APP_ID,
      channel: channelName,
      uid,
      token: tokenData.token,
      role: isInstructor ? 'publisher' : 'publisher',
      is_instructor: isInstructor,
      allow_recording: (session.course as { allow_recording?: boolean } | null)?.allow_recording || false,
      expires_at: expiresAt.toISOString(),
      session: {
        id: session.id,
        status: session.status,
        session_number: session.session_number,
        scheduled_at: session.scheduled_at,
        duration_minutes: session.duration_minutes
      }
    })
  } catch (err) {
    console.error('[Education] access-token error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
