import { NextRequest } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

/**
 * GET /api/education/sessions/[id]/translations/stream
 *
 * Server-Sent Events stream for real-time translated captions.
 * Mirrors the captions/stream pattern: polls education_translation_events
 * and pushes new rows as SSE events.
 *
 * Access: instructor OR enrolled student with completed payment.
 *
 * SSE event types:
 *   connected          — initial ack with user preferences included
 *   translation_final  — a final translation event (main payload)
 *   session_ended      — session is no longer live
 *   timeout            — max stream duration reached
 *
 * Query params:
 *   last_sequence=N    — resume from this sequence number (optional)
 *
 * Each translation_final payload:
 *   id, caption_event_id, source_language, target_language,
 *   original_text, translated_text, provider, translation_ms,
 *   sequence_number, translation_error (bool, only if errored)
 */
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    // ── Auth ────────────────────────────────────────────────────────────
    const authHeader = request.headers.get('authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response('Unauthorized', { status: 401 })
    }

    const token = authHeader.replace('Bearer ', '').trim()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser(token)

    if (authError || !user) {
      return new Response('Unauthorized', { status: 401 })
    }

    const { id: sessionId } = await context.params

    // ── Load session ────────────────────────────────────────────────────
    const { data: session } = await supabase
      .from('education_sessions')
      .select(
        `id, status, course_id,
         course:education_courses(
           id,
           instructor:instructor_profiles(user_id)
         )`
      )
      .eq('id', sessionId)
      .single()

    if (!session) {
      return new Response('Session not found', { status: 404 })
    }

    // ── Access check: instructor or enrolled student ─────────────────────
    const isInstructor =
      (session.course as { instructor?: { user_id?: string } } | null)
        ?.instructor?.user_id === user.id

    if (!isInstructor) {
      const { data: enrollment } = await supabase
        .from('education_enrollments')
        .select('id, payment_status')
        .eq('course_id', session.course_id)
        .eq('student_id', user.id)
        .single()

      if (!enrollment || enrollment.payment_status !== 'completed') {
        return new Response('Not enrolled', { status: 403 })
      }
    }

    // ── Load user translation preferences ───────────────────────────────
    const { data: prefs } = await supabase
      .from('education_translation_preferences')
      .select('display_mode, target_language, auto_translate')
      .eq('user_id', user.id)
      .single()

    const displayMode = prefs?.display_mode ?? 'original_and_translated'
    const targetLanguage = prefs?.target_language ?? 'es'
    const autoTranslate = prefs?.auto_translate !== false

    // If user turned off translations, send a quick closed stream
    if (!autoTranslate || displayMode === 'none') {
      const encoder = new TextEncoder()
      const body = encoder.encode(
        `event: connected\ndata: ${JSON.stringify({
          session_id: sessionId,
          auto_translate: false,
          display_mode: displayMode,
        })}\n\n`
      )
      return new Response(body, {
        headers: {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache, no-transform',
          Connection: 'keep-alive',
          'X-Accel-Buffering': 'no',
        },
      })
    }

    // ── Resume from last_sequence ───────────────────────────────────────
    const url = new URL(request.url)
    const lastSeqParam = url.searchParams.get('last_sequence')
    let lastSequence = lastSeqParam ? parseInt(lastSeqParam, 10) : 0
    if (isNaN(lastSequence)) lastSequence = 0

    // ── SSE stream ──────────────────────────────────────────────────────
    const encoder = new TextEncoder()
    let isAborted = false

    const stream = new ReadableStream({
      async start(controller) {
        // Initial connection event
        controller.enqueue(
          encoder.encode(
            `event: connected\ndata: ${JSON.stringify({
              session_id: sessionId,
              user_id: user.id,
              display_mode: displayMode,
              target_language: targetLanguage,
            })}\n\n`
          )
        )

        let pollCount = 0
        const KEEPALIVE_INTERVAL = 20  // ~30s at 1.5s polls
        const SESSION_CHECK_INTERVAL = 7 // ~10s

        const pollInterval = setInterval(async () => {
          if (isAborted) {
            clearInterval(pollInterval)
            return
          }

          pollCount++

          try {
            // Fetch new translation events after lastSequence
            const { data: events, error } = await supabase
              .from('education_translation_events')
              .select(
                'id, caption_event_id, source_language, target_language, ' +
                'original_text, translated_text, provider, translation_ms, ' +
                'error_message, sequence_number, created_at'
              )
              .eq('session_id', sessionId)
              .eq('target_language', targetLanguage)
              .gt('sequence_number', lastSequence)
              .order('sequence_number', { ascending: true })
              .limit(50)

            if (error) {
              console.error('[Education Translation SSE] Poll error:', error)
              return
            }

            if (events && events.length > 0) {
              for (const evt of events) {
                if (isAborted) break

                const payload: Record<string, unknown> = {
                  id: evt.id,
                  caption_event_id: evt.caption_event_id,
                  source_language: evt.source_language,
                  target_language: evt.target_language,
                  translated_text: evt.translated_text,
                  provider: evt.provider,
                  translation_ms: evt.translation_ms,
                  sequence_number: evt.sequence_number,
                }

                // Include original if user wants both
                if (displayMode !== 'translated_only') {
                  payload.original_text = evt.original_text
                }

                // Flag translation errors so frontend can show original as fallback
                if (evt.error_message) {
                  payload.translation_error = true
                }

                controller.enqueue(
                  encoder.encode(
                    `event: translation_final\ndata: ${JSON.stringify(payload)}\n\n`
                  )
                )

                lastSequence = evt.sequence_number
              }
            }

            // Session liveness check every ~10s
            if (pollCount % SESSION_CHECK_INTERVAL === 0) {
              const { data: currentSession } = await supabase
                .from('education_sessions')
                .select('status')
                .eq('id', sessionId)
                .single()

              if (
                currentSession &&
                !['live', 'ending'].includes(currentSession.status)
              ) {
                controller.enqueue(
                  encoder.encode(
                    `event: session_ended\ndata: ${JSON.stringify({
                      status: currentSession.status,
                    })}\n\n`
                  )
                )
                clearInterval(pollInterval)
                controller.close()
                return
              }
            }

            // Keepalive every ~30s when no events
            if (
              (!events || events.length === 0) &&
              pollCount % KEEPALIVE_INTERVAL === 0
            ) {
              controller.enqueue(encoder.encode(': keepalive\n\n'))
            }
          } catch (err) {
            console.error('[Education Translation SSE] Poll exception:', err)
          }
        }, 1500)

        // Cleanup on client disconnect
        request.signal.addEventListener('abort', () => {
          isAborted = true
          clearInterval(pollInterval)
          try { controller.close() } catch {}
        })

        // Safety timeout: 70 minutes (max class 60 + buffer)
        setTimeout(() => {
          isAborted = true
          clearInterval(pollInterval)
          try {
            controller.enqueue(
              encoder.encode(
                `event: timeout\ndata: ${JSON.stringify({ reason: 'max_duration' })}\n\n`
              )
            )
            controller.close()
          } catch {}
        }, 70 * 60 * 1000)
      },

      cancel() {
        isAborted = true
      },
    })

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache, no-transform',
        Connection: 'keep-alive',
        'X-Accel-Buffering': 'no',
      },
    })
  } catch (err) {
    console.error('[Education Translation SSE] stream error:', err)
    return new Response('Internal error', { status: 500 })
  }
}

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'
