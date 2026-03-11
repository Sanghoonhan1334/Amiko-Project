import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// Simple shared secret to protect this endpoint (set AUTO_END_SECRET in env)
// Call this from a cron job: GET /api/education/sessions/auto-end?secret=<AUTO_END_SECRET>
// Recommended frequency: every 5 minutes.

/**
 * GET /api/education/sessions/auto-end
 *
 * Auto-closes sessions that are still in 'live' status but whose scheduled
 * end time has passed by more than 10 minutes (grace period).
 *
 * This protects against instructors who disconnect without ending the class.
 *
 * Protected by a shared secret specified in AUTO_END_SECRET env var.
 * Can be invoked by Vercel Cron, GitHub Actions, Supabase Edge Function, etc.
 */
export async function GET(request: NextRequest) {
  const secret = process.env.AUTO_END_SECRET
  const providedSecret = request.nextUrl.searchParams.get('secret')

  if (!secret || providedSecret !== secret) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const now = new Date()
    // Only auto-close sessions that ended > 10 minutes ago (grace period)
    const gracePeriodMs = 10 * 60 * 1000

    // Find all live sessions
    const { data: liveSessions, error: fetchError } = await supabase
      .from('education_sessions')
      .select('id, session_number, course_id, scheduled_at, duration_minutes, started_at')
      .eq('status', 'live')

    if (fetchError) {
      console.error('[AutoEnd] Failed to fetch live sessions:', fetchError)
      return NextResponse.json({ error: fetchError.message }, { status: 500 })
    }

    // Also find scheduled sessions the instructor never started (no-show)
    const { data: noShowSessions } = await supabase
      .from('education_sessions')
      .select(`
        id, session_number, course_id, scheduled_at, duration_minutes,
        course:education_courses(title, instructor_id, instructor:instructor_profiles(user_id))
      `)
      .eq('status', 'scheduled')
      .is('started_at', null)

    const noShowIds: string[] = []
    if (noShowSessions) {
      for (const session of noShowSessions) {
        const scheduledAt = new Date(session.scheduled_at)
        const durationMs = (session.duration_minutes || 60) * 60 * 1000
        const expiredMs = now.getTime() - (scheduledAt.getTime() + durationMs)
        if (expiredMs < gracePeriodMs) continue  // hasn't expired yet

        // Mark session as cancelled (instructor no-show)
        await supabase
          .from('education_sessions')
          .update({ status: 'cancelled', ended_at: now.toISOString() })
          .eq('id', session.id)

        noShowIds.push(session.id)

        // Notify enrolled students
        const { data: enrollments } = await supabase
          .from('education_enrollments')
          .select('student_id')
          .eq('course_id', session.course_id)
          .eq('payment_status', 'completed')

        if (enrollments?.length) {
          await supabase.from('notifications').insert(
            enrollments.map((e: { student_id: string }) => ({
              user_id: e.student_id,
              type: 'education_instructor_no_show',
              title: '⚠️ Clase cancelada por ausencia del instructor',
              message: `El instructor no se presentó a la sesión #${session.session_number}. Nos pondremos en contacto contigo para reagendar o tramitar un reembolso.`,
              link: `/education/class/${session.id}`,
              is_read: false
            }))
          )
        }

        // Notify admins
        const { data: admins } = await supabase
          .from('profiles')
          .select('id')
          .eq('role', 'admin')

        if (admins?.length) {
          await supabase.from('notifications').insert(
            admins.map((a: { id: string }) => ({
              user_id: a.id,
              type: 'education_instructor_no_show_admin',
              title: '🚨 Instructor no se presentó',
              message: `El instructor no se presentó a la sesión #${session.session_number} del curso (ID: ${session.course_id}). Se notificó a los alumnos inscritos.`,
              link: `/admin/education`,
              is_read: false
            }))
          )
        }

        console.warn(`[AutoEnd] INSTRUCTOR NO-SHOW: session ${session.id} (course ${session.course_id}) cancelled`)
      }
    }

    if (!liveSessions || liveSessions.length === 0) {
      return NextResponse.json({
        closed: 0,
        no_show: noShowIds.length,
        message: `No live sessions to process. ${noShowIds.length} no-show(s) handled.`
      })
    }

    const sessionsClosed: string[] = []
    const nowMs = now.getTime()

    for (const session of liveSessions) {
      const startedAt = session.started_at
        ? new Date(session.started_at)
        : new Date(session.scheduled_at)
      const durationMs = (session.duration_minutes || 60) * 60 * 1000
      const endsAt = new Date(startedAt.getTime() + durationMs)
      const expiredMs = nowMs - endsAt.getTime()

      if (expiredMs < gracePeriodMs) continue // still within grace period

      const endedAt = now.toISOString()

      // Mark session as completed
      const { error: updateError } = await supabase
        .from('education_sessions')
        .update({ status: 'completed', ended_at: endedAt })
        .eq('id', session.id)

      if (updateError) {
        console.error(`[AutoEnd] Failed to close session ${session.id}:`, updateError)
        continue
      }

      sessionsClosed.push(session.id)

      // Finalize attendance for all students who were joined but not finalized
      const { data: openAttendance } = await supabase
        .from('education_attendance')
        .select('student_id, joined_at, left_at, status')
        .eq('session_id', session.id)
        .in('status', ['joined', 'pending'])

      if (openAttendance?.length) {
        const scheduledAt = new Date(session.scheduled_at)
        const durationSeconds = (session.duration_minutes || 60) * 60

        for (const record of openAttendance) {
          const joinedAt = new Date(record.joined_at)
          const leftAt = record.left_at ? new Date(record.left_at) : endsAt
          const totalSec = Math.max(0, Math.floor((leftAt.getTime() - joinedAt.getTime()) / 1000))
          const delaySec = Math.max(0, Math.floor((joinedAt.getTime() - scheduledAt.getTime()) / 1000))
          const pctAttended = (totalSec / durationSeconds) * 100
          const pctLate = (delaySec / durationSeconds) * 100

          let finalStatus = 'attended'
          if (pctAttended < 20) finalStatus = 'absent'
          else if (pctLate > 15 && pctAttended < 75) finalStatus = 'late'
          else if (pctLate > 15) finalStatus = 'late'
          else if (pctAttended < 80) finalStatus = 'left_early'

          await supabase
            .from('education_attendance')
            .update({ status: finalStatus, left_at: record.left_at || endedAt, total_seconds_connected: totalSec })
            .eq('session_id', session.id)
            .eq('student_id', record.student_id)
        }
      }

      // Notify enrolled students that the session ended
      const { data: enrollments } = await supabase
        .from('education_enrollments')
        .select('student_id')
        .eq('course_id', session.course_id)
        .eq('payment_status', 'completed')

      if (enrollments?.length) {
        await supabase.from('notifications').insert(
          enrollments.map((e: { student_id: string }) => ({
            user_id: e.student_id,
            type: 'education_session_ended',
            title: '⏹ Clase finalizada',
            message: `La sesión #${session.session_number} ha finalizado.`,
            link: `/education/class/${session.id}`,
            is_read: false
          }))
        )
      }

      console.log(`[AutoEnd] Closed session ${session.id} (expired ${Math.round(expiredMs / 60000)} min ago)`)
    }

    return NextResponse.json({
      closed: sessionsClosed.length,
      no_show: noShowIds.length,
      session_ids: sessionsClosed,
      checked: liveSessions.length,
      message: `Auto-ended ${sessionsClosed.length} of ${liveSessions.length} live sessions. ${noShowIds.length} no-show(s) handled.`
    })
  } catch (err) {
    console.error('[AutoEnd] error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
