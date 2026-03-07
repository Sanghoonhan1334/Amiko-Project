import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { requireEducationAuth } from '@/lib/education-auth'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// GET /api/education/my-courses?userId=xxx
// Devuelve todos los cursos del estudiante con progreso, próximas clases y estado
export async function GET(request: NextRequest) {
  try {
    const auth = await requireEducationAuth(request)
    if (auth.error) return auth.error
    const userId = auth.user.id

    const { data: enrollments, error } = await supabase
      .from('education_enrollments')
      .select(`
        id,
        course_id,
        payment_status,
        enrollment_status,
        progress_percentage,
        completed_classes,
        certificate_issued,
        certificate_url,
        enrolled_at,
        completed_at,
        course:education_courses(
          id, title, slug, category, level, teaching_language,
          thumbnail_url, price_usd, total_classes, class_duration_minutes,
          status, start_date, end_date,
          instructor:instructor_profiles(
            id, display_name, photo_url, country, average_rating, is_verified
          ),
          sessions:education_sessions(
            id, session_number, title, scheduled_at, duration_minutes, status
          )
        )
      `)
      .eq('student_id', userId)
      .eq('payment_status', 'completed')
      .order('enrolled_at', { ascending: false })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    const now = new Date()

    // Enriquecer con próxima clase y last_activity
    const myCourses = (enrollments || []).map(enrollment => {
      const sessions = (enrollment.course as { sessions?: Array<{
        id: string
        session_number: number
        title: string | null
        scheduled_at: string
        duration_minutes: number
        status: string
      }> } | null)?.sessions || []

      // Próxima clase: la más cercana al futuro que no esté completada o cancelada
      const upcomingSessions = sessions
        .filter(s => new Date(s.scheduled_at) > now && !['completed', 'cancelled'].includes(s.status))
        .sort((a, b) => new Date(a.scheduled_at).getTime() - new Date(b.scheduled_at).getTime())

      // Clase actual (live)
      const liveSession = sessions.find(s => s.status === 'live')

      const nextSession = liveSession || upcomingSessions[0] || null

      return {
        enrollment_id: enrollment.id,
        course_id: enrollment.course_id,
        payment_status: enrollment.payment_status,
        enrollment_status: enrollment.enrollment_status,
        progress_percentage: enrollment.progress_percentage || 0,
        completed_classes: enrollment.completed_classes || 0,
        certificate_issued: enrollment.certificate_issued,
        certificate_url: enrollment.certificate_url,
        enrolled_at: enrollment.enrolled_at,
        completed_at: enrollment.completed_at,
        course: enrollment.course,
        next_session: nextSession,
        live_now: !!liveSession,
        total_sessions: sessions.length,
        certificate_eligible:
          enrollment.enrollment_status === 'completed' ||
          (enrollment.progress_percentage || 0) >= 80
      }
    })

    // Separar en categorías para el dashboard
    const activeCourses = myCourses.filter(c =>
      ['active', 'enrolled'].includes(c.enrollment_status)
    )
    const completedCourses = myCourses.filter(c =>
      c.enrollment_status === 'completed'
    )
    const allCourses = myCourses

    return NextResponse.json({
      my_courses: allCourses,
      active: activeCourses,
      completed: completedCourses,
      total: allCourses.length,
      has_live_now: activeCourses.some(c => c.live_now)
    })
  } catch (err) {
    console.error('[Education] my-courses error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
