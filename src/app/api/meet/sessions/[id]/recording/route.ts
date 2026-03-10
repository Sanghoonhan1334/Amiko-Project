import { NextRequest, NextResponse } from 'next/server'
import { supabaseServer } from '@/lib/supabaseServer'

/**
 * POST /api/meet/sessions/[id]/recording/start — Request recording start
 * GET  /api/meet/sessions/[id]/recording — Get recording status
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
    .in('status', ['enrolled', 'joined'])
    .single()

  if (!participant) {
    return NextResponse.json({ error: 'Not a participant' }, { status: 403 })
  }

  try {
    const body = await request.json().catch(() => ({}))
    const action = (body as any).action || 'start'

    if (action === 'start') {
      // Check if already recording
      const { data: existing } = await supabaseServer
        .from('amiko_meet_recordings')
        .select('id, status')
        .eq('session_id', sessionId)
        .in('status', ['pending', 'recording'])
        .single()

      if (existing) {
        return NextResponse.json({
          success: true,
          recording: existing,
          message: 'Recording already in progress',
        })
      }

      // Create recording request
      const { data: recording, error: insertError } = await supabaseServer
        .from('amiko_meet_recordings')
        .insert({
          session_id: sessionId,
          initiated_by: user.id,
          consent_status: 'pending',
          status: 'pending',
        } as any)
        .select()
        .single()

      if (insertError) {
        return NextResponse.json({ error: 'Failed to start recording' }, { status: 500 })
      }

      // Get all participants for consent
      const { data: participants } = await supabaseServer
        .from('amiko_meet_participants')
        .select('user_id')
        .eq('session_id', sessionId)
        .in('status', ['enrolled', 'joined'])

      // Create consent entries
      if (participants && participants.length > 0) {
        const consents = (participants as any[]).map(p => ({
          recording_id: (recording as any).id,
          user_id: p.user_id,
          consented: p.user_id === user.id, // initiator auto-consents
        }))

        await supabaseServer
          .from('amiko_meet_recording_consents')
          .insert(consents as any)
      }

      return NextResponse.json({
        success: true,
        recording,
        message: 'Recording requested. Waiting for consent from all participants.',
      }, { status: 201 })

    } else if (action === 'stop') {
      const { data: recording, error: updateError } = await (supabaseServer
        .from('amiko_meet_recordings') as any)
        .update({
          status: 'processing',
          recording_ended_at: new Date().toISOString(),
        })
        .eq('session_id', sessionId)
        .eq('status', 'recording')
        .select()
        .single()

      if (updateError) {
        return NextResponse.json({ error: 'No active recording to stop' }, { status: 404 })
      }

      return NextResponse.json({ success: true, recording })

    } else if (action === 'consent') {
      const consent = (body as any).consent !== false

      // Find pending recording
      const { data: recording } = await supabaseServer
        .from('amiko_meet_recordings')
        .select('id')
        .eq('session_id', sessionId)
        .eq('consent_status', 'pending')
        .single()

      if (!recording) {
        return NextResponse.json({ error: 'No pending recording request' }, { status: 404 })
      }

      // Update consent
      await supabaseServer
        .from('amiko_meet_recording_consents')
        .upsert({
          recording_id: (recording as any).id,
          user_id: user.id,
          consented: consent,
          responded_at: new Date().toISOString(),
        } as any, { onConflict: 'recording_id,user_id' })

      // Check if all consented
      const { data: allConsents } = await supabaseServer
        .from('amiko_meet_recording_consents')
        .select('consented')
        .eq('recording_id', (recording as any).id)

      const consentList = (allConsents || []) as any[]
      const allConsented = consentList.every(c => c.consented)
      const anyDeclined = consentList.some(c => c.consented === false)

      let consentStatus: string
      if (anyDeclined) {
        consentStatus = 'declined'
      } else if (allConsented && consentList.length > 0) {
        consentStatus = 'all_consented'
      } else {
        consentStatus = 'partial'
      }

      const updates: Record<string, any> = { consent_status: consentStatus }
      if (consentStatus === 'all_consented') {
        updates.status = 'recording'
        updates.recording_started_at = new Date().toISOString()
      } else if (consentStatus === 'declined') {
        updates.status = 'failed'
      }

      await (supabaseServer
        .from('amiko_meet_recordings') as any)
        .update(updates)
        .eq('id', (recording as any).id)

      return NextResponse.json({
        success: true,
        consent_status: consentStatus,
        recording_started: consentStatus === 'all_consented',
      })
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
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

  // Verify participant can view recordings
  const { data: participantCheck } = await supabaseServer
    .from('amiko_meet_participants')
    .select('id')
    .eq('session_id', sessionId)
    .eq('user_id', user.id)
    .single()

  if (!participantCheck) {
    return NextResponse.json({ error: 'Not a participant' }, { status: 403 })
  }

  const { data: recordings } = await supabaseServer
    .from('amiko_meet_recordings')
    .select('*')
    .eq('session_id', sessionId)
    .order('created_at', { ascending: false })

  return NextResponse.json({
    success: true,
    recordings: recordings || [],
  })
}
