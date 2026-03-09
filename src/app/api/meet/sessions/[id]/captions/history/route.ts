import { NextRequest, NextResponse } from 'next/server'
import { supabaseServer } from '@/lib/supabaseServer'

// GET /api/meet/sessions/[id]/captions/history
// Returns recent final captions for a session (for late joiners or reconnection)
export async function GET(
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
    const url = new URL(request.url)
    const limit = Math.min(parseInt(url.searchParams.get('limit') || '50', 10), 200)
    const after = url.searchParams.get('after') // sequence_number to start after
    const onlyFinal = url.searchParams.get('only_final') !== 'false' // default: only final captions

    // Verify participant
    const { data: participant } = await supabaseServer
      .from('amiko_meet_participants')
      .select('id')
      .eq('session_id', sessionId)
      .eq('user_id', user.id)
      .in('status', ['enrolled', 'joined'])
      .single()

    if (!participant) {
      return NextResponse.json({ error: 'Not a participant' }, { status: 403 })
    }

    // Build query
    let query = (supabaseServer as any)
      .from('amiko_meet_caption_events')
      .select('id, speaker_uid, speaker_user_id, speaker_name, content, language, is_final, sequence_number, timestamp_ms, created_at')
      .eq('session_id', sessionId)
      .order('sequence_number', { ascending: true })
      .limit(limit)

    if (onlyFinal) {
      query = query.eq('is_final', true)
    }

    if (after) {
      const afterNum = parseInt(after, 10)
      if (!isNaN(afterNum) && isFinite(afterNum)) {
        query = query.gt('sequence_number', afterNum)
      }
    }

    const { data: captions, error: fetchErr } = await query

    if (fetchErr) {
      console.error('[Captions History]', fetchErr)
      return NextResponse.json({ error: 'Failed to fetch history' }, { status: 500 })
    }

    // Get the STT task status
    const { data: task } = await (supabaseServer as any)
      .from('amiko_meet_stt_tasks')
      .select('id, status, started_at, stopped_at')
      .eq('session_id', sessionId)
      .single()

    return NextResponse.json({
      captions: captions || [],
      count: captions?.length || 0,
      task_status: task?.status || 'idle',
      last_sequence: captions?.length ? captions[captions.length - 1].sequence_number : 0,
    })
  } catch (err: any) {
    console.error('[Captions History]', err)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
