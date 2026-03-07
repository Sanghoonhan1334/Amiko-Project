import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { requireEducationAuth } from '@/lib/education-auth'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// GET /api/education/courses/[id]/dashboard?userId=xxx
// Panel completo del curso para el estudiante: clases, materiales, progreso, certificado
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const auth = await requireEducationAuth(request)
    if (auth.error) return auth.error
    const userId = auth.user.id

    // Obtener curso completo
    const { data: course, error: courseError } = await supabase
      .from('education_courses')
      .select(`
        id, title, slug, category, level, teaching_language,
        description, objectives, thumbnail_url, price_usd,
        total_classes, class_duration_minutes, status,
        allow_recording, start_date, end_date,
        instructor:instructor_profiles(
          id, display_name, photo_url, country, bio, average_rating,
          total_students, total_courses, is_verified
        )
      `)
      .eq('id', id)
      .single()

    if (courseError || !course) {
      return NextResponse.json({ error: 'Course not found' }, { status: 404 })
    }

    // Verificar inscripción del estudiante
    const { data: enrollment } = await supabase
      .from('education_enrollments')
      .select('*')
      .eq('course_id', id)
      .eq('student_id', userId)
      .single()

    if (!enrollment || enrollment.payment_status !== 'completed') {
      return NextResponse.json({ error: 'Not enrolled in this course' }, { status: 403 })
    }

    // Obtener sesiones ordenadas
    const { data: sessions } = await supabase
      .from('education_sessions')
      .select('*')
      .eq('course_id', id)
      .order('session_number')

    // Obtener asistencia del estudiante
    const { data: attendance } = await supabase
      .from('education_attendance')
      .select('session_id, status, joined_at, left_at, total_seconds_connected')
      .eq('student_id', userId)
      .in('session_id', (sessions || []).map(s => s.id))

    const attendanceMap: Record<string, { session_id: string; status: string; joined_at?: string; left_at?: string; total_seconds_connected?: number }> = Object.fromEntries(
      (attendance || []).map(a => [a.session_id, a])
    )

    // Obtener materiales del curso
    const { data: materials } = await supabase
      .from('education_materials')
      .select('*')
      .eq('course_id', id)
      .order('sort_order')

    // Obtener reseña del estudiante si existe
    const { data: myReview } = await supabase
      .from('education_reviews')
      .select('*')
      .eq('course_id', id)
      .eq('student_id', userId)
      .single()

    const now = new Date()

    // Enriquecer sesiones con estado de acceso
    const enrichedSessions = (sessions || []).map(session => {
      const scheduledAt = new Date(session.scheduled_at)
      const windowOpensAt = new Date(scheduledAt.getTime() - 15 * 60 * 1000)
      const windowClosesAt = new Date(scheduledAt.getTime() + (session.duration_minutes || 60) * 60 * 1000)
      const myAttendance = attendanceMap[session.id]

      return {
        ...session,
        my_attendance: myAttendance || null,
        can_enter: session.status === 'live' ||
          (now >= windowOpensAt && now <= windowClosesAt && !['completed', 'cancelled'].includes(session.status)),
        window_opens_at: windowOpensAt.toISOString(),
        window_closes_at: windowClosesAt.toISOString(),
        session_materials: (materials || []).filter(m => m.session_id === session.id)
      }
    })

    // Próxima clase
    const nextSession = enrichedSessions
      .filter(s => !['completed', 'cancelled'].includes(s.status) && new Date(s.scheduled_at) > now)
      .sort((a, b) => new Date(a.scheduled_at).getTime() - new Date(b.scheduled_at).getTime())[0] || null

    // Elegibilidad de certificado
    const certificateEligible =
      enrollment.enrollment_status === 'completed' ||
      (enrollment.progress_percentage || 0) >= 80

    return NextResponse.json({
      course,
      enrollment: {
        id: enrollment.id,
        status: enrollment.enrollment_status,
        payment_status: enrollment.payment_status,
        progress_percentage: enrollment.progress_percentage || 0,
        completed_classes: enrollment.completed_classes || 0,
        enrolled_at: enrollment.enrolled_at,
        completed_at: enrollment.completed_at,
        certificate_issued: enrollment.certificate_issued,
        certificate_url: enrollment.certificate_url,
        review_eligible: enrollment.review_eligible
      },
      sessions: enrichedSessions,
      next_session: nextSession,
      general_materials: (materials || []).filter(m => !m.session_id),
      my_review: myReview || null,
      certificate_eligible: certificateEligible,
      stats: {
        total_sessions: sessions?.length || 0,
        completed_sessions: (sessions || []).filter(s => s.status === 'completed').length,
        attended_sessions: Object.values(attendanceMap).filter(a =>
          ['attended', 'completed', 'late'].includes(a.status)
        ).length,
        absent_sessions: Object.values(attendanceMap).filter(a =>
          a.status === 'absent'
        ).length
      }
    })
  } catch (err) {
    console.error('[Education] course dashboard error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
