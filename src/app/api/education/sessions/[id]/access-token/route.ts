import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { requireEducationAuth } from '@/lib/education-auth'
import { RtcTokenBuilder, RtcRole } from 'agora-token'

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
        agora_uid_instructor, course_id,
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
    // Compute a deterministic UID from user_id (stable across reconnects)
    const computedUid = Math.abs(
      user_id.split('-').reduce((acc: number, part: string) => acc ^ parseInt(part, 16), 0)
    ) % 100000 || Math.floor(Math.random() * 100000)

    // For instructor: use stored UID if available, otherwise store the computed one
    const storedInstructorUid = (session as { agora_uid_instructor?: number | null }).agora_uid_instructor
    let uid = computedUid

    if (isInstructor) {
      if (storedInstructorUid) {
        uid = storedInstructorUid
      } else {
        // Persist deterministic UID for future reconnects (non-critical, swallow errors)
        await supabase
          .from('education_sessions')
          .update({ agora_uid_instructor: computedUid })
          .eq('id', id)
          .is('agora_uid_instructor', null)
      }
    }

    const channelName = session.agora_channel || `edu_${session.course_id.slice(0, 8)}_${session.session_number}`

    // Generar token Agora directamente (no HTTP interno — evita problemas de auth)
    const appId = process.env.NEXT_PUBLIC_AGORA_APP_ID || process.env.AGORA_APP_ID
    const appCertificate = process.env.AGORA_APP_CERTIFICATE

    if (!appId || !appCertificate) {
      return NextResponse.json({ error: 'Agora credentials not configured' }, { status: 500 })
    }

    // Token expira al final de la clase + 10 min de gracia
    const expiresAt = new Date(windowClosesAt.getTime() + 10 * 60 * 1000)
    const privilegeExpiredTs = Math.floor(expiresAt.getTime() / 1000)

    const token = RtcTokenBuilder.buildTokenWithUid(
      appId,
      appCertificate,
      channelName,
      uid,
      RtcRole.PUBLISHER,
      privilegeExpiredTs,
      0
    )

    return NextResponse.json({
      app_id: appId,
      channel: channelName,
      uid,
      token,
      role: 'publisher',
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
