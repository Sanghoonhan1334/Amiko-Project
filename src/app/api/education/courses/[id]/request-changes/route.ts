import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { requireEducationAuth, isAdminUser } from '@/lib/education-auth'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// POST /api/education/courses/[id]/request-changes
// Admin requests changes from the instructor before approving
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
    const { reason } = await request.json()

    if (!reason) {
      return NextResponse.json({ error: 'Reason for changes is required' }, { status: 400 })
    }

    const { data, error } = await supabase
      .from('education_courses')
      .update({
        status: 'changes_requested',
        rejection_reason: reason
      })
      .eq('id', id)
      .in('status', ['submitted_for_review'])
      .select(`
        id, title, slug,
        instructor:instructor_profiles(user_id)
      `)
      .single()

    if (error || !data) {
      return NextResponse.json({ error: 'Course not found or not pending review' }, { status: 404 })
    }

    // Notify the instructor
    const instructorUserId = (data.instructor as { user_id?: string } | null)?.user_id
    if (instructorUserId) {
      await supabase.from('notifications').insert({
        user_id: instructorUserId,
        type: 'education_course_changes_requested',
        title: '📝 Cambios solicitados en tu curso',
        message: `El administrador ha solicitado cambios en tu curso "${data.title}": ${reason}`,
        link: `/education?tab=instructor`,
        is_read: false
      })
    }

    // Record in status history
    try {
      await supabase.from('course_status_history').insert({
        course_id: id,
        previous_status: 'submitted_for_review',
        new_status: 'changes_requested',
        changed_by: auth.user.id,
        notes: `Changes requested: ${reason}`
      })
    } catch { /* table may not exist yet */ }

    return NextResponse.json({ course: data })
  } catch (err) {
    console.error('[Education] request-changes error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
