import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// POST /api/education/session/join - Student/Instructor joins a live class
export async function POST(request: NextRequest) {
  try {
    const { session_id, user_id } = await request.json()

    if (!session_id || !user_id) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Get session details
    const { data: session, error: sessionError } = await supabase
      .from('education_sessions')
      .select(`
        *,
        course:education_courses(
          id, instructor_id, allow_recording,
          instructor:instructor_profiles(user_id)
        )
      `)
      .eq('id', session_id)
      .single()

    if (sessionError || !session) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 })
    }

    // Verify user is enrolled or is the instructor
    const isInstructor = session.course?.instructor?.user_id === user_id

    if (!isInstructor) {
      const { data: enrollment } = await supabase
        .from('education_enrollments')
        .select('id')
        .eq('course_id', session.course_id)
        .eq('student_id', user_id)
        .eq('payment_status', 'completed')
        .single()

      if (!enrollment) {
        return NextResponse.json({ error: 'Not authorized to join this class' }, { status: 403 })
      }
    }

    // Check if class is within 30 min window
    const now = new Date()
    const classTime = new Date(session.scheduled_at)
    const diffMinutes = (classTime.getTime() - now.getTime()) / (1000 * 60)

    if (diffMinutes > 30) {
      return NextResponse.json({
        error: 'Class has not started yet. You can join 30 minutes before the scheduled time.',
        minutesUntilJoin: Math.ceil(diffMinutes - 30)
      }, { status: 425 })
    }

    // Generate Agora channel name and token
    const channelName = session.agora_channel || `edu_${session.course_id}_${session.session_number}`

    // Get Agora token from our token endpoint
    const tokenResponse = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/agora/token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        channelName,
        uid: Math.floor(Math.random() * 100000)
      })
    })

    const tokenData = await tokenResponse.json()

    // Update session status to live if it's the instructor
    if (isInstructor && session.status === 'scheduled') {
      await supabase
        .from('education_sessions')
        .update({ status: 'live', agora_channel: channelName })
        .eq('id', session_id)
    }

    // Mark attendance for student
    if (!isInstructor) {
      await supabase
        .from('education_attendance')
        .upsert({
          session_id,
          student_id: user_id,
          status: 'completed',
          joined_at: new Date().toISOString()
        }, { onConflict: 'session_id,student_id' })
    }

    return NextResponse.json({
      channelName,
      token: tokenData.token,
      appId: process.env.NEXT_PUBLIC_AGORA_APP_ID,
      isInstructor,
      allowRecording: session.course?.allow_recording || false,
      session: {
        id: session.id,
        title: session.title,
        session_number: session.session_number,
        course_id: session.course_id
      }
    })
  } catch (err) {
    console.error('[Education] session join error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
