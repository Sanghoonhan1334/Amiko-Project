import { NextRequest, NextResponse } from 'next/server'
import { supabaseServer } from '@/lib/supabaseServer'

// GET /api/meet/sessions/[id]/chat — Get chat messages
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    if (!supabaseServer) {
      return NextResponse.json({ error: 'DB not configured' }, { status: 500 })
    }

    // Auth check
    const authHeader = request.headers.get('authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const { data: { user }, error: authErr } = await supabaseServer.auth.getUser(
      authHeader.replace('Bearer ', '')
    )
    if (authErr || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id: sessionId } = await context.params
    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '100')
    const after = searchParams.get('after') // ISO timestamp for polling

    let query = supabaseServer
      .from('amiko_meet_chat_messages')
      .select('id, content, message_type, created_at, user_id')
      .eq('session_id', sessionId)
      .order('created_at', { ascending: true })
      .limit(limit)

    if (after) {
      query = query.gt('created_at', after)
    }

    const { data, error } = await query

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Fetch user info for message senders
    const userIds = [...new Set((data || []).map((m: any) => m.user_id).filter(Boolean))]
    let userMap: Record<string, { full_name?: string; nickname?: string; profile_image?: string }> = {}
    if (userIds.length > 0) {
      const { data: usersData } = await (supabaseServer as any)
        .from('users')
        .select('id, full_name, nickname, profile_image')
        .in('id', userIds)
      for (const u of (usersData || [])) {
        userMap[u.id] = u
      }
    }

    const messages = (data || []).map((m: any) => {
      const u = userMap[m.user_id]
      return {
        id: m.id,
        content: m.content,
        message_type: m.message_type,
        created_at: m.created_at,
        user_id: m.user_id,
        user_name: u?.full_name || u?.nickname || 'Anónimo',
        user_avatar: u?.profile_image || null,
      }
    })

    return NextResponse.json({ messages })
  } catch (err) {
    console.error('[MEET_CHAT_GET] Error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST /api/meet/sessions/[id]/chat — Send a message
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
    const body = await request.json()
    const { content, message_type } = body

    if (!content?.trim()) {
      return NextResponse.json({ error: 'Content is required' }, { status: 400 })
    }

    if (content.length > 500) {
      return NextResponse.json({ error: 'Message too long (max 500 chars)' }, { status: 400 })
    }

    // Verify user is a participant
    const { data: participant } = await (supabaseServer as any)
      .from('amiko_meet_participants')
      .select('id, status')
      .eq('session_id', sessionId)
      .eq('user_id', user.id)
      .single()

    if (!participant || !['enrolled', 'joined'].includes((participant as any).status)) {
      return NextResponse.json({ error: 'Not authorized to chat' }, { status: 403 })
    }

    // Verify session is active
    const { data: sessionCheck } = await (supabaseServer as any)
      .from('amiko_meet_sessions')
      .select('status')
      .eq('id', sessionId)
      .single()

    if (!sessionCheck || !['scheduled', 'live'].includes((sessionCheck as any).status)) {
      return NextResponse.json({ error: 'Session is not active' }, { status: 400 })
    }

    const { data: msg, error } = await supabaseServer
      .from('amiko_meet_chat_messages')
      .insert({
        session_id: sessionId,
        user_id: user.id,
        content: content.trim(),
        message_type: message_type || 'user',
      } as any)
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ message: msg }, { status: 201 })
  } catch (err) {
    console.error('[MEET_CHAT_POST] Error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
