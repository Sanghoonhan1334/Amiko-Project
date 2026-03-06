import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// POST: Join a session (get Agora token)
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Auth required' }, { status: 401 })

    // Get session
    const { data: session, error: sessionError } = await supabase
      .from('vc_sessions')
      .select('*, host:vc_host_profiles!vc_sessions_host_id_fkey(user_id)')
      .eq('id', id)
      .single()

    if (sessionError || !session) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 })
    }

    // Check session is active or about to start (within 15 min)
    const scheduledTime = new Date(session.scheduled_at)
    const now = new Date()
    const minutesUntilStart = (scheduledTime.getTime() - now.getTime()) / (1000 * 60)

    const isHost = session.host?.user_id === user.id

    if (!isHost) {
      // Verify booking
      const { data: booking } = await supabase
        .from('vc_bookings')
        .select('*')
        .eq('session_id', id)
        .eq('user_id', user.id)
        .eq('payment_status', 'paid')
        .single()

      if (!booking) {
        return NextResponse.json({ error: 'No valid booking found' }, { status: 403 })
      }

      // Can join 15 minutes before
      if (minutesUntilStart > 15) {
        return NextResponse.json({
          error: 'Session not yet available',
          available_at: new Date(scheduledTime.getTime() - 15 * 60 * 1000).toISOString()
        }, { status: 425 })
      }

      // Update booking status
      await supabase
        .from('vc_bookings')
        .update({ status: 'joined', joined_at: new Date().toISOString() })
        .eq('id', booking.id)
    }

    // Update session to live if it's time
    if (session.status === 'scheduled' && minutesUntilStart <= 0) {
      await supabase
        .from('vc_sessions')
        .update({ status: 'live', started_at: new Date().toISOString() })
        .eq('id', id)
    }

    // Generate Agora token
    const appId = process.env.AGORA_APP_ID
    const appCertificate = process.env.AGORA_APP_CERTIFICATE

    if (!appId || !appCertificate) {
      return NextResponse.json({ error: 'Video service not configured' }, { status: 500 })
    }

    // Use uid as a numeric hash for Agora
    const uid = Math.abs(user.id.split('').reduce((a, b) => {
      a = ((a << 5) - a) + b.charCodeAt(0); return a & a
    }, 0)) % 100000

    let token = ''
    try {
      const { RtcTokenBuilder, RtcRole } = await import('agora-token')
      const expireTime = Math.floor(Date.now() / 1000) + 3600
      token = RtcTokenBuilder.buildTokenWithUid(
        appId, appCertificate, session.agora_channel, uid, RtcRole.PUBLISHER, expireTime, 0
      )
    } catch (tokenErr) {
      console.error('[VC_JOIN] Token error:', tokenErr)
      return NextResponse.json({ error: 'Failed to generate token' }, { status: 500 })
    }

    return NextResponse.json({
      channel: session.agora_channel,
      token,
      uid,
      appId,
      isHost,
      session: {
        id: session.id,
        title: session.title,
        duration_minutes: session.duration_minutes,
        scheduled_at: session.scheduled_at,
        status: session.status,
      }
    })
  } catch (err) {
    console.error('[VC_JOIN] Exception:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
