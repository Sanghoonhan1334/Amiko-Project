import { NextRequest, NextResponse } from 'next/server'
import { supabaseServer } from '@/lib/supabaseServer'

/**
 * GET /api/meet/users/[userId]/reputation — Get public reputation for a user
 */

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ userId: string }> }
) {
  if (!supabaseServer) {
    return NextResponse.json({ error: 'Server not configured' }, { status: 500 })
  }

  const { userId } = await context.params

  // Get aggregated reputation
  const { data: reputation } = await supabaseServer
    .from('amiko_meet_user_reputation')
    .select('*')
    .eq('user_id', userId)
    .single()

  // Get recent ratings (public view — no comments)
  const { data: recentRatings } = await supabaseServer
    .from('amiko_meet_session_reputation')
    .select('overall_rating, communication_rating, respect_rating, helpfulness_rating, language_skill_rating, badges, created_at')
    .eq('rated_user_id', userId)
    .order('created_at', { ascending: false })
    .limit(10)

  return NextResponse.json({
    success: true,
    reputation: reputation || {
      user_id: userId,
      total_sessions: 0,
      total_ratings_received: 0,
      avg_overall: 0,
      avg_communication: 0,
      avg_respect: 0,
      avg_helpfulness: 0,
      avg_language_skill: 0,
      badges_earned: {},
      reputation_tier: 'newcomer',
    },
    recent_ratings: recentRatings || [],
  })
}
