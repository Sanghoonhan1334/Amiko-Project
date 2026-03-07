import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// GET /api/education/courses/[id] - Get course details
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const { data: course, error } = await supabase
      .from('education_courses')
      .select(`
        *,
        instructor:instructor_profiles(*),
        sessions:education_sessions(*)
      `)
      .eq('id', id)
      .single()

    if (error || !course) {
      // Try slug
      const { data: courseBySlug, error: slugError } = await supabase
        .from('education_courses')
        .select(`
          *,
          instructor:instructor_profiles(*),
          sessions:education_sessions(*)
        `)
        .eq('slug', id)
        .single()

      if (slugError || !courseBySlug) {
        return NextResponse.json({ error: 'Course not found' }, { status: 404 })
      }

      // Sort sessions
      if (courseBySlug.sessions) {
        courseBySlug.sessions.sort((a: { session_number: number }, b: { session_number: number }) =>
          a.session_number - b.session_number
        )
      }

      return NextResponse.json({ course: courseBySlug })
    }

    // Sort sessions
    if (course.sessions) {
      course.sessions.sort((a: { session_number: number }, b: { session_number: number }) =>
        a.session_number - b.session_number
      )
    }

    // Get reviews summary
    const { data: reviews } = await supabase
      .from('education_reviews')
      .select('*')
      .eq('course_id', course.id)
      .order('created_at', { ascending: false })

    // Get materials
    const { data: materials } = await supabase
      .from('education_materials')
      .select('*')
      .eq('course_id', course.id)
      .order('sort_order')

    return NextResponse.json({
      course: {
        ...course,
        reviews: reviews || [],
        materials: materials || []
      }
    })
  } catch (err) {
    console.error('[Education] course GET error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// PUT /api/education/courses/[id] - Update course
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()

    const { data, error } = await supabase
      .from('education_courses')
      .update(body)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('[Education] Error updating course:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ course: data })
  } catch (err) {
    console.error('[Education] course PUT error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// DELETE /api/education/courses/[id] - Delete course (draft only)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    // Only allow deletion of draft courses
    const { data: course } = await supabase
      .from('education_courses')
      .select('status')
      .eq('id', id)
      .single()

    if (course?.status !== 'draft') {
      return NextResponse.json({ error: 'Only draft courses can be deleted' }, { status: 400 })
    }

    const { error } = await supabase
      .from('education_courses')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('[Education] Error deleting course:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('[Education] course DELETE error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
