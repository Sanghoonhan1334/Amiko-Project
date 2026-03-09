import { NextRequest, NextResponse } from 'next/server'
import { supabaseServer } from '@/lib/supabaseServer'

// POST /api/meet/sessions/[id]/captions/start
// Starts the STT captioning task for a session
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

    // Verify session exists and is live
    const { data: session, error: sessError } = await (supabaseServer as any)
      .from('amiko_meet_sessions')
      .select('id, status, host_id')
      .eq('id', sessionId)
      .single()

    if (sessError || !session) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 })
    }

    if (session.status !== 'live') {
      return NextResponse.json(
        { error: 'Captions can only be started on live sessions' },
        { status: 400 }
      )
    }

    // Check if user is a participant
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

    // Check for existing task
    const { data: existingTask } = await (supabaseServer as any)
      .from('amiko_meet_stt_tasks')
      .select('id, status')
      .eq('session_id', sessionId)
      .single()

    if (existingTask) {
      if (existingTask.status === 'active') {
        return NextResponse.json({ task: existingTask, message: 'Already active' })
      }

      // Reactivate stopped/error/idle task
      const { data: updated, error: updateErr } = await (supabaseServer as any)
        .from('amiko_meet_stt_tasks')
        .update({
          status: 'active',
          started_at: new Date().toISOString(),
          stopped_at: null,
          error_message: null,
          started_by: user.id,
        })
        .eq('id', existingTask.id)
        .select()
        .single()

      if (updateErr) {
        return NextResponse.json({ error: 'Failed to start task' }, { status: 500 })
      }

      return NextResponse.json({ task: updated })
    }

    // Create new task
    const { data: task, error: createErr } = await (supabaseServer as any)
      .from('amiko_meet_stt_tasks')
      .insert({
        session_id: sessionId,
        status: 'active',
        started_at: new Date().toISOString(),
        started_by: user.id,
      })
      .select()
      .single()

    if (createErr) {
      return NextResponse.json({ error: 'Failed to create task' }, { status: 500 })
    }

    return NextResponse.json({ task })
  } catch (err: any) {
    console.error('[Captions Start]', err)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
