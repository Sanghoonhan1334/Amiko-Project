import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// POST /api/education/enroll - Student enrolls in a course (after PayPal payment)
export async function POST(request: NextRequest) {
  try {
    const { course_id, student_id, paypal_order_id, amount_paid } = await request.json()

    if (!course_id || !student_id || !paypal_order_id) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Check course exists and has capacity
    const { data: course, error: courseError } = await supabase
      .from('education_courses')
      .select('id, max_students, enrolled_count, price_usd, status')
      .eq('id', course_id)
      .single()

    if (courseError || !course) {
      return NextResponse.json({ error: 'Course not found' }, { status: 404 })
    }

    if (course.status !== 'published' && course.status !== 'in_progress') {
      return NextResponse.json({ error: 'Course is not available for enrollment' }, { status: 400 })
    }

    if (course.enrolled_count >= course.max_students) {
      return NextResponse.json({ error: 'Course is full' }, { status: 400 })
    }

    // Check not already enrolled
    const { data: existing } = await supabase
      .from('education_enrollments')
      .select('id')
      .eq('course_id', course_id)
      .eq('student_id', student_id)
      .single()

    if (existing) {
      return NextResponse.json({ error: 'Already enrolled in this course' }, { status: 409 })
    }

    // Create enrollment
    const { data: enrollment, error: enrollError } = await supabase
      .from('education_enrollments')
      .insert({
        course_id,
        student_id,
        paypal_order_id,
        amount_paid: amount_paid || course.price_usd,
        payment_status: 'completed',
        enrollment_status: 'active'
      })
      .select()
      .single()

    if (enrollError) {
      console.error('[Education] Error creating enrollment:', enrollError)
      return NextResponse.json({ error: enrollError.message }, { status: 500 })
    }

    // Update course status to in_progress if first enrollment and course was published
    if (course.enrolled_count === 0 && course.status === 'published') {
      await supabase
        .from('education_courses')
        .update({ status: 'in_progress' })
        .eq('id', course_id)
    }

    return NextResponse.json({ enrollment }, { status: 201 })
  } catch (err) {
    console.error('[Education] enroll error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// GET /api/education/enroll?studentId=xxx - Get student's enrollments
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const studentId = searchParams.get('studentId')
    const courseId = searchParams.get('courseId')

    if (!studentId && !courseId) {
      return NextResponse.json({ error: 'studentId or courseId required' }, { status: 400 })
    }

    let query = supabase
      .from('education_enrollments')
      .select(`
        *,
        course:education_courses(
          *,
          instructor:instructor_profiles(*)
        )
      `)

    if (studentId) query = query.eq('student_id', studentId)
    if (courseId) query = query.eq('course_id', courseId)

    const { data, error } = await query.order('enrolled_at', { ascending: false })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ enrollments: data || [] })
  } catch (err) {
    console.error('[Education] enroll GET error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
