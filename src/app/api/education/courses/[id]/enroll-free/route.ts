import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { requireEducationAuth } from '@/lib/education-auth'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

/**
 * POST /api/education/courses/[id]/enroll-free
 *
 * Direct enrollment for courses with price_usd = 0.
 * Creates an active enrollment without going through PayPal.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const auth = await requireEducationAuth(request)
    if (auth.error) return auth.error
    const userId = auth.user.id

    // Fetch course
    const { data: course, error: courseError } = await supabase
      .from('education_courses')
      .select('id, title, slug, price_usd, max_students, enrolled_count, status, instructor_id')
      .eq('id', id)
      .single()

    if (courseError || !course) {
      return NextResponse.json({ error: 'Course not found' }, { status: 404 })
    }

    // Only allow for free courses
    if (Number(course.price_usd) > 0) {
      return NextResponse.json(
        { error: 'This course requires payment. Use the PayPal checkout flow.' },
        { status: 400 }
      )
    }

    if (!['published', 'in_progress'].includes(course.status)) {
      return NextResponse.json({ error: 'Course is not available for enrollment' }, { status: 400 })
    }

    if (course.enrolled_count >= course.max_students) {
      return NextResponse.json({ error: 'Course is full' }, { status: 400 })
    }

    // Prevent instructor from enrolling in their own course
    const { data: instructor } = await supabase
      .from('instructor_profiles')
      .select('id')
      .eq('user_id', userId)
      .single()

    if (instructor) {
      const { data: ownCourse } = await supabase
        .from('education_courses')
        .select('id')
        .eq('id', id)
        .eq('instructor_id', instructor.id)
        .single()

      if (ownCourse) {
        return NextResponse.json({ error: 'Instructors cannot enroll in their own courses' }, { status: 400 })
      }
    }

    // Check for existing enrollment
    const { data: existing } = await supabase
      .from('education_enrollments')
      .select('id, payment_status, enrollment_status')
      .eq('course_id', id)
      .eq('student_id', userId)
      .maybeSingle()

    if (existing?.payment_status === 'completed' || existing?.enrollment_status === 'active') {
      return NextResponse.json({ error: 'Already enrolled' }, { status: 409 })
    }

    const now = new Date().toISOString()

    let enrollment: { id: string }
    if (existing) {
      const { data: updated, error: updErr } = await supabase
        .from('education_enrollments')
        .update({
          payment_status: 'completed',
          enrollment_status: 'active',
          amount_paid: 0,
          enrolled_at: now,
        })
        .eq('id', existing.id)
        .select('id')
        .single()

      if (updErr || !updated) {
        return NextResponse.json({ error: 'Failed to activate enrollment' }, { status: 500 })
      }
      enrollment = updated
    } else {
      const { data: created, error: insErr } = await supabase
        .from('education_enrollments')
        .insert({
          course_id: id,
          student_id: userId,
          amount_paid: 0,
          payment_status: 'completed',
          enrollment_status: 'active',
          enrolled_at: now,
        })
        .select('id')
        .single()

      if (insErr || !created) {
        console.error('[Free Enroll] insert error:', insErr)
        return NextResponse.json({ error: 'Failed to create enrollment' }, { status: 500 })
      }
      enrollment = created
    }

    // Note: enrolled_count is incremented automatically by the DB trigger
    // that fires on education_enrollments when payment_status becomes 'completed'.

    // Notify student
    await supabase.from('notifications').insert({
      user_id: userId,
      type: 'education_enrollment_confirmed',
      title: '🎉 ¡Inscripción confirmada!',
      message: `Tu inscripción en "${course.title}" fue confirmada. ¡Bienvenido al curso!`,
      link: `/education/course/${course.slug || id}`,
      is_read: false,
    }).then(() => {}) // fire-and-forget

    return NextResponse.json({
      success: true,
      enrollment_id: enrollment.id,
      message: 'Enrollment activated successfully (free course)',
    }, { status: 201 })
  } catch (err) {
    console.error('[Free Enroll] error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
