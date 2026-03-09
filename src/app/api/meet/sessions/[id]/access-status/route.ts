import { NextRequest, NextResponse } from 'next/server'
import { supabaseServer } from '@/lib/supabaseServer'

// GET /api/meet/sessions/[id]/access-status
// Check if user can join this session
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    if (!supabaseServer) {
      return NextResponse.json({ error: 'DB not configured' }, { status: 500 })
    }

    const authHeader = request.headers.get('Authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }
    const token = authHeader.split(' ')[1]
    const { data: { user } } = await supabaseServer.auth.getUser(token)
    if (!user) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }

    const { id: sessionId } = await context.params

    // Get session
    const { data: session } = await supabaseServer
      .from('amiko_meet_sessions')
      .select('id, status, scheduled_at, duration_minutes, host_id')
      .eq('id', sessionId)
      .single()

    if (!session) {
      return NextResponse.json({ canJoin: false, reason: 'session_not_found' })
    }

    // Check if session is cancelled
    if (session.status === 'cancelled') {
      return NextResponse.json({ canJoin: false, reason: 'session_cancelled' })
    }

    // Check if session is completed
    if (session.status === 'completed') {
      return NextResponse.json({ canJoin: false, reason: 'session_completed' })
    }

    // Check if user is enrolled
    const { data: participant } = await supabaseServer
      .from('amiko_meet_participants')
      .select('id, role, status')
      .eq('session_id', sessionId)
      .eq('user_id', user.id)
      .single()

    if (!participant || participant.status === 'cancelled') {
      return NextResponse.json({ canJoin: false, reason: 'not_enrolled' })
    }

    // Check monthly usage
    const startOfMonth = new Date()
    startOfMonth.setDate(1)
    startOfMonth.setHours(0, 0, 0, 0)

    const { data: completed } = await supabaseServer
      .from('amiko_meet_participants')
      .select('id, session:session_id!inner(status)')
      .eq('user_id', user.id)
      .eq('session.status', 'completed')
      .eq('status', 'left')
      .gte('session.scheduled_at', startOfMonth.toISOString())

    const executedThisMonth = (completed || []).length

    // Check time window — allow joining 5 minutes before until session end
    const scheduledAt = new Date(session.scheduled_at)
    const now = new Date()
    const earlyWindow = 5 * 60 * 1000 // 5 min before
    const sessionEnd = new Date(scheduledAt.getTime() + session.duration_minutes * 60 * 1000)

    const canJoinNow = now.getTime() >= (scheduledAt.getTime() - earlyWindow)
      && now.getTime() <= sessionEnd.getTime()

    return NextResponse.json({
      canJoin: true,
      canJoinNow,
      reason: canJoinNow ? 'ready' : 'not_time_yet',
      role: participant.role,
      scheduled_at: session.scheduled_at,
      duration_minutes: session.duration_minutes,
      monthlyUsage: { executed: executedThisMonth, max: 2 },
    })
  } catch (err) {
    console.error('[MEET_ACCESS_STATUS] Unexpected error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
