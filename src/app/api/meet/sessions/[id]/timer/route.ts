import { NextRequest, NextResponse } from 'next/server'
import { supabaseServer } from '@/lib/supabaseServer'

// GET /api/meet/sessions/[id]/timer — Get session timer state
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    if (!supabaseServer) {
      return NextResponse.json({ error: 'DB not configured' }, { status: 500 })
    }

    // Auth check — timer requires a valid session participant
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

    const { data: session } = await supabaseServer
      .from('amiko_meet_sessions')
      .select('id, status, scheduled_at, started_at, ended_at, duration_minutes')
      .eq('id', sessionId)
      .single()

    if (!session) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 })
    }

    const now = new Date()
    const scheduledAt = new Date(session.scheduled_at)
    const startedAt = session.started_at ? new Date(session.started_at) : null
    const durationMs = session.duration_minutes * 60 * 1000

    // Calculate end time based on actual start or scheduled time
    const effectiveStart = startedAt || scheduledAt
    const endsAt = new Date(effectiveStart.getTime() + durationMs)
    const remainingMs = Math.max(0, endsAt.getTime() - now.getTime())
    const elapsedMs = Math.max(0, now.getTime() - effectiveStart.getTime())

    // Warning thresholds
    const warnings = []
    if (remainingMs <= 5 * 60 * 1000 && remainingMs > 2 * 60 * 1000) {
      warnings.push('5_min_warning')
    }
    if (remainingMs <= 2 * 60 * 1000 && remainingMs > 1 * 60 * 1000) {
      warnings.push('2_min_warning')
    }
    if (remainingMs <= 1 * 60 * 1000 && remainingMs > 0) {
      warnings.push('1_min_warning')
    }
    if (remainingMs === 0) {
      warnings.push('session_ended')
    }

    // Auto-close if time is up and session is still live
    if (remainingMs === 0 && session.status === 'live') {
      await supabaseServer
        .from('amiko_meet_sessions')
        .update({
          status: 'completed',
          ended_at: endsAt.toISOString(),
        } as any)
        .eq('id', sessionId)

      // Log closure with actual user
      await supabaseServer
        .from('amiko_meet_access_logs')
        .insert({
          session_id: sessionId,
          user_id: user.id,
          action: 'session_closed',
          metadata: { reason: 'timer_expired', duration_minutes: session.duration_minutes },
        } as any)
        .then(() => {})
        .catch(() => {})
    }

    return NextResponse.json({
      session_id: session.id,
      status: remainingMs === 0 && session.status === 'live' ? 'completed' : session.status,
      scheduled_at: session.scheduled_at,
      started_at: session.started_at,
      duration_minutes: session.duration_minutes,
      ends_at: endsAt.toISOString(),
      remaining_seconds: Math.floor(remainingMs / 1000),
      elapsed_seconds: Math.floor(elapsedMs / 1000),
      warnings,
      server_time: now.toISOString(),
    })
  } catch (err) {
    console.error('[MEET_TIMER] Error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
