import { NextRequest, NextResponse } from 'next/server'
import { supabaseServer } from '@/lib/supabaseServer'

// POST /api/meet/sessions/[id]/captions/stop
// Stops the STT captioning task for a session
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

    // Check participant status
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

    // Find active task
    const { data: task } = await (supabaseServer as any)
      .from('amiko_meet_stt_tasks')
      .select('id, status')
      .eq('session_id', sessionId)
      .single()

    if (!task) {
      return NextResponse.json({ error: 'No caption task found' }, { status: 404 })
    }

    if (task.status === 'stopped') {
      return NextResponse.json({ task, message: 'Already stopped' })
    }

    // Stop the task
    const { data: updated, error: updateErr } = await (supabaseServer as any)
      .from('amiko_meet_stt_tasks')
      .update({
        status: 'stopped',
        stopped_at: new Date().toISOString(),
      })
      .eq('id', task.id)
      .select()
      .single()

    if (updateErr) {
      return NextResponse.json({ error: 'Failed to stop task' }, { status: 500 })
    }

    return NextResponse.json({ task: updated })
  } catch (err: any) {
    console.error('[Captions Stop]', err)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
