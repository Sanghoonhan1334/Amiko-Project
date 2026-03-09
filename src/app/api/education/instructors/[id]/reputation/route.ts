import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// GET /api/education/instructors/[id]/reputation
// Devuelve las métricas de reputación de un instructor
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    // Obtener perfil del instructor
    const { data: instructor, error } = await supabase
      .from('instructor_profiles')
      .select('*')
      .eq('id', id)
      .single()

    if (error || !instructor) {
      return NextResponse.json({ error: 'Instructor not found' }, { status: 404 })
    }

    // Cursos del instructor
    const { data: courses } = await supabase
      .from('education_courses')
      .select('id, title, status, enrolled_count, total_classes')
      .eq('instructor_id', id)

    const publishedCourses = (courses || []).filter(c =>
      ['published', 'in_progress', 'completed'].includes(c.status)
    )
    const completedCourses = (courses || []).filter(c => c.status === 'completed')
    const courseIds = (courses || []).map(c => c.id)

    // Inscripciones totales activas/completadas
    let totalEnrollments = 0
    let completedEnrollments = 0
    if (courseIds.length > 0) {
      const { count: enrollCount } = await supabase
        .from('education_enrollments')
        .select('id', { count: 'exact', head: true })
        .in('course_id', courseIds)
        .eq('payment_status', 'completed')

      const { count: completedCount } = await supabase
        .from('education_enrollments')
        .select('id', { count: 'exact', head: true })
        .in('course_id', courseIds)
        .eq('enrollment_status', 'completed')

      totalEnrollments = enrollCount || 0
      completedEnrollments = completedCount || 0
    }

    const completionRate = totalEnrollments > 0
      ? Math.round((completedEnrollments / totalEnrollments) * 100)
      : null

    // Reviews del instructor (todos los cursos)
    const rawReviewsResult = courseIds.length > 0
      ? (await supabase
        .from('education_reviews')
        .select('overall_rating, clarity_rating, content_rating, interaction_rating, usefulness_rating, comment, created_at')
        .in('course_id', courseIds)
        .order('created_at', { ascending: false })).data
      : []

    type ReviewRow = {
      overall_rating: number | null
      clarity_rating: number | null
      content_rating: number | null
      interaction_rating: number | null
      usefulness_rating: number | null
      comment: string | null
      created_at: string
    }
    const reviews = (rawReviewsResult || []) as ReviewRow[]

    const totalReviews = reviews.length
    const avgOverall = totalReviews > 0
      ? reviews.reduce((sum, r) => sum + (r.overall_rating || 0), 0) / totalReviews
      : 0

    const avgClarity = totalReviews > 0
      ? reviews.reduce((sum, r) => sum + (r.clarity_rating || 0), 0) / totalReviews
      : 0
    const avgContent = totalReviews > 0
      ? reviews.reduce((sum, r) => sum + (r.content_rating || 0), 0) / totalReviews
      : 0
    const avgInteraction = totalReviews > 0
      ? reviews.reduce((sum, r) => sum + (r.interaction_rating || 0), 0) / totalReviews
      : 0
    const avgUsefulness = totalReviews > 0
      ? reviews.reduce((sum, r) => sum + (r.usefulness_rating || 0), 0) / totalReviews
      : 0

    // Satisfacción: % de reviews con rating >= 4
    const satisfiedCount = reviews.filter(r => (r.overall_rating || 0) >= 4).length
    const satisfactionRate = totalReviews > 0
      ? Math.round((satisfiedCount / totalReviews) * 100)
      : null

    // Tasa de asistencia promedio (de cursos completados)
    let avgAttendanceRate: number | null = null
    if (completedCourses.length > 0) {
      const completedCourseIds = completedCourses.map(c => c.id)
      const { data: completedEnrollData } = await supabase
        .from('education_enrollments')
        .select('progress_percentage')
        .in('course_id', completedCourseIds)
        .eq('enrollment_status', 'completed')

      if (completedEnrollData && completedEnrollData.length > 0) {
        avgAttendanceRate = Math.round(
          completedEnrollData.reduce((sum, e) => sum + (e.progress_percentage || 0), 0) /
          completedEnrollData.length
        )
      }
    }

    return NextResponse.json({
      instructor_id: id,
      display_name: instructor.display_name,
      photo_url: instructor.photo_url,
      country: instructor.country,
      is_verified: instructor.is_verified,
      bio: instructor.bio,
      specialty: instructor.specialty,
      experience: instructor.experience,
      languages: instructor.languages,
      reputation: {
        average_rating: parseFloat(avgOverall.toFixed(2)),
        total_reviews: totalReviews,
        total_students: totalEnrollments,
        total_courses: courses?.length || 0,
        published_courses: publishedCourses.length,
        completed_courses: completedCourses.length,
        completion_rate: completionRate,
        satisfaction_rate: satisfactionRate,
        avg_attendance_rate: avgAttendanceRate,
        rating_breakdown: {
          clarity: parseFloat(avgClarity.toFixed(2)),
          content: parseFloat(avgContent.toFixed(2)),
          interaction: parseFloat(avgInteraction.toFixed(2)),
          usefulness: parseFloat(avgUsefulness.toFixed(2))
        }
      },
      recent_reviews: reviews.slice(0, 5),
      courses: publishedCourses
    })
  } catch (err) {
    console.error('[Education] instructor reputation error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
