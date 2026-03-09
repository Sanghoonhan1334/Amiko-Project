import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { requireEducationAuth, isAdminUser } from '@/lib/education-auth'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// POST /api/education/courses/[id]/reject - Admin rejects course
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
      return NextResponse.json({ error: 'Rejection reason is required' }, { status: 400 })
    }

    const { data, error } = await supabase
      .from('education_courses')
      .update({ status: 'rejected', rejection_reason: reason })
      .eq('id', id)
      .in('status', ['pending_review', 'submitted_for_review'])
      .select(`
        id, title, slug,
        instructor:instructor_profiles(user_id)
      `)
      .single()

    if (error || !data) {
      return NextResponse.json({ error: 'Course not found or not pending review' }, { status: 404 })
    }

    // Notify the instructor their course was rejected
    const instructorUserId = (data.instructor as { user_id?: string } | null)?.user_id
    if (instructorUserId) {
      await supabase.from('notifications').insert({
        user_id: instructorUserId,
        type: 'education_course_rejected',
        title: '❌ Curso rechazado',
        message: `Tu curso "${data.title}" fue rechazado. Motivo: ${reason}`,
        link: `/education?tab=instructor`,
        is_read: false
      })
    }

    return NextResponse.json({ course: data })
  } catch (err) {
    console.error('[Education] reject error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
