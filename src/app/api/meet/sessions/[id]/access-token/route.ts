import { NextRequest, NextResponse } from 'next/server'
import { supabaseServer } from '@/lib/supabaseServer'
import { RtcTokenBuilder, RtcRole } from 'agora-token'

// POST /api/meet/sessions/[id]/access-token
// Issue Agora token after validating access
export async function POST(
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
    const authToken = authHeader.split(' ')[1]
    const { data: { user } } = await supabaseServer.auth.getUser(authToken)
    if (!user) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }

    const { id: sessionId } = await context.params

    // 1. Get session
    const { data: session } = await supabaseServer
      .from('amiko_meet_sessions')
      .select('id, status, agora_channel, scheduled_at, duration_minutes, host_id')
      .eq('id', sessionId)
      .single()

    if (!session) {
      await logAccess(sessionId, user.id, 'denied', { reason: 'session_not_found' })
      return NextResponse.json({ error: 'Session not found' }, { status: 404 })
    }

    // 2. Check session status
    if (session.status === 'cancelled') {
      await logAccess(sessionId, user.id, 'denied', { reason: 'session_cancelled' })
      return NextResponse.json({ error: 'Session cancelled' }, { status: 403 })
    }

    if (session.status === 'completed') {
      await logAccess(sessionId, user.id, 'denied', { reason: 'session_completed' })
      return NextResponse.json({ error: 'Session already ended' }, { status: 403 })
    }

    // 3. Check enrollment
    const { data: participant } = await supabaseServer
      .from('amiko_meet_participants')
      .select('id, role, status')
      .eq('session_id', sessionId)
      .eq('user_id', user.id)
      .single()

    if (!participant || participant.status === 'cancelled') {
      await logAccess(sessionId, user.id, 'denied', { reason: 'not_enrolled' })
      return NextResponse.json({ error: 'Not enrolled in this session' }, { status: 403 })
    }

    // 4. Check monthly limit (executed sessions)
    const startOfMonth = new Date()
    startOfMonth.setDate(1)
    startOfMonth.setHours(0, 0, 0, 0)

    const { data: executed } = await supabaseServer
      .from('amiko_meet_participants')
      .select('id, session:session_id!inner(status)')
      .eq('user_id', user.id)
      .eq('session.status', 'completed')
      .in('status', ['joined', 'left'])
      .gte('session.scheduled_at', startOfMonth.toISOString())

    // Allow if less than 2 completed OR this is an enrolled session (already counted)
    const completedCount = (executed || []).length
    // Only block if they've completed 2+ AND this session isn't already one they enrolled in
    // (enrollment check already validates the 2-limit)

    // 5. Check blocked users
    const { data: blocked } = await supabaseServer
      .from('blocked_users')
      .select('id')
      .eq('user_id', user.id)
      .single()

    if (blocked) {
      await logAccess(sessionId, user.id, 'denied', { reason: 'user_blocked' })
      return NextResponse.json({ error: 'User is blocked' }, { status: 403 })
    }

    // 6. Generate Agora token
    const appId = process.env.AGORA_APP_ID
    const appCertificate = process.env.AGORA_APP_CERTIFICATE

    if (!appId || !appCertificate) {
      return NextResponse.json({ error: 'Agora not configured' }, { status: 500 })
    }

    // Use a numeric UID derived from user id
    const uid = Math.abs(hashCode(user.id)) % 1000000

    // Token expires after session duration + 5 min buffer
    const expirationSeconds = (session.duration_minutes + 5) * 60
    const privilegeExpiredTs = Math.floor(Date.now() / 1000) + expirationSeconds

    const agoraToken = RtcTokenBuilder.buildTokenWithUid(
      appId,
      appCertificate,
      session.agora_channel,
      uid,
      RtcRole.PUBLISHER,
      privilegeExpiredTs,
      0,
    )

    // 7. Log access
    await logAccess(sessionId, user.id, 'token_issued', {
      uid,
      channel: session.agora_channel,
      role: participant.role,
    })

    // 8. If host is joining and session is 'scheduled', auto-transition to 'live'
    if (participant.role === 'host' && session.status === 'scheduled') {
      const scheduledAt = new Date(session.scheduled_at)
      const now = new Date()
      const earlyWindow = 5 * 60 * 1000
      if (now.getTime() >= scheduledAt.getTime() - earlyWindow) {
        await supabaseServer
          .from('amiko_meet_sessions')
          .update({ status: 'live', started_at: new Date().toISOString() } as any)
          .eq('id', sessionId)
      }
    }

    return NextResponse.json({
      token: agoraToken,
      channel: session.agora_channel,
      uid,
      appId,
      role: participant.role,
      duration_minutes: session.duration_minutes,
      scheduled_at: session.scheduled_at,
    })
  } catch (err) {
    console.error('[MEET_ACCESS_TOKEN] Unexpected error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// Helper: simple hash function to get numeric uid from UUID
function hashCode(str: string): number {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash |= 0
  }
  return hash
}

// Helper: log access events
async function logAccess(sessionId: string, userId: string, action: string, metadata?: any) {
  try {
    await supabaseServer!
      .from('amiko_meet_access_logs')
      .insert({
        session_id: sessionId,
        user_id: userId,
        action,
        metadata: metadata || {},
      } as any)
  } catch (e) {
    console.error('[MEET_ACCESS_LOG] Failed to log:', e)
  }
}
