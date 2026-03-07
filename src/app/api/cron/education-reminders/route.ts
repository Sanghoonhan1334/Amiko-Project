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

async function sendReminders(
  session: any,
  type: '24h' | '1h' | '15min'
): Promise<number> {
  const courseId = session.course?.id
  if (!courseId) return 0

  // 해당 과정에 등록된 학생 조회
  const { data: enrollments } = await supabase
    .from('education_enrollments')
    .select('student_id')
    .eq('course_id', courseId)
    .eq('enrollment_status', 'active')
    .eq('payment_status', 'completed')

  if (!enrollments?.length) return 0

  // 이미 보낸 알림인지 확인
  const { data: existingReminder } = await supabase
    .from('education_reminders')
    .select('id')
    .eq('session_id', session.id)
    .eq('reminder_type', type)
    .eq('sent', true)
    .limit(1)

  if (existingReminder?.length) return 0

  // 알림 생성 또는 업데이트
  const reminderData = {
    session_id: session.id,
    reminder_type: type,
    scheduled_for: session.scheduled_at,
    sent: true,
    sent_at: new Date().toISOString()
  }

  await supabase
    .from('education_reminders')
    .upsert(reminderData, { onConflict: 'session_id,reminder_type' })

  // 앱 내 알림 생성 (각 학생에게)
  const notifications = enrollments.map(enrollment => ({
    user_id: enrollment.student_id,
    type: 'education_reminder',
    title: type === '24h'
      ? `📚 Tu clase "${session.course.title}" es mañana`
      : type === '1h'
        ? `⏰ Tu clase "${session.course.title}" comienza en 1 hora`
        : `🔔 Tu clase "${session.course.title}" comienza en 15 minutos`,
    message: `Sesión ${session.session_number}: ${session.title || session.course.title}`,
    link: `/education/class/${session.id}`,
    is_read: false
  }))

  // Send notification to instructor using their auth user_id
  const instructorUserIdFromProfile = (session.course?.instructor as { user_id?: string } | null)?.user_id
  if (instructorUserIdFromProfile) {
    notifications.push({
      user_id: instructorUserIdFromProfile,
      type: 'education_reminder',
      title: type === '24h'
        ? `📚 Tu clase "${session.course.title}" es mañana`
        : type === '1h'
          ? `⏰ Tu clase "${session.course.title}" comienza en 1 hora`
          : `🔔 Tu clase "${session.course.title}" comienza en 15 minutos`,
      message: `Sesión ${session.session_number}: ${session.title || session.course.title} - ${enrollments.length} estudiantes`,
      link: `/education/class/${session.id}`,
      is_read: false
    })
  }

  const { error } = await supabase
    .from('notifications')
    .insert(notifications)

  if (error) {
    console.error(`Error sending ${type} reminders for session ${session.id}:`, error)
    return 0
  }

  // Also send email reminders to enrolled students
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
          session.course.title,
          session.title || session.course.title,
          session.session_number,
          session.scheduled_at,
          type
        )
      }
    } catch (emailErr) {
      console.error(`Error sending email to student ${enrollment.student_id}:`, emailErr)
    }
  }

  return notifications.length
}
