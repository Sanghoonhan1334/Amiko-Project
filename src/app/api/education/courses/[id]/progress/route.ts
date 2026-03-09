import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { requireEducationAuth } from '@/lib/education-auth'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// GET /api/education/courses/[id]/progress?userId=xxx
// Devuelve el progreso académico de un estudiante en el curso
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const auth = await requireEducationAuth(request)
    if (auth.error) return auth.error
    const userId = auth.user.id

    // Obtener inscripción
    const { data: enrollment, error: enrollError } = await supabase
      .from('education_enrollments')
      .select('*')
      .eq('course_id', id)
      .eq('student_id', userId)
      .single()

    if (enrollError || !enrollment || enrollment.payment_status !== 'completed') {
      return NextResponse.json({ error: 'Not enrolled in this course' }, { status: 403 })
    }

    // Obtener sesiones del curso
    const { data: sessions } = await supabase
      .from('education_sessions')
      .select('id, session_number, title, status, scheduled_at')
      .eq('course_id', id)
      .order('session_number')

    const sessionIds = (sessions || []).map(s => s.id)

    // Obtener asistencia del estudiante
    const { data: attendance } = await supabase
      .from('education_attendance')
      .select('session_id, status, joined_at, left_at, total_seconds_connected')
      .eq('student_id', userId)
      .in('session_id', sessionIds)

    const attendanceMap = Object.fromEntries(
      (attendance || []).map(a => [a.session_id, a])
    )

    // Recalcular progreso directo en el endpoint (fuente de verdad)
    const totalSessions = sessions?.length || 1
    const completedSessions = (sessions || []).filter(s => s.status === 'completed')
    const attendedCount = completedSessions.filter(s =>
      ['attended', 'completed', 'late'].includes(attendanceMap[s.id]?.status || '')
    ).length
    const absentCount = completedSessions.filter(s =>
      (attendanceMap[s.id]?.status || 'absent') === 'absent'
    ).length

    const progressPercent = Math.round((attendedCount / totalSessions) * 100)
    const attendanceRate = completedSessions.length > 0
      ? Math.round((attendedCount / completedSessions.length) * 100)
      : null

    const certificateEligible =
      enrollment.enrollment_status === 'completed' ||
      progressPercent >= 80

    // Sincronizar si el progreso calculado difiere del guardado
    if (enrollment.progress_percentage !== progressPercent || enrollment.completed_classes !== attendedCount) {
      await supabase
        .from('education_enrollments')
        .update({
          progress_percentage: progressPercent,
          completed_classes: attendedCount,
          enrollment_status: progressPercent >= 100 && enrollment.enrollment_status === 'active' ? 'completed' : enrollment.enrollment_status,
          review_eligible: progressPercent >= 50
        })
        .eq('course_id', id)
        .eq('student_id', userId)
    }

    // Detalle por sesión
    const sessionDetail = (sessions || []).map(s => ({
      session_id: s.id,
      session_number: s.session_number,
      title: s.title,
      scheduled_at: s.scheduled_at,
      session_status: s.status,
      attendance: attendanceMap[s.id] || null,
      counted: ['attended', 'completed', 'late'].includes(attendanceMap[s.id]?.status || '')
    }))

    return NextResponse.json({
      course_id: id,
      student_id: userId,
      completed_sessions: attendedCount,
      total_sessions: totalSessions,
      progress_percent: progressPercent,
      attendance_rate: attendanceRate,
      absent_sessions: absentCount,
      certificate_eligible: certificateEligible,
      enrollment_status: enrollment.enrollment_status,
      sessions: sessionDetail
    })
  } catch (err) {
    console.error('[Education] progress error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
