import { NextRequest } from 'next/server'
import { supabaseServer } from '@/lib/supabaseServer'

// GET /api/meet/sessions/[id]/captions/stream
// Server-Sent Events (SSE) stream for real-time captions
// Clients connect and receive caption events as they arrive
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

    // Verify session
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

    // Get last_sequence from query param for resuming
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
          encoder.encode(`event: connected\ndata: ${JSON.stringify({ session_id: sessionId, user_id: user.id })}\n\n`)
        )

        // Poll DB for new events every 1.5s (balance latency vs DB load)
        let pollCount = 0
        const KEEPALIVE_INTERVAL = 20 // Send keepalive every ~30s (20 * 1.5s)
        const SESSION_CHECK_INTERVAL = 7 // Check session status every ~10s (7 * 1.5s)

        const pollInterval = setInterval(async () => {
          if (isAborted) {
            clearInterval(pollInterval)
            return
          }

          pollCount++

          try {
            // Fetch new events after lastSequence
            const { data: events, error } = await (supabaseServer as any)
              .from('amiko_meet_caption_events')
              .select('id, speaker_uid, speaker_user_id, speaker_name, content, language, is_final, sequence_number, timestamp_ms, created_at')
              .eq('session_id', sessionId)
              .gt('sequence_number', lastSequence)
              .order('sequence_number', { ascending: true })
              .limit(50)

            if (error) {
              console.error('[SSE Poll Error]', error)
              return
            }

            if (events && events.length > 0) {
              for (const event of events) {
                if (isAborted) break

                const data = JSON.stringify({
                  id: event.id,
                  speaker_uid: event.speaker_uid,
                  speaker_user_id: event.speaker_user_id,
                  speaker_name: event.speaker_name,
                  content: event.content,
                  language: event.language,
                  is_final: event.is_final,
                  sequence_number: event.sequence_number,
                  timestamp_ms: event.timestamp_ms,
                })

                const eventType = event.is_final ? 'caption_final' : 'caption_partial'
                controller.enqueue(
                  encoder.encode(`event: ${eventType}\ndata: ${data}\n\n`)
                )

                lastSequence = event.sequence_number
              }
            }

            // Check if session is still live — only every ~10 seconds to reduce DB load
            if (pollCount % SESSION_CHECK_INTERVAL === 0) {
              const { data: currentSession } = await (supabaseServer as any)
                .from('amiko_meet_sessions')
                .select('status')
                .eq('id', sessionId)
                .single()

              if (currentSession && !['live', 'scheduled'].includes(currentSession.status)) {
                controller.enqueue(
                  encoder.encode(`event: session_ended\ndata: ${JSON.stringify({ status: currentSession.status })}\n\n`)
                )
                clearInterval(pollInterval)
                controller.close()
                return
              }
            }

            // Send keepalive every ~30 seconds when no events
            if ((!events || events.length === 0) && pollCount % KEEPALIVE_INTERVAL === 0) {
              controller.enqueue(encoder.encode(`: keepalive\n\n`))
            }
          } catch (err) {
            console.error('[SSE Poll Exception]', err)
          }
        }, 1500) // 1.5s polling = reasonable latency vs DB load

        // Cleanup on abort
        request.signal.addEventListener('abort', () => {
          isAborted = true
          clearInterval(pollInterval)
          try { controller.close() } catch {}
        })

        // Safety timeout: close after 25 minutes (session max + buffer)
        setTimeout(() => {
          isAborted = true
          clearInterval(pollInterval)
          try {
            controller.enqueue(
              encoder.encode(`event: timeout\ndata: ${JSON.stringify({ reason: 'max_duration' })}\n\n`)
            )
            controller.close()
          } catch {}
        }, 25 * 60 * 1000)
      },

      cancel() {
        isAborted = true
      }
    })

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache, no-transform',
        Connection: 'keep-alive',
        'X-Accel-Buffering': 'no', // Disable nginx buffering
      },
    })
  } catch (err: any) {
    console.error('[Captions Stream]', err)
    return new Response('Internal error', { status: 500 })
  }
}

// Next.js config: disable body parsing and static optimization
export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'
