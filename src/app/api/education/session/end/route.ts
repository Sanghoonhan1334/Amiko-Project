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
        updated_at: now
      })
      .eq('id', session_id)

    // Mark students who joined as "completed" attendance, others as "absent"
    // First get all students enrolled in this course
    const { data: enrollments } = await supabase
      .from('education_enrollments')
      .select('student_id')
      .eq('course_id', session.course_id)
      .in('enrollment_status', ['active', 'completed'])

    if (enrollments?.length) {
      const studentIds = enrollments.map(e => e.student_id)

      // Get who actually attended (joined or completed status from join)
      const { data: attendanceRecords } = await supabase
        .from('education_attendance')
        .select('student_id')
        .eq('session_id', session_id)
        .in('status', ['joined', 'attended', 'completed'])

      const attendedIds = new Set(attendanceRecords?.map(a => a.student_id) || [])

      // Mark absent students
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

      // Update progress for attended students
      for (const studentId of attendedIds) {
        const { count: completedCount } = await supabase
          .from('education_attendance')
          .select('*', { count: 'exact', head: true })
          .eq('student_id', studentId)
          .in('status', ['joined', 'attended', 'completed'])
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
    }

    // Get attendance summary
    const { data: finalAttendance } = await supabase
      .from('education_attendance')
      .select('status')
      .eq('session_id', session_id)

    const attendedCount = finalAttendance?.filter(a => a.status === 'completed').length || 0
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
