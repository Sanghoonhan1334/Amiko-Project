import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { requireEducationAuth } from '@/lib/education-auth'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// POST /api/education/session/end - Instructor ends a live class session
export async function POST(request: NextRequest) {
  try {
    const auth = await requireEducationAuth(request)
    if (auth.error) return auth.error
    const user_id = auth.user.id

    const { session_id } = await request.json()

    if (!session_id) {
      return NextResponse.json({ error: 'session_id required' }, { status: 400 })
    }

    // Get session with course info
    const { data: session, error: sessionErr } = await supabase
      .from('education_sessions')
      .select(`
        *,
        course:education_courses(
          id, title, instructor_id, total_classes,
          instructor:instructor_profiles(user_id)
        )
      `)
      .eq('id', session_id)
      .single()

    if (sessionErr || !session) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 })
    }

    // Verify the user is the instructor
    const isInstructor = session.course?.instructor?.user_id === user_id
    if (!isInstructor) {
      return NextResponse.json({ error: 'Only the instructor can end the class' }, { status: 403 })
    }

    // Mark session as completed
    const now = new Date().toISOString()
    await supabase
      .from('education_sessions')
      .update({
        status: 'completed',
        ended_at: now,
        updated_at: now
      })
      .eq('id', session_id)

    // Finalize attendance: compute proper status for all students who joined
    // First get all students enrolled in this course
    const { data: enrollments } = await supabase
      .from('education_enrollments')
      .select('student_id')
      .eq('course_id', session.course_id)
      .in('enrollment_status', ['active', 'completed'])

    if (enrollments?.length) {
      const studentIds = enrollments.map(e => e.student_id)

      // Get all attendance records for this session
      const { data: attendanceRecords } = await supabase
        .from('education_attendance')
        .select('student_id, status, joined_at, left_at')
        .eq('session_id', session_id)

      const attendanceMap = new Map(
        (attendanceRecords || []).map(a => [a.student_id, a])
      )

      // Students who joined but haven't been finalized yet
      const joinedStudents = (attendanceRecords || []).filter(
        a => ['joined', 'pending'].includes(a.status) && a.joined_at
      )

      // Compute proper attendance for joined students using v2 thresholds
      const scheduledAt = new Date(session.scheduled_at)
      const durationSeconds = (session.duration_minutes || 60) * 60
      const endTime = new Date(now)

      for (const record of joinedStudents) {
        const joinedAt = new Date(record.joined_at)
        const leftAt = record.left_at ? new Date(record.left_at) : endTime
        const totalSecondsConnected = Math.max(
          0,
          Math.floor((leftAt.getTime() - joinedAt.getTime()) / 1000)
        )
        const joinDelaySeconds = Math.max(
          0,
          Math.floor((joinedAt.getTime() - scheduledAt.getTime()) / 1000)
        )
        const pctAttended = (totalSecondsConnected / durationSeconds) * 100
        const pctLate = (joinDelaySeconds / durationSeconds) * 100

        let finalStatus = 'attended'
        if (pctAttended < 20) {
          finalStatus = 'absent'
        } else if (pctLate > 15 && pctAttended < 75) {
          finalStatus = 'late'
        } else if (pctLate > 15) {
          finalStatus = 'late'
        } else if (pctAttended < 80) {
          finalStatus = 'left_early'
        }

        await supabase
          .from('education_attendance')
          .update({
            status: finalStatus,
            left_at: record.left_at || now,
            total_seconds_connected: totalSecondsConnected
          })
          .eq('session_id', session_id)
          .eq('student_id', record.student_id)
      }

      // Mark absent students (enrolled but no attendance record or not_joined)
      const attendedIds = new Set(
        (attendanceRecords || [])
          .filter(a => a.joined_at) // has actually joined at some point
          .map(a => a.student_id)
      )
      const absentStudents = studentIds.filter(id => !attendedIds.has(id))

      if (absentStudents.length > 0) {
        const absentRecords = absentStudents.map(student_id => ({
          session_id,
          student_id,
          status: 'absent' as const
        }))

        await supabase
          .from('education_attendance')
          .upsert(absentRecords, { onConflict: 'session_id,student_id' })
      }

      // Re-fetch attendance after finalization for accurate progress
      const { data: finalizedAttendance } = await supabase
        .from('education_attendance')
        .select('student_id, status')
        .eq('session_id', session_id)

      const finalAttendedIds = new Set(
        (finalizedAttendance || [])
          .filter(a => ['attended', 'completed', 'late'].includes(a.status))
          .map(a => a.student_id)
      )

      // Update progress for attended students
      for (const studentId of finalAttendedIds) {
        const { count: completedCount } = await supabase
          .from('education_attendance')
          .select('*', { count: 'exact', head: true })
          .eq('student_id', studentId)
          .in('status', ['attended', 'completed', 'late'])
          .in('session_id',
            (await supabase.from('education_sessions')
              .select('id')
              .eq('course_id', session.course_id)
            ).data?.map(s => s.id) || []
          )

        const totalClasses = session.course?.total_classes || 1
        const progress = Math.round(((completedCount || 0) / totalClasses) * 100)
        const isCompleted = progress >= 100

        const { data: updatedEnrollment } = await supabase
          .from('education_enrollments')
          .update({
            completed_classes: completedCount || 0,
            progress_percentage: progress,
            enrollment_status: isCompleted ? 'completed' : 'active',
            completed_at: isCompleted ? now : null
          })
          .eq('course_id', session.course_id)
          .eq('student_id', studentId)
          .select('id, certificate_issued')
          .single()

        // Auto-issue certificate
        if (isCompleted && updatedEnrollment && !updatedEnrollment.certificate_issued) {
          const certUrl = `/education/certificate/${updatedEnrollment.id}`
          await supabase
            .from('education_enrollments')
            .update({
              certificate_issued: true,
              certificate_url: certUrl
            })
            .eq('id', updatedEnrollment.id)

          await supabase.from('notifications').insert({
            user_id: studentId,
            type: 'education_certificate',
            title: '🎓 ¡Certificado disponible!',
            message: `Has completado el curso "${session.course?.title}". Tu certificado está listo.`,
            link: certUrl,
            is_read: false
          })
        }
      }
    }

    // Check if all sessions of the course are completed
    const { count: totalSessions } = await supabase
      .from('education_sessions')
      .select('id', { count: 'exact', head: true })
      .eq('course_id', session.course_id)

    const { count: completedSessions } = await supabase
      .from('education_sessions')
      .select('id', { count: 'exact', head: true })
      .eq('course_id', session.course_id)
      .eq('status', 'completed')

    // If all sessions completed, mark course as completed
    if (totalSessions && completedSessions && completedSessions >= totalSessions) {
      await supabase
        .from('education_courses')
        .update({ status: 'completed' })
        .eq('id', session.course_id)

      const { error: historyError } = await supabase
        .from('course_status_history')
        .insert({
          course_id: session.course_id,
          previous_status: 'in_progress',
          new_status: 'completed',
          changed_by: user_id,
          notes: 'All sessions completed — course auto-closed',
        })
      if (historyError) console.error('[Education] Failed to record course completion history:', historyError)
    }

    // Get attendance summary
    const { data: finalAttendance } = await supabase
      .from('education_attendance')
      .select('status')
      .eq('session_id', session_id)

    const attendedCount = finalAttendance?.filter(a =>
      ['attended', 'completed', 'late'].includes(a.status)
    ).length || 0
    const absentCount = finalAttendance?.filter(a => a.status === 'absent').length || 0

    return NextResponse.json({
      success: true,
      session_status: 'completed',
      attended: attendedCount,
      absent: absentCount,
      course_completed: completedSessions !== null && totalSessions !== null && completedSessions >= totalSessions
    })
  } catch (err) {
    console.error('[Education] session end error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
