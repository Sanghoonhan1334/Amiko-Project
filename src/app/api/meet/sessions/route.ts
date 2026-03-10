import { NextRequest, NextResponse } from 'next/server'
import { supabaseServer } from '@/lib/supabaseServer'
import { v4 as uuidv4 } from 'uuid'

// GET /api/meet/sessions — List upcoming & live sessions (public)
export async function GET(request: NextRequest) {
  try {
    if (!supabaseServer) {
      return NextResponse.json({ error: 'DB not configured' }, { status: 500 })
    }

    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status') // 'scheduled' | 'live' | 'completed' | 'all'
    const limit = parseInt(searchParams.get('limit') || '20')

    let query = supabaseServer
      .from('amiko_meet_sessions')
      .select(`
        *,
        host:host_id (
          id,
          raw_user_meta_data
        )
      `)
      .order('scheduled_at', { ascending: true })
      .limit(limit)

    if (status && status !== 'all') {
      query = query.eq('status', status)
      // For completed/cancelled, don't filter by future date
      if (status === 'scheduled') {
        query = query.gte('scheduled_at', new Date().toISOString())
      }
    } else {
      // By default show scheduled + live
      query = query.in('status', ['scheduled', 'live'])
      // Only show future sessions (or live ones)
      query = query.or(`status.eq.live,scheduled_at.gte.${new Date().toISOString()}`)
    }

    const { data, error } = await query

    if (error) {
      console.error('[MEET_SESSIONS] Error listing:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Parse host info from raw_user_meta_data
    const sessions = (data || []).map((s: any) => ({
      ...s,
      host_name: s.host?.raw_user_meta_data?.full_name
        || s.host?.raw_user_meta_data?.nickname
        || s.host?.raw_user_meta_data?.korean_name
        || 'Anónimo',
      host_avatar: s.host?.raw_user_meta_data?.avatar_url || null,
    }))

    return NextResponse.json({ sessions })
  } catch (err) {
    console.error('[MEET_SESSIONS] Unexpected error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST /api/meet/sessions — Create a free video session
export async function POST(request: NextRequest) {
  try {
    if (!supabaseServer) {
      return NextResponse.json({ error: 'DB not configured' }, { status: 500 })
    }

    // Auth check
    const authHeader = request.headers.get('Authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }
    const token = authHeader.split(' ')[1]
    const { data: { user }, error: authError } = await supabaseServer.auth.getUser(token)
    if (authError || !user) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }

    const body = await request.json()
    const { title, topic, description, language: lang, slot_id, scheduled_at } = body

    if (!title || !scheduled_at) {
      return NextResponse.json(
        { error: 'title and scheduled_at are required' },
        { status: 400 }
      )
    }

    // Validate scheduled_at is in the future
    const scheduledDate = new Date(scheduled_at)
    if (isNaN(scheduledDate.getTime()) || scheduledDate.getTime() <= Date.now()) {
      return NextResponse.json(
        { error: 'scheduled_at must be a valid date in the future' },
        { status: 400 }
      )
    }

    // Validate input lengths
    if (title.length > 200) {
      return NextResponse.json({ error: 'title must be 200 characters or less' }, { status: 400 })
    }
    if (description && description.length > 2000) {
      return NextResponse.json({ error: 'description must be 2000 characters or less' }, { status: 400 })
    }
    if (topic && topic.length > 200) {
      return NextResponse.json({ error: 'topic must be 200 characters or less' }, { status: 400 })
    }

    // Check if user has already used 2 free sessions this month
    const startOfMonth = new Date()
    startOfMonth.setDate(1)
    startOfMonth.setHours(0, 0, 0, 0)

    const { data: usageData } = await supabaseServer
      .from('amiko_meet_participants')
      .select('id, session:session_id!inner(status, scheduled_at)')
      .eq('user_id', user.id)
      .neq('status', 'cancelled')
      .gte('session.scheduled_at', startOfMonth.toISOString())

    const monthlyUsage = (usageData || []).length
    if (monthlyUsage >= 2) {
      return NextResponse.json(
        { error: 'Monthly free session limit reached (2/month)', code: 'LIMIT_REACHED' },
        { status: 403 }
      )
    }

    // Validate slot if provided
    if (slot_id) {
      const { data: slot } = await supabaseServer
        .from('amiko_meet_slots')
        .select('*')
        .eq('id', slot_id)
        .eq('is_active', true)
        .single()

      if (!slot) {
        return NextResponse.json({ error: 'Invalid or inactive slot' }, { status: 400 })
      }
    }

    // Generate unique Agora channel name
    const channelName = `amiko-meet-${uuidv4().slice(0, 8)}`

    // Create session
    const { data: session, error: createError } = await supabaseServer
      .from('amiko_meet_sessions')
      .insert({
        slot_id: slot_id || null,
        host_id: user.id,
        title,
        topic: topic || null,
        description: description || null,
        language: lang || 'mixed',
        scheduled_at,
        duration_minutes: 30,
        max_participants: 6,
        agora_channel: channelName,
        status: 'scheduled',
      } as any)
      .select()
      .single()

    if (createError) {
      console.error('[MEET_SESSIONS] Error creating session:', createError)
      return NextResponse.json({ error: createError.message }, { status: 500 })
    }

    // Auto-enroll host as participant with role 'host'
    await supabaseServer
      .from('amiko_meet_participants')
      .insert({
        session_id: session.id,
        user_id: user.id,
        role: 'host',
        status: 'enrolled',
      } as any)

    // Log creation
    await supabaseServer
      .from('amiko_meet_access_logs')
      .insert({
        session_id: session.id,
        user_id: user.id,
        action: 'session_created',
        metadata: { event: 'session_created' },
      } as any)

    return NextResponse.json({ session }, { status: 201 })
  } catch (err) {
    console.error('[MEET_SESSIONS] Unexpected error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
