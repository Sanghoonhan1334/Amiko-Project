import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { requireEducationAuth, isAdminUser } from '@/lib/education-auth'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

/**
 * POST /api/education/courses/[id]/publish
 *
 * The instructor publishes a course that has already been approved by an admin.
 * Only possible from status 'approved'. This is the final step before the course
 * appears in the marketplace.
 *
 * The instructor must own the course.
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

    // Load course with instructor
    const { data: course, error: courseError } = await supabase
      .from('education_courses')
      .select(`
        id, title, slug, status, instructor_id,
        instructor:instructor_profiles(id, user_id, display_name)
      `)
      .eq('id', id)
      .single()

    if (courseError || !course) {
      return NextResponse.json({ error: 'Course not found' }, { status: 404 })
    }

    // Admins can force-publish; instructors can only publish their own approved courses
    const isAdmin = await isAdminUser(userId)
    const instructorProfile = course.instructor as { user_id?: string; display_name?: string } | null
    const isOwner = instructorProfile?.user_id === userId

    if (!isAdmin && !isOwner) {
      return NextResponse.json({ error: 'Only the course instructor or an admin can publish this course' }, { status: 403 })
    }

    // Only approved courses can be published
    if (course.status !== 'approved') {
      return NextResponse.json({
        error: `Course cannot be published from status "${course.status}". The course must first be approved by an administrator.`
      }, { status: 400 })
    }

    // Publish the course
    const { data: updated, error: updateError } = await supabase
      .from('education_courses')
      .update({
        status: 'published',
        published_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single()

    if (updateError) {
      console.error('[Education] publish error:', updateError)
      return NextResponse.json({ error: updateError.message }, { status: 500 })
    }

    // Record in status history
    const { error: historyError } = await supabase.from('course_status_history').insert({
      course_id: id,
      previous_status: 'approved',
      new_status: 'published',
      changed_by: userId,
      notes: 'Course published by instructor'
    })
    if (historyError) {
      console.error('[Education] Failed to record status history for publish:', historyError)
    }

    return NextResponse.json({
      course: updated,
      message: 'Course published successfully. It is now visible in the marketplace.'
    })
  } catch (err) {
    console.error('[Education] publish error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
