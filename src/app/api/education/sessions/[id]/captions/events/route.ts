import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { requireEducationAuth } from '@/lib/education-auth'
import {
  translateEducationCaption,
  type EducationCaptionForTranslation,
} from '@/lib/education-translation'
import { checkRateLimit, getRateLimitIdentity } from '@/lib/education-rate-limiter'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

/**
 * POST /api/education/sessions/[id]/captions/events
 *
 * Receives caption events from the frontend (relayed from Agora STT data stream)
 * and stores them in education_caption_events for SSE distribution + history.
 *
 * Only the instructor (or admin) can submit caption events.
 *
 * Body: {
 *   speaker_uid: number,
 *   speaker_user_id?: string,
 *   source_language: string,
 *   text: string,
 *   is_partial: boolean,
 *   timestamp_ms?: number
 * }
 *
 * Or batch: { events: CaptionEvent[] }
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: sessionId } = await params
    const auth = await requireEducationAuth(request)
    if (auth.error) return auth.error
    const userId = auth.user.id

    // Rate limit: max 30 caption submits per user per minute
    if (!checkRateLimit('edu-captions-events', getRateLimitIdentity(request, userId), 30)) {
      return NextResponse.json({ error: 'Too many caption events. Please slow down.' }, { status: 429 })
    }

    // Verify session exists and is live
    const { data: session, error: sessionError } = await supabase
      .from('education_sessions')
      .select(`
        id, status, course_id,
        course:education_courses(
          id,
          instructor:instructor_profiles(user_id)
        )
      `)
      .eq('id', sessionId)
      .single()

    if (sessionError || !session) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 })
    }

    if (!['live', 'ending'].includes(session.status)) {
      return NextResponse.json({ error: 'Session is not live' }, { status: 400 })
    }

    // Only instructor or admin can submit caption events
    const isInstructor = (session.course as { instructor?: { user_id?: string } } | null)
      ?.instructor?.user_id === userId

    if (!isInstructor) {
      const { data: adminCheck } = await supabase
        .from('admin_users')
        .select('id')
        .eq('user_id', userId)
        .single()

      if (!adminCheck) {
        return NextResponse.json({ error: 'Only the instructor can submit caption events' }, { status: 403 })
      }
    }

    const body = await request.json()

    // Support single event or batch
    const events = body.events ? body.events : [body]

    if (!Array.isArray(events) || events.length === 0) {
      return NextResponse.json({ error: 'No events provided' }, { status: 400 })
    }

    // Validate and build records
    const now = Date.now()
    const records = events.map((e: any, idx: number) => {
      if (!e.text || typeof e.speaker_uid !== 'number' || !e.source_language) {
        return null
      }
      return {
        session_id: sessionId,
        course_id: session.course_id,
        speaker_uid: e.speaker_uid,
        speaker_user_id: e.speaker_user_id || null,
        source_language: e.source_language,
        text: e.text,
        is_partial: e.is_partial !== false, // default true
        sequence_number: now * 100 + idx,   // monotonic: ms * 100 + batch index
        timestamp_ms: e.timestamp_ms || now,
      }
    }).filter(Boolean)

    if (records.length === 0) {
      return NextResponse.json({ error: 'No valid events. Each event needs: speaker_uid, source_language, text' }, { status: 400 })
    }

    const { data, error } = await supabase
      .from('education_caption_events')
      .insert(records)
      .select('id, sequence_number, source_language, text, is_partial')

    if (error) {
      console.error('[Education Captions] insert error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // ── Fire-and-forget translation for FINAL captions only ───────────────
    // We never translate partials (spec: too noisy for UX).
    // Each final caption triggers one DeepSeek call stored in education_translation_events.
    if (data) {
      const finalInserted = data.filter(row => !row.is_partial)
      if (finalInserted.length > 0) {
        // Collect target languages from active translations prefs (best-effort).
        // For simplicity at insertion time, translate to the session default opposite
        // language. Per-user filtering happens in the translations/stream SSE route.
        Promise.allSettled(
          finalInserted.map(row => {
            const captionForTranslation: EducationCaptionForTranslation = {
              id: row.id,
              session_id: sessionId,
              course_id: session.course_id,
              source_language: row.source_language,
              text: row.text,
              is_partial: false,
              sequence_number: row.sequence_number,
            }
            return translateEducationCaption(captionForTranslation)
          })
        ).catch(err => {
          // Never let translation errors surface to the caller
          console.error('[Education Captions] translation fire-and-forget error:', err)
        })
      }
    }

    return NextResponse.json({
      inserted: data?.length || 0,
      events: data?.map(r => ({ id: r.id, sequence_number: r.sequence_number })),
    }, { status: 201 })
  } catch (err) {
    console.error('[Education Captions] events error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
