import { NextRequest, NextResponse } from 'next/server'
import { supabaseServer } from '@/lib/supabaseServer'

/**
 * POST /api/meet/sessions/[id]/reputation — Rate a session participant
 * GET  /api/meet/sessions/[id]/reputation — Get ratings for a session
 */

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  if (!supabaseServer) {
    return NextResponse.json({ error: 'Server not configured' }, { status: 500 })
  }

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

  // Verify participant
  const { data: participant } = await supabaseServer
    .from('amiko_meet_participants')
    .select('id')
    .eq('session_id', sessionId)
    .eq('user_id', user.id)
    .single()

  if (!participant) {
    return NextResponse.json({ error: 'Not a participant' }, { status: 403 })
  }

  try {
    const body = await request.json()
    const {
      rated_user_id,
      overall_rating,
      communication_rating,
      respect_rating,
      helpfulness_rating,
      language_skill_rating,
      comment,
      badges,
    } = body

    if (!rated_user_id || !overall_rating) {
      return NextResponse.json({ error: 'rated_user_id and overall_rating are required' }, { status: 400 })
    }

    if (rated_user_id === user.id) {
      return NextResponse.json({ error: 'Cannot rate yourself' }, { status: 400 })
    }

    if (typeof overall_rating !== 'number' || !Number.isInteger(overall_rating) || overall_rating < 1 || overall_rating > 5) {
      return NextResponse.json({ error: 'overall_rating must be an integer between 1 and 5' }, { status: 400 })
    }

    // Validate sub-ratings if provided
    const subRatings = { communication_rating, respect_rating, helpfulness_rating, language_skill_rating }
    for (const [key, val] of Object.entries(subRatings)) {
      if (val !== undefined && val !== null) {
        if (typeof val !== 'number' || !Number.isInteger(val) || val < 1 || val > 5) {
          return NextResponse.json({ error: `${key} must be an integer between 1 and 5` }, { status: 400 })
        }
      }
    }

    // Validate badges if provided
    const validBadges = ['active_learner', 'top_rated', 'culture_explorer', 'helpful_partner', 'great_communicator']
    if (badges && Array.isArray(badges)) {
      const invalidBadges = badges.filter((b: string) => !validBadges.includes(b))
      if (invalidBadges.length > 0) {
        return NextResponse.json({ error: `Invalid badges: ${invalidBadges.join(', ')}` }, { status: 400 })
      }
    }

    // Verify rated user is also a participant
    const { data: ratedParticipant } = await supabaseServer
      .from('amiko_meet_participants')
      .select('id')
      .eq('session_id', sessionId)
      .eq('user_id', rated_user_id)
      .single()

    if (!ratedParticipant) {
      return NextResponse.json({ error: 'Rated user is not a participant in this session' }, { status: 400 })
    }

    const { data: rating, error: insertError } = await supabaseServer
      .from('amiko_meet_session_reputation')
      .upsert({
        session_id: sessionId,
        rater_user_id: user.id,
        rated_user_id,
        overall_rating,
        communication_rating: communication_rating || null,
        respect_rating: respect_rating || null,
        helpfulness_rating: helpfulness_rating || null,
        language_skill_rating: language_skill_rating || null,
        comment: comment || null,
        badges: badges || [],
      } as any, { onConflict: 'session_id,rater_user_id,rated_user_id' })
      .select()
      .single()

    if (insertError) {
      console.error('[Reputation] Insert failed:', insertError.message)
      return NextResponse.json({ error: 'Failed to save rating' }, { status: 500 })
    }

    return NextResponse.json({ success: true, rating }, { status: 201 })
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Invalid request' }, { status: 400 })
  }
}

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  if (!supabaseServer) {
    return NextResponse.json({ error: 'Server not configured' }, { status: 500 })
  }

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

  // Verify participant can view ratings
  const { data: participantCheck } = await supabaseServer
    .from('amiko_meet_participants')
    .select('id')
    .eq('session_id', sessionId)
    .eq('user_id', user.id)
    .single()

  if (!participantCheck) {
    return NextResponse.json({ error: 'Not a participant' }, { status: 403 })
  }

  // Get ratings for this session
  const { data: ratings } = await supabaseServer
    .from('amiko_meet_session_reputation')
    .select('*')
    .eq('session_id', sessionId)
    .order('created_at', { ascending: false })

  // Get user reputation of the current user
  const { data: userReputation } = await supabaseServer
    .from('amiko_meet_user_reputation')
    .select('*')
    .eq('user_id', user.id)
    .single()

  return NextResponse.json({
    success: true,
    ratings: ratings || [],
    my_reputation: userReputation || null,
  })
}
