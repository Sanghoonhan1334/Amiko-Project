import { NextRequest, NextResponse } from 'next/server'
import { supabaseServer } from '@/lib/supabaseServer'

// POST /api/meet/sessions/[id]/enroll — Enroll a user in a free session
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
    const { data: { user }, error: authError } = await supabaseServer.auth.getUser(token)
    if (authError || !user) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }

    const { id: sessionId } = await context.params

    // 1. Check session exists and is scheduled
    const { data: session } = await supabaseServer
      .from('amiko_meet_sessions')
      .select('id, status, max_participants, current_participants, scheduled_at')
      .eq('id', sessionId)
      .single()

    if (!session) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 })
    }

    if (session.status === 'cancelled') {
      return NextResponse.json({ error: 'Session has been cancelled' }, { status: 400 })
    }

    if (session.status === 'completed') {
      return NextResponse.json({ error: 'Session has already ended' }, { status: 400 })
    }

    // 2. Check capacity
    if (session.current_participants >= session.max_participants) {
      return NextResponse.json(
        { error: 'Session is full', code: 'SESSION_FULL' },
        { status: 400 }
      )
    }

    // 3. Check if already enrolled
    const { data: existing } = await supabaseServer
      .from('amiko_meet_participants')
      .select('id, status')
      .eq('session_id', sessionId)
      .eq('user_id', user.id)
      .single()

    if (existing && existing.status !== 'cancelled') {
      return NextResponse.json(
        { error: 'Already enrolled in this session', code: 'ALREADY_ENROLLED' },
        { status: 400 }
      )
    }

    // 4. Check monthly free limit (max 2 per month)
    const startOfMonth = new Date()
    startOfMonth.setDate(1)
    startOfMonth.setHours(0, 0, 0, 0)

    const { data: monthlyData } = await supabaseServer
      .from('amiko_meet_participants')
      .select('id, session:session_id!inner(status, scheduled_at)')
      .eq('user_id', user.id)
      .neq('status', 'cancelled')
      .gte('session.scheduled_at', startOfMonth.toISOString())

    const monthlyUsage = (monthlyData || []).length
    if (monthlyUsage >= 2) {
      return NextResponse.json(
        {
          error: 'Monthly free session limit reached (2/month)',
          code: 'LIMIT_REACHED',
          usage: { used: monthlyUsage, max: 2 },
        },
        { status: 403 }
      )
    }

    // 5. Enroll (or re-enroll if previously cancelled)
    if (existing) {
      // Re-check capacity before re-enrollment
      if (session.current_participants >= session.max_participants) {
        return NextResponse.json(
          { error: 'Session is full', code: 'SESSION_FULL' },
          { status: 400 }
        )
      }
      // Re-enroll
      const { data, error } = await supabaseServer
        .from('amiko_meet_participants')
        .update({ status: 'enrolled', enrolled_at: new Date().toISOString() } as any)
        .eq('id', existing.id)
        .select()
        .single()

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 })
      }
      return NextResponse.json({ participant: data, usage: { used: monthlyUsage + 1, max: 2 } })
    }

    const { data: participant, error: enrollError } = await supabaseServer
      .from('amiko_meet_participants')
      .insert({
        session_id: sessionId,
        user_id: user.id,
        role: 'participant',
        status: 'enrolled',
      } as any)
      .select()
      .single()

    if (enrollError) {
      console.error('[MEET_ENROLL] Error:', enrollError)
      return NextResponse.json({ error: enrollError.message }, { status: 500 })
    }

    return NextResponse.json({
      participant,
      usage: { used: monthlyUsage + 1, max: 2 },
    }, { status: 201 })
  } catch (err) {
    console.error('[MEET_ENROLL] Unexpected error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// DELETE /api/meet/sessions/[id]/enroll — Cancel enrollment
export async function DELETE(
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

    const { data, error } = await supabaseServer
      .from('amiko_meet_participants')
      .update({ status: 'cancelled' } as any)
      .eq('session_id', sessionId)
      .eq('user_id', user.id)
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, participant: data })
  } catch (err) {
    console.error('[MEET_UNENROLL] Unexpected error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
