import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { requireEducationAuth } from '@/lib/education-auth'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// POST /api/education/reviews - Submit a course review
export async function POST(request: NextRequest) {
  try {
    const auth = await requireEducationAuth(request)
    if (auth.error) return auth.error
    const student_id = auth.user.id

    const { course_id, clarity_rating, content_rating, interaction_rating, usefulness_rating, comment } = await request.json()

    if (!course_id) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Check student is enrolled and completed
    const { data: enrollment } = await supabase
      .from('education_enrollments')
      .select('id, enrollment_status')
      .eq('course_id', course_id)
      .eq('student_id', student_id)
      .single()

    if (!enrollment) {
      return NextResponse.json({ error: 'Not enrolled in this course' }, { status: 403 })
    }

    // Validate ratings (1-5)
    const ratings = [clarity_rating, content_rating, interaction_rating, usefulness_rating]
    if (ratings.some(r => !r || r < 1 || r > 5)) {
      return NextResponse.json({ error: 'Ratings must be between 1 and 5' }, { status: 400 })
    }

    const { data, error } = await supabase
      .from('education_reviews')
      .upsert({
        course_id,
        student_id,
        clarity_rating,
        content_rating,
        interaction_rating,
        usefulness_rating,
        comment: comment || null
      }, { onConflict: 'course_id,student_id' })
      .select()
      .single()

    if (error) {
      console.error('[Education] Error creating review:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ review: data }, { status: 201 })
  } catch (err) {
    console.error('[Education] review POST error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// GET /api/education/reviews?courseId=xxx
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const courseId = searchParams.get('courseId')
    const instructorId = searchParams.get('instructorId')

    if (!courseId && !instructorId) {
      return NextResponse.json({ error: 'courseId or instructorId required' }, { status: 400 })
    }

    let query = supabase
      .from('education_reviews')
      .select('*')

    if (courseId) query = query.eq('course_id', courseId)

    const { data, error } = await query.order('created_at', { ascending: false })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ reviews: data || [] })
  } catch (err) {
    console.error('[Education] reviews GET error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
