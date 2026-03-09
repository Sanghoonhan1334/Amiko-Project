import { NextRequest, NextResponse } from 'next/server'
import { supabaseServer } from '@/lib/supabaseServer'

// POST /api/meet/sessions/[id]/presence/join
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
    const body = await request.json().catch(() => ({}))

    // Update participant status to 'joined'
    await supabaseServer
      .from('amiko_meet_participants')
      .update({
        status: 'joined',
        joined_at: new Date().toISOString(),
        device_info: body.device_info || null,
      } as any)
      .eq('session_id', sessionId)
      .eq('user_id', user.id)

    // Log presence join
    await supabaseServer
      .from('amiko_meet_access_logs')
      .insert({
        session_id: sessionId,
        user_id: user.id,
        action: 'join',
        device_info: body.device_info || null,
      } as any)

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('[MEET_PRESENCE_JOIN] Error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
