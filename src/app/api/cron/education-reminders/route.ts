import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { sendEducationReminderEmail } from '@/lib/education-email'

// Cron job endpoint para enviar recordatorios de clases
// Se debe configurar en Vercel Cron o similar para ejecutarse cada 15 minutos
// 수업 알림 크론잡 - 15분마다 실행하도록 Vercel Cron 설정 필요

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(req: Request) {
  // Verificar cron secret para seguridad
  const authHeader = req.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const now = new Date()
    const results = {
      reminders24h: 0,
      reminders1h: 0,
      reminders15m: 0,
      errors: [] as string[]
    }

    // 24시간 전 알림
    const in24h = new Date(now.getTime() + 24 * 60 * 60 * 1000)
    const in24hEnd = new Date(in24h.getTime() + 15 * 60 * 1000)

    const { data: sessions24h } = await supabase
      .from('education_sessions')
      .select(`
        id, title, session_number, scheduled_at, duration_minutes,
        course:education_courses!inner(id, title, instructor_id, instructor:instructor_profiles(user_id))
      `)
      .eq('status', 'scheduled')
      .gte('scheduled_at', in24h.toISOString())
      .lt('scheduled_at', in24hEnd.toISOString())

    if (sessions24h?.length) {
      for (const session of sessions24h) {
        const sent = await sendReminders(session, '24h')
        results.reminders24h += sent
      }
    }

    // 1시간 전 알림
    const in1h = new Date(now.getTime() + 60 * 60 * 1000)
    const in1hEnd = new Date(in1h.getTime() + 15 * 60 * 1000)

    const { data: sessions1h } = await supabase
      .from('education_sessions')
      .select(`
        id, title, session_number, scheduled_at, duration_minutes,
        course:education_courses!inner(id, title, instructor_id, instructor:instructor_profiles(user_id))
      `)
      .eq('status', 'scheduled')
      .gte('scheduled_at', in1h.toISOString())
      .lt('scheduled_at', in1hEnd.toISOString())

    if (sessions1h?.length) {
      for (const session of sessions1h) {
        const sent = await sendReminders(session, '1h')
        results.reminders1h += sent
      }
    }

    // 15분 전 알림
    const in15m = new Date(now.getTime() + 15 * 60 * 1000)
    const in15mEnd = new Date(in15m.getTime() + 15 * 60 * 1000)

    const { data: sessions15m } = await supabase
      .from('education_sessions')
      .select(`
        id, title, session_number, scheduled_at, duration_minutes,
        course:education_courses!inner(id, title, instructor_id, instructor:instructor_profiles(user_id))
      `)
      .eq('status', 'scheduled')
      .gte('scheduled_at', in15m.toISOString())
      .lt('scheduled_at', in15mEnd.toISOString())

    if (sessions15m?.length) {
      for (const session of sessions15m) {
        const sent = await sendReminders(session, '15min')
        results.reminders15m += sent
      }
    }

    return NextResponse.json({
      ok: true,
      timestamp: now.toISOString(),
      ...results
    })
  } catch (error) {
    console.error('Cron education reminders error:', error)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function sendReminders(
  session: any,
  type: '24h' | '1h' | '15min'
): Promise<number> {
  const courseId = session.course?.id
  if (!courseId) return 0

  // Obtener estudiantes inscritos activos con pago completado
  const { data: enrollments } = await supabase
    .from('education_enrollments')
    .select('student_id')
    .eq('course_id', courseId)
    .in('enrollment_status', ['active', 'enrolled'])
    .eq('payment_status', 'completed')

  if (!enrollments?.length) return 0

  // Comprobar si ya se envió este recordatorio (usando la tabla de seguimiento del cron)
  const { data: alreadySent } = await supabase
    .from('education_reminder_sends')
    .select('id')
    .eq('session_id', session.id)
    .eq('reminder_type', type)
    .limit(1)

  if (alreadySent?.length) return 0

  // Registrar el envío en education_reminder_sends ANTES de enviar
  // para evitar envíos dobles si el cron se ejecuta en paralelo
  const { error: insertSendError } = await supabase
    .from('education_reminder_sends')
    .insert({
      session_id: session.id,
      reminder_type: type,
      recipients: enrollments.length
    })

  // Si el insert falla por duplicado, otro worker ya lo procesó
  if (insertSendError) {
    if (insertSendError.code === '23505') return 0 // unique violation
    console.error(`[Education Cron] reminder_sends insert error:`, insertSendError)
    return 0
  }

  // Construir notificaciones para estudiantes
  const courseTitle = session.course.title as string
  const sessionLabel = session.title || `Sesión ${session.session_number}`

  const titleByType = {
    '24h':   `📚 Tu clase "${courseTitle}" es mañana`,
    '1h':    `⏰ Tu clase "${courseTitle}" comienza en 1 hora`,
    '15min': `🔔 Tu clase "${courseTitle}" comienza en 15 minutos`
  }

  const notifications = enrollments.map(enrollment => ({
    user_id: enrollment.student_id,
    type: 'education_reminder',
    title: titleByType[type],
    message: `${sessionLabel} — ${new Date(session.scheduled_at).toLocaleString('es', { dateStyle: 'medium', timeStyle: 'short' })}`,
    link: `/education/class/${session.id}`,
    is_read: false
  }))

  // Añadir notificación para el instructor
  const instructorUserId = (session.course?.instructor as { user_id?: string } | null)?.user_id
  if (instructorUserId) {
    notifications.push({
      user_id: instructorUserId,
      type: 'education_reminder',
      title: titleByType[type],
      message: `${sessionLabel} — ${enrollments.length} estudiantes inscritos`,
      link: `/education/class/${session.id}`,
      is_read: false
    })
  }

  const { error: notifError } = await supabase
    .from('notifications')
    .insert(notifications)

  if (notifError) {
    console.error(`[Education Cron] Error inserting reminders for session ${session.id}:`, notifError)
    // Revertir el registro de envío para que pueda reintentarse
    await supabase
      .from('education_reminder_sends')
      .delete()
      .eq('session_id', session.id)
      .eq('reminder_type', type)
    return 0
  }

  // Enviar email a cada estudiante
  for (const enrollment of enrollments) {
    try {
      const { data: profile } = await supabase
        .from('profiles')
        .select('email, username, full_name')
        .eq('id', enrollment.student_id)
        .single()

      if (profile?.email) {
        await sendEducationReminderEmail(
          profile.email,
          profile.full_name || profile.username || 'Estudiante',
          courseTitle,
          sessionLabel,
          session.session_number,
          session.scheduled_at,
          type
        )
      }
    } catch (emailErr) {
      console.error(`[Education Cron] Email error for student ${enrollment.student_id}:`, emailErr)
    }
  }

  return notifications.length
}
