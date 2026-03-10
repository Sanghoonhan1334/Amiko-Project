import { NextRequest, NextResponse } from 'next/server'
import { supabaseServer } from '@/lib/supabaseServer'
import { moderateContent } from '@/lib/meet-moderation'

/**
 * POST /api/meet/sessions/[id]/moderation/report
 *
 * Create a manual moderation report for a session.
 * Authenticated users who are session participants can report.
 */
export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  if (!supabaseServer) {
    return NextResponse.json({ error: 'Server not configured' }, { status: 500 })
  }

  // Auth
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
    .select('id, user_id')
    .eq('session_id', sessionId)
    .eq('user_id', user.id)
    .in('status', ['enrolled', 'joined'])
    .single()

  if (!participant) {
    return NextResponse.json({ error: 'Not a participant in this session' }, { status: 403 })
  }

  try {
    const body = await request.json()
    const {
      reported_user_id,
      reported_user_name,
      reason,
      description,
      evidence_caption_ids,
      evidence_screenshot_url,
    } = body

    // Validate reason
    const validReasons = ['harassment', 'insults', 'spam', 'offensive_content', 'other']
    if (!reason || !validReasons.includes(reason)) {
      return NextResponse.json(
        { error: `reason is required and must be one of: ${validReasons.join(', ')}` },
        { status: 400 }
      )
    }

    // Cannot report yourself
    if (reported_user_id === user.id) {
      return NextResponse.json({ error: 'Cannot report yourself' }, { status: 400 })
    }

    // Get reporter name
    const { data: profile } = await supabaseServer
      .from('users')
      .select('display_name, username')
      .eq('id', user.id)
      .single()

    const reporterName = (profile as any)?.display_name || (profile as any)?.username || user.email || 'Unknown'

    // Determine severity based on reason
    const severityMap: Record<string, string> = {
      harassment: 'high_risk',
      insults: 'warning',
      spam: 'informative',
      offensive_content: 'warning',
      other: 'informative',
    }

    const { data: report, error: insertError } = await supabaseServer
      .from('amiko_meet_moderation_reports')
      .insert({
        session_id: sessionId,
        reporter_user_id: user.id,
        reporter_name: reporterName,
        reported_user_id: reported_user_id || null,
        reported_user_name: reported_user_name || null,
        reason,
        description: description || null,
        evidence_caption_ids: evidence_caption_ids || [],
        evidence_screenshot_url: evidence_screenshot_url || null,
        severity: severityMap[reason] || 'informative',
        status: 'pending',
      } as any)
      .select()
      .single()

    if (insertError) {
      console.error('[Moderation] Report insert failed:', insertError.message)
      return NextResponse.json({ error: 'Failed to create report' }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      report: {
        id: (report as any).id,
        status: 'pending',
        severity: (report as any).severity,
      },
    }, { status: 201 })
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Invalid request body' }, { status: 400 })
  }
}
