import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { requireEducationAuth, isAdminUser } from '@/lib/education-auth'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// GET /api/education/sessions?courseId=xxx - Get sessions for a course
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const courseId = searchParams.get('courseId')
    const sessionId = searchParams.get('sessionId')

    if (!courseId && !sessionId) {
      return NextResponse.json({ error: 'courseId or sessionId required' }, { status: 400 })
    }

    if (sessionId) {
      const { data, error } = await supabase
        .from('education_sessions')
        .select(`
          *,
          course:education_courses(
            *,
            instructor:instructor_profiles(*)
          ),
          attendance:education_attendance(*)
        `)
        .eq('id', sessionId)
        .single()

      if (error) return NextResponse.json({ error: 'Session not found' }, { status: 404 })
      return NextResponse.json({ session: data })
    }

    const { data, error } = await supabase
      .from('education_sessions')
      .select('*')
      .eq('course_id', courseId!)
      .order('session_number')

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ sessions: data || [] })
  } catch (err) {
    console.error('[Education] sessions GET error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST /api/education/sessions - Create a new session for a course
export async function POST(request: NextRequest) {
  try {
    const auth = await requireEducationAuth(request)
    if (auth.error) return auth.error
    const userId = auth.user.id

    const body = await request.json()
    const { course_id, session_number, title, scheduled_at, duration_minutes } = body

    if (!course_id || !scheduled_at) {
      return NextResponse.json({ error: 'course_id and scheduled_at required' }, { status: 400 })
    }

    // Verify the user is the instructor of this course (or admin)
    const { data: course } = await supabase
      .from('education_courses')
      .select('instructor:instructor_profiles(user_id)')
      .eq('id', course_id)
      .single()

    const instructorUserId = (course?.instructor as { user_id?: string } | null)?.user_id
    const admin = await isAdminUser(userId)
    if (instructorUserId !== userId && !admin) {
      return NextResponse.json({ error: 'Not authorized to add sessions to this course' }, { status: 403 })
    }

    const channel = `edu_${course_id.slice(0, 8)}_${session_number || 1}`

    const { data, error } = await supabase
      .from('education_sessions')
      .insert({
        course_id,
        session_number: session_number || 1,
        title: title || null,
        scheduled_at,
        duration_minutes: duration_minutes || 60,
        agora_channel: channel,
        status: 'scheduled'
      })
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Update course total_classes count
    const { count } = await supabase
      .from('education_sessions')
      .select('id', { count: 'exact', head: true })
      .eq('course_id', course_id)

    if (count !== null) {
      await supabase
        .from('education_courses')
        .update({ total_classes: count })
        .eq('id', course_id)
    }

    return NextResponse.json({ session: data }, { status: 201 })
  } catch (err) {
    console.error('[Education] sessions POST error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// PUT /api/education/sessions - Update session (reschedule, cancel, etc.)
export async function PUT(request: NextRequest) {
  try {
    const auth = await requireEducationAuth(request)
    if (auth.error) return auth.error
    const userId = auth.user.id

    const body = await request.json()
    const { id, ...updates } = body

    if (!id) {
      return NextResponse.json({ error: 'Session id required' }, { status: 400 })
    }

    // Verify the user is the instructor of this session's course (or admin)
    const { data: session } = await supabase
      .from('education_sessions')
      .select('course:education_courses(instructor:instructor_profiles(user_id))')
      .eq('id', id)
      .single()

    const instructorUserId = ((session?.course as { instructor?: { user_id?: string } } | null)?.instructor)?.user_id
    const admin = await isAdminUser(userId)
    if (instructorUserId !== userId && !admin) {
      return NextResponse.json({ error: 'Not authorized to update this session' }, { status: 403 })
    }

    // If rescheduling, set status and rescheduled_to
    if (updates.rescheduled_to) {
      updates.status = 'rescheduled'
    }

    const { data, error } = await supabase
      .from('education_sessions')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ session: data })
  } catch (err) {
    console.error('[Education] sessions PUT error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
