import { NextRequest, NextResponse } from 'next/server'
import { supabaseServer } from '@/lib/supabaseServer'

// POST /api/meet/sessions/[id]/presence/leave
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
    const token = authHeader.split(' ')[1]
    const { data: { user } } = await supabaseServer.auth.getUser(token)
    if (!user) return NextResponse.json({ error: 'Invalid token' }, { status: 401 })

    const { id: sessionId } = await context.params

    // Update participant to 'left'
    await supabaseServer
      .from('amiko_meet_participants')
      .update({
        status: 'left',
        left_at: new Date().toISOString(),
      } as any)
      .eq('session_id', sessionId)
      .eq('user_id', user.id)

    // Log presence leave
    await supabaseServer
      .from('amiko_meet_access_logs')
      .insert({
        session_id: sessionId,
        user_id: user.id,
        action: 'leave',
      } as any)

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('[MEET_PRESENCE_LEAVE] Error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
