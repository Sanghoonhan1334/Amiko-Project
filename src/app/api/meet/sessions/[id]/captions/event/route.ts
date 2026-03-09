import { NextRequest, NextResponse } from 'next/server'
import { supabaseServer } from '@/lib/supabaseServer'

// POST /api/meet/sessions/[id]/captions/event
// Receives a caption event from a client's Web Speech API
// and stores it in the database for SSE broadcast
export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    if (!supabaseServer) {
      return NextResponse.json({ error: 'Server not configured' }, { status: 500 })
    }

    const authHeader = request.headers.get('authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: { user }, error: authError } = await supabaseServer.auth.getUser(
      authHeader.replace('Bearer ', '')
    )
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id: sessionId } = await context.params
    const body = await request.json()
    const {
      content,
      language,
      is_final,
      speaker_uid,
      timestamp_ms,
    } = body

    if (!content || typeof content !== 'string') {
      return NextResponse.json({ error: 'content is required' }, { status: 400 })
    }

    if (!language || !['ko', 'es', 'mixed', 'unknown'].includes(language)) {
      return NextResponse.json({ error: 'Invalid language' }, { status: 400 })
    }

    // Verify participant
    const { data: participant } = await supabaseServer
      .from('amiko_meet_participants')
      .select('id, role')
      .eq('session_id', sessionId)
      .eq('user_id', user.id)
      .in('status', ['enrolled', 'joined'])
      .single()

    if (!participant) {
      return NextResponse.json({ error: 'Not a participant' }, { status: 403 })
    }

    // Verify STT task is active (allow events even without explicit task for resilience)
    const { data: task } = await (supabaseServer as any)
      .from('amiko_meet_stt_tasks')
      .select('id, status')
      .eq('session_id', sessionId)
      .single()

    // If task exists but is stopped, still allow — client may have buffered events
    // We just log a warning but don't block

    // Get speaker display name
    const meta = user.user_metadata || {}
    const speakerName = meta.display_name || meta.full_name || meta.name || user.email?.split('@')[0] || 'User'

    // Insert caption event
    const { data: event, error: insertErr } = await (supabaseServer as any)
      .from('amiko_meet_caption_events')
      .insert({
        session_id: sessionId,
        speaker_uid: speaker_uid ?? null,
        speaker_user_id: user.id,
        speaker_name: speakerName,
        content: content.slice(0, 2000), // Limit to 2000 chars
        language,
        is_final: is_final === true,
        timestamp_ms: timestamp_ms ?? Date.now(),
      })
      .select('id, sequence_number, created_at')
      .single()

    if (insertErr) {
      console.error('[Caption Event Insert]', insertErr)
      return NextResponse.json({ error: 'Failed to save caption' }, { status: 500 })
    }

    return NextResponse.json({
      id: event.id,
      sequence_number: event.sequence_number,
      created_at: event.created_at,
    })
  } catch (err: any) {
    console.error('[Caption Event]', err)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
