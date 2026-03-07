import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

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
    const { id } = await params

    const { data, error } = await supabase
      .from('education_courses')
      .update({ status: 'published' })
      .eq('id', id)
      .eq('status', 'pending_review')
      .select(`
        *,
        instructor:instructor_profiles(user_id, display_name)
      `)
      .single()

    if (error || !data) {
      return NextResponse.json({ error: 'Course not found or not pending review' }, { status: 404 })
    }

    // TODO: Send notification to instructor about approval

    return NextResponse.json({ course: data })
  } catch (err) {
    console.error('[Education] approve error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
