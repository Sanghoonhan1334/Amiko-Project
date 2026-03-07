import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

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
    const { id } = await params
    const { reason } = await request.json()

    if (!reason) {
      return NextResponse.json({ error: 'Rejection reason is required' }, { status: 400 })
    }

    const { data, error } = await supabase
      .from('education_courses')
      .update({ status: 'rejected', rejection_reason: reason })
      .eq('id', id)
      .eq('status', 'pending_review')
      .select()
      .single()

    if (error || !data) {
      return NextResponse.json({ error: 'Course not found or not pending review' }, { status: 404 })
    }

    return NextResponse.json({ course: data })
  } catch (err) {
    console.error('[Education] reject error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
