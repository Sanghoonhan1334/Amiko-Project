import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// GET: Get session detail
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = createClient()

    const { data, error } = await supabase
      .from('vc_sessions')
      .select(`
        *,
        host:vc_host_profiles!vc_sessions_host_id_fkey (
          id, user_id, display_name, country, languages, cultural_interests,
          bio, avatar_url, avg_rating, total_sessions, total_reviews, status
        ),
        bookings:vc_bookings (
          id, user_id, payment_status, status, created_at
        ),
        ratings:vc_ratings (
          id, user_id, knowledge_rating, clarity_rating, friendliness_rating,
          usefulness_rating, overall_rating, comment, created_at
        )
      `)
      .eq('id', id)
      .single()

    if (error) {
      console.error('[VC_SESSION_DETAIL] Error:', error)
      return NextResponse.json({ error: 'Session not found' }, { status: 404 })
    }

    return NextResponse.json({ session: data })
  } catch (err) {
    console.error('[VC_SESSION_DETAIL] Exception:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// PATCH: Update session (host only)
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = createClient()
    const body = await request.json()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Auth required' }, { status: 401 })

    // Verify ownership
    const { data: session } = await supabase
      .from('vc_sessions')
      .select('*, host:vc_host_profiles!vc_sessions_host_id_fkey(user_id)')
      .eq('id', id)
      .single()

    if (!session || session.host?.user_id !== user.id) {
      return NextResponse.json({ error: 'Not authorized' }, { status: 403 })
    }

    const allowedFields = ['title', 'topic', 'description', 'category', 'language',
      'level', 'scheduled_at', 'price_usd', 'max_participants', 'status', 'tags']
    const updates: Record<string, unknown> = {}
    for (const field of allowedFields) {
      if (body[field] !== undefined) updates[field] = body[field]
    }

    // If cancelling, set cancel fields
    if (body.status === 'cancelled') {
      updates.cancelled_at = new Date().toISOString()
      updates.cancel_reason = body.cancel_reason || ''
    }

    const { data, error } = await supabase
      .from('vc_sessions')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('[VC_SESSION_UPDATE] Error:', error)
      return NextResponse.json({ error: 'Update failed' }, { status: 500 })
    }

    return NextResponse.json({ session: data })
  } catch (err) {
    console.error('[VC_SESSION_UPDATE] Exception:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
