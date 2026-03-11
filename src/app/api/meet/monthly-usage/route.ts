import { NextRequest, NextResponse } from 'next/server'
import { supabaseServer } from '@/lib/supabaseServer'

// GET /api/meet/monthly-usage
// Returns the authenticated user's Amiko Meet usage for the current calendar month.
// Response: { used: number, max: number, remaining: number }
export async function GET(request: NextRequest) {
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

    const MAX_PER_MONTH = 2

    // Count all non-cancelled enrollments in the current calendar month.
    // This mirrors the logic in the enroll and session-create routes.
    const startOfMonth = new Date()
    startOfMonth.setDate(1)
    startOfMonth.setHours(0, 0, 0, 0)

    const { data: monthlyParticipants, error: countError } = await supabaseServer
      .from('amiko_meet_participants')
      .select('id, session:session_id!inner(scheduled_at, status)')
      .eq('user_id', user.id)
      .not('session.status', 'eq', 'cancelled')
      .neq('status', 'cancelled')
      .gte('session.scheduled_at', startOfMonth.toISOString()) as any

    if (countError) {
      console.error('[MEET_MONTHLY_USAGE] Error:', countError)
      return NextResponse.json({ error: 'Failed to fetch usage' }, { status: 500 })
    }

    const used = (monthlyParticipants || []).length
    const remaining = Math.max(0, MAX_PER_MONTH - used)

    return NextResponse.json({ used, max: MAX_PER_MONTH, remaining })
  } catch (err) {
    console.error('[MEET_MONTHLY_USAGE] Unexpected error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
