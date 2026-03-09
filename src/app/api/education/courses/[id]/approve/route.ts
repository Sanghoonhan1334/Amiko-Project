import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { requireEducationAuth, isAdminUser } from '@/lib/education-auth'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// POST /api/education/courses/[id]/approve - Admin approves course
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireEducationAuth(request)
    if (auth.error) return auth.error
    const admin = await isAdminUser(auth.user.id)
    if (!admin) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    const { id } = await params

    const { data, error } = await supabase
      .from('education_courses')
      .update({ status: 'published' })
      .eq('id', id)
      .in('status', ['pending_review', 'submitted_for_review'])
      .select(`
        *,
        instructor:instructor_profiles(user_id, display_name)
      `)
      .single()

    if (error || !data) {
      return NextResponse.json({ error: 'Course not found or not pending review' }, { status: 404 })
    }

    // Notify the instructor their course was approved
    const instructorUserId = data.instructor?.user_id
    if (instructorUserId) {
      await supabase.from('notifications').insert({
        user_id: instructorUserId,
        type: 'education_course_approved',
        title: '✅ ¡Curso aprobado!',
        message: `Tu curso "${data.title}" ha sido aprobado y publicado en el marketplace.`,
        link: `/education/course/${data.slug || data.id}`,
        is_read: false
      })
    }

    // Record in status history for audit trail
    await supabase.from('course_status_history').insert({
      course_id: id,
      previous_status: 'submitted_for_review',
      new_status: 'published',
      changed_by: auth.user.id,
      notes: 'Course approved by admin'
    }) // silently ignore if table not yet created

    return NextResponse.json({ course: data })
  } catch (err) {
    console.error('[Education] approve error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
