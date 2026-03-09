import { NextRequest } from 'next/server'
import { supabaseServer } from '@/lib/supabaseServer'

// GET /api/meet/sessions/[id]/translations/stream
// Server-Sent Events stream for real-time translation events.
// Mirrors the captions/stream pattern but serves translated content.
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    if (!supabaseServer) {
      return new Response('Server not configured', { status: 500 })
    }

    const authHeader = request.headers.get('authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response('Unauthorized', { status: 401 })
    }

    const { data: { user }, error: authError } = await supabaseServer.auth.getUser(
      authHeader.replace('Bearer ', '')
    )
    if (authError || !user) {
      return new Response('Unauthorized', { status: 401 })
    }

    const { id: sessionId } = await context.params

    // Verify session exists
    const { data: session } = await supabaseServer
      .from('amiko_meet_sessions')
      .select('id, status')
      .eq('id', sessionId)
      .single()

    if (!session) {
      return new Response('Session not found', { status: 404 })
    }

    // Verify participant
    const { data: participant } = await supabaseServer
      .from('amiko_meet_participants')
      .select('id')
      .eq('session_id', sessionId)
      .eq('user_id', user.id)
      .in('status', ['enrolled', 'joined'])
      .single()

    if (!participant) {
      return new Response('Not a participant', { status: 403 })
    }

    // Load user's translation preferences for filtering
    const { data: prefs } = await (supabaseServer as any)
      .from('amiko_meet_translation_preferences')
      .select('display_mode, target_language, auto_translate')
      .eq('user_id', user.id)
      .single()

    const displayMode = prefs?.display_mode || 'original_and_translated'
    const targetLanguage = prefs?.target_language || 'es'

    // Resume point
    const url = new URL(request.url)
    const lastSeq = parseInt(url.searchParams.get('last_sequence') || '0', 10)

    const encoder = new TextEncoder()
    let lastSequence = isNaN(lastSeq) ? 0 : lastSeq
    let isAborted = false

    const stream = new ReadableStream({
      async start(controller) {
        // Initial connection event with preferences
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
            // Poll for new translation events after lastSequence
            const { data: events, error } = await (supabaseServer as any)
              .from('amiko_meet_translation_events')
              .select(
                'id, caption_event_id, original_content, original_language, ' +
                'translated_content, translated_language, speaker_user_id, ' +
                'speaker_name, is_final, sequence_number, provider, translation_ms, ' +
                'error_message, created_at'
              )
              .eq('session_id', sessionId)
              .gt('sequence_number', lastSequence)
              .order('sequence_number', { ascending: true })
              .limit(50)

            if (error) {
              console.error('[Translation SSE Poll Error]', error)
              return
            }

            if (events && events.length > 0) {
              for (const evt of events) {
                if (isAborted) break

                // Build the payload based on display_mode
                const payload: Record<string, any> = {
                  id: evt.id,
                  caption_event_id: evt.caption_event_id,
                  speaker_user_id: evt.speaker_user_id,
                  speaker_name: evt.speaker_name,
                  is_final: evt.is_final,
                  sequence_number: evt.sequence_number,
                  provider: evt.provider,
                  translation_ms: evt.translation_ms,
                }

                // Always include translated text
                payload.translated_content = evt.translated_content
                payload.translated_language = evt.translated_language

                // Include original if display_mode wants it
                if (displayMode !== 'translated_only') {
                  payload.original_content = evt.original_content
                  payload.original_language = evt.original_language
                }

                // Flag error translations so frontend can show original as fallback
                if (evt.error_message) {
                  payload.translation_error = true
                }

                const eventType = evt.is_final ? 'translation_final' : 'translation_partial'
                controller.enqueue(
                  encoder.encode(`event: ${eventType}\ndata: ${JSON.stringify(payload)}\n\n`)
                )

                lastSequence = evt.sequence_number
              }
            }

            // Session liveness check
            if (pollCount % SESSION_CHECK_INTERVAL === 0) {
              const { data: currentSession } = await (supabaseServer as any)
                .from('amiko_meet_sessions')
                .select('status')
                .eq('id', sessionId)
                .single()

              if (currentSession && !['live', 'scheduled'].includes(currentSession.status)) {
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

            // Keepalive
            if ((!events || events.length === 0) && pollCount % KEEPALIVE_INTERVAL === 0) {
              controller.enqueue(encoder.encode(`: keepalive\n\n`))
            }
          } catch (err) {
            console.error('[Translation SSE Poll Exception]', err)
          }
        }, 1500) // Same 1.5s cadence as captions stream

        // Abort cleanup
        request.signal.addEventListener('abort', () => {
          isAborted = true
          clearInterval(pollInterval)
          try { controller.close() } catch {}
        })

        // Safety timeout: 25 min
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
        }, 25 * 60 * 1000)
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
  } catch (err: any) {
    console.error('[Translation Stream]', err)
    return new Response('Internal error', { status: 500 })
  }
}

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'
