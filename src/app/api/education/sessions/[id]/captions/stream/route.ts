import { NextRequest } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

/**
 * GET /api/education/sessions/[id]/captions/stream
 *
 * Server-Sent Events (SSE) stream for real-time captions.
 * Enrolled students and the instructor receive caption events as they arrive.
 *
 * Query params:
 *   last_sequence=N — resume from this sequence number
 *
 * SSE event types:
 *   connected        — initial connection ack
 *   caption_partial  — interim transcription
 *   caption_final    — final transcription
 *   session_ended    — session is no longer live
 *   timeout          — max SSE duration reached
 */
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    // Auth via Bearer token
    const authHeader = request.headers.get('authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response('Unauthorized', { status: 401 })
    }

    const token = authHeader.replace('Bearer ', '').trim()
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)
    if (authError || !user) {
      return new Response('Unauthorized', { status: 401 })
    }

    const { id: sessionId } = await context.params

    // Load session + course for enrollment check
    const { data: session } = await supabase
      .from('education_sessions')
      .select(`
        id, status, course_id,
        course:education_courses(
          id, instructor_id,
          instructor:instructor_profiles(user_id)
        )
      `)
      .eq('id', sessionId)
      .single()

    if (!session) {
      return new Response('Session not found', { status: 404 })
    }

    // Verify user has access (instructor or enrolled student)
    const isInstructor = (session.course as { instructor?: { user_id?: string } } | null)
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

    // Resume from last sequence
    const url = new URL(request.url)
    const lastSeq = parseInt(url.searchParams.get('last_sequence') || '0', 10)

    // Create SSE stream
    const encoder = new TextEncoder()
    let lastSequence = lastSeq
    let isAborted = false

    const stream = new ReadableStream({
      async start(controller) {
        // Send initial connection event
        controller.enqueue(
          encoder.encode(
            `event: connected\ndata: ${JSON.stringify({
              session_id: sessionId,
              user_id: user.id,
            })}\n\n`
          )
        )

        let pollCount = 0
        const KEEPALIVE_INTERVAL = 20   // ~30s
        const SESSION_CHECK_INTERVAL = 7 // ~10s

        const pollInterval = setInterval(async () => {
          if (isAborted) {
            clearInterval(pollInterval)
            return
          }

          pollCount++

          try {
            // Fetch new caption events after lastSequence
            const { data: events, error } = await supabase
              .from('education_caption_events')
              .select('id, speaker_uid, speaker_user_id, source_language, text, is_partial, sequence_number, timestamp_ms, created_at')
              .eq('session_id', sessionId)
              .gt('sequence_number', lastSequence)
              .order('sequence_number', { ascending: true })
              .limit(50)

            if (error) {
              console.error('[Education SSE] Poll error:', error)
              return
            }

            if (events && events.length > 0) {
              for (const event of events) {
                if (isAborted) break

                const data = JSON.stringify({
                  id: event.id,
                  speaker_uid: event.speaker_uid,
                  speaker_user_id: event.speaker_user_id,
                  source_language: event.source_language,
                  text: event.text,
                  is_partial: event.is_partial,
                  sequence_number: event.sequence_number,
                  timestamp_ms: event.timestamp_ms,
                })

                const eventType = event.is_partial ? 'caption_partial' : 'caption_final'
                controller.enqueue(encoder.encode(`event: ${eventType}\ndata: ${data}\n\n`))

                lastSequence = event.sequence_number
              }
            }

            // Check session liveness every ~10s
            if (pollCount % SESSION_CHECK_INTERVAL === 0) {
              const { data: currentSession } = await supabase
                .from('education_sessions')
                .select('status')
                .eq('id', sessionId)
                .single()

              if (currentSession && !['live', 'ending'].includes(currentSession.status)) {
                controller.enqueue(
                  encoder.encode(
                    `event: session_ended\ndata: ${JSON.stringify({ status: currentSession.status })}\n\n`
                  )
                )
                clearInterval(pollInterval)
                controller.close()
                return
              }
            }

            // Keepalive every ~30s when no events
            if ((!events || events.length === 0) && pollCount % KEEPALIVE_INTERVAL === 0) {
              controller.enqueue(encoder.encode(`: keepalive\n\n`))
            }
          } catch (err) {
            console.error('[Education SSE] Poll exception:', err)
          }
        }, 1500)

        // Cleanup on abort
        request.signal.addEventListener('abort', () => {
          isAborted = true
          clearInterval(pollInterval)
          try { controller.close() } catch {}
        })

        // Safety timeout: 70 minutes (max class = 60 + buffer)
        setTimeout(() => {
          isAborted = true
          clearInterval(pollInterval)
          try {
            controller.enqueue(
              encoder.encode(`event: timeout\ndata: ${JSON.stringify({ reason: 'max_duration' })}\n\n`)
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
    console.error('[Education SSE] stream error:', err)
    return new Response('Internal error', { status: 500 })
  }
}

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'
