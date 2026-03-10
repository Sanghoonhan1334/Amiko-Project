import { NextRequest, NextResponse } from 'next/server'
import { supabaseServer } from '@/lib/supabaseServer'

// GET /api/meet/sessions/[id] — Get session detail with participants
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    if (!supabaseServer) {
      return NextResponse.json({ error: 'DB not configured' }, { status: 500 })
    }

    const { id } = await context.params

    const { data: session, error } = await supabaseServer
      .from('amiko_meet_sessions')
      .select(`
        *,
        host:host_id (
          id,
          raw_user_meta_data
        ),
        participants:amiko_meet_participants (
          id,
          user_id,
          role,
          status,
          enrolled_at,
          user:user_id (
            id,
            raw_user_meta_data
          )
        )
      `)
      .eq('id', id)
      .single()

    if (error || !session) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 })
    }

    // Parse host info
    const result = {
      ...session,
      host_name: (session as any).host?.raw_user_meta_data?.full_name
        || (session as any).host?.raw_user_meta_data?.nickname
        || 'Anónimo',
      host_avatar: (session as any).host?.raw_user_meta_data?.avatar_url || null,
      participants: ((session as any).participants || []).map((p: any) => ({
        ...p,
        user_name: p.user?.raw_user_meta_data?.full_name
          || p.user?.raw_user_meta_data?.nickname
          || 'Anónimo',
        user_avatar: p.user?.raw_user_meta_data?.avatar_url || null,
      })),
    }

    return NextResponse.json({ session: result })
  } catch (err) {
    console.error('[MEET_SESSION_DETAIL] Unexpected error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// PATCH /api/meet/sessions/[id] — Update session (host or admin)
export async function PATCH(
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

    const { id } = await context.params
    const body = await request.json()

    // Verify ownership or admin
    const { data: session } = await supabaseServer
      .from('amiko_meet_sessions')
      .select('host_id, status')
      .eq('id', id)
      .single()

    if (!session) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 })
    }

    // Check admin
    const { data: adminUser } = await supabaseServer
      .from('admin_users')
      .select('id')
      .eq('user_id', user.id)
      .single()

    if (session.host_id !== user.id && !adminUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    // Validate status transitions
    const validStatuses = ['scheduled', 'live', 'completed', 'cancelled']
    if (body.status && !validStatuses.includes(body.status)) {
      return NextResponse.json({ error: `Invalid status. Must be one of: ${validStatuses.join(', ')}` }, { status: 400 })
    }

    // Validate state transitions
    const validTransitions: Record<string, string[]> = {
      scheduled: ['live', 'cancelled'],
      live: ['completed', 'cancelled'],
      completed: [],
      cancelled: [],
    }
    if (body.status && session.host_id) {
      const currentStatus = (session as any).status || 'scheduled'
      const allowed = validTransitions[currentStatus] || []
      if (!allowed.includes(body.status)) {
        return NextResponse.json(
          { error: `Cannot transition from '${currentStatus}' to '${body.status}'` },
          { status: 400 }
        )
      }
    }

    const allowedUpdates: Record<string, any> = {}
    if (body.status) allowedUpdates.status = body.status
    if (body.title) allowedUpdates.title = body.title
    if (body.description !== undefined) allowedUpdates.description = body.description
    if (body.topic !== undefined) allowedUpdates.topic = body.topic
    if (body.cancel_reason) allowedUpdates.cancel_reason = body.cancel_reason
    if (body.status === 'cancelled') allowedUpdates.cancel_reason = body.cancel_reason || 'Cancelled by host'
    if (body.status === 'live') allowedUpdates.started_at = new Date().toISOString()
    if (body.status === 'completed') allowedUpdates.ended_at = new Date().toISOString()

    const { data, error } = await supabaseServer
      .from('amiko_meet_sessions')
      .update(allowedUpdates as any)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ session: data })
  } catch (err) {
    console.error('[MEET_SESSION_PATCH] Unexpected error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
