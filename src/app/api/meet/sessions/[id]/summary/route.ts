import { NextRequest, NextResponse } from 'next/server'
import { supabaseServer } from '@/lib/supabaseServer'
import { generateSessionSummary } from '@/lib/meet-summary'

/**
 * POST /api/meet/sessions/[id]/summary — Generate session summary
 * GET  /api/meet/sessions/[id]/summary — Get existing summary
 */

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
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

  // Verify participant
  const { data: participant } = await supabaseServer
    .from('amiko_meet_participants')
    .select('id')
    .eq('session_id', sessionId)
    .eq('user_id', user.id)
    .single()

  if (!participant) {
    return NextResponse.json({ error: 'Not a participant' }, { status: 403 })
  }

  // Verify session is completed before generating summary
  const { data: session } = await supabaseServer
    .from('amiko_meet_sessions')
    .select('status')
    .eq('id', sessionId)
    .single()

  if (!session || session.status !== 'completed') {
    return NextResponse.json(
      { error: 'Summary can only be generated for completed sessions' },
      { status: 400 }
    )
  }

  // Generate summary
  const summary = await generateSessionSummary(sessionId)

  if (!summary) {
    return NextResponse.json({ error: 'Failed to generate summary' }, { status: 500 })
  }

  return NextResponse.json({ success: true, summary })
}

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
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

  // Verify participant can view summary
  const { data: participantCheck } = await supabaseServer
    .from('amiko_meet_participants')
    .select('id')
    .eq('session_id', sessionId)
    .eq('user_id', user.id)
    .single()

  if (!participantCheck) {
    return NextResponse.json({ error: 'Not a participant' }, { status: 403 })
  }

  const { data: summary } = await supabaseServer
    .from('amiko_meet_session_summaries')
    .select('*')
    .eq('session_id', sessionId)
    .single()

  if (!summary) {
    return NextResponse.json({ success: true, summary: null })
  }

  return NextResponse.json({ success: true, summary })
}
