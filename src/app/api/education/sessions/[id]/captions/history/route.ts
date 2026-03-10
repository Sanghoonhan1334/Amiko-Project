import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { requireEducationAuth } from '@/lib/education-auth'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

/**
 * GET /api/education/sessions/[id]/captions/history
 *
 * Returns final caption events for a completed (or live) session.
 * Useful for reviewing what was said after the class ends.
 *
 * Query params:
 *   finals_only=true  — only return final transcripts (default: true)
 *   language=ko       — filter by source language
 *   limit=200         — max results (default 200, max 1000)
 *   offset=0          — pagination offset
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: sessionId } = await params
    const auth = await requireEducationAuth(request)
    if (auth.error) return auth.error
    const userId = auth.user.id

    // Load session + verify access
    const { data: session, error: sessionError } = await supabase
      .from('education_sessions')
      .select(`
        id, course_id,
        course:education_courses(
          id, instructor_id,
          instructor:instructor_profiles(user_id)
        )
      `)
      .eq('id', sessionId)
      .single()

    if (sessionError || !session) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 })
    }

    // Verify enrollment or instructor
    const isInstructor = (session.course as { instructor?: { user_id?: string } } | null)
      ?.instructor?.user_id === userId

    if (!isInstructor) {
      const { data: enrollment } = await supabase
        .from('education_enrollments')
        .select('id, payment_status')
        .eq('course_id', session.course_id)
        .eq('student_id', userId)
        .single()

      if (!enrollment || enrollment.payment_status !== 'completed') {
        return NextResponse.json({ error: 'Not enrolled in this course' }, { status: 403 })
      }
    }

    // Parse query params
    const { searchParams } = new URL(request.url)
    const finalsOnly = searchParams.get('finals_only') !== 'false'
    const language = searchParams.get('language')
    const limit = Math.min(parseInt(searchParams.get('limit') || '200', 10), 1000)
    const offset = parseInt(searchParams.get('offset') || '0', 10)

    // Build query
    let query = supabase
      .from('education_caption_events')
      .select('id, speaker_uid, speaker_user_id, source_language, text, is_partial, sequence_number, timestamp_ms, created_at', { count: 'exact' })
      .eq('session_id', sessionId)

    if (finalsOnly) {
      query = query.eq('is_partial', false)
    }

    if (language) {
      query = query.eq('source_language', language)
    }

    const { data: events, error, count } = await query
      .order('sequence_number', { ascending: true })
      .range(offset, offset + limit - 1)

    if (error) {
      console.error('[Education Captions] history error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({
      session_id: sessionId,
      events: events || [],
      total: count || 0,
      limit,
      offset,
      finals_only: finalsOnly,
    })
  } catch (err) {
    console.error('[Education Captions] history error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
