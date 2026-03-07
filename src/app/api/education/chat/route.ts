import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { requireEducationAuth } from '@/lib/education-auth'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// POST /api/education/chat - Send a chat message in a live class
export async function POST(request: NextRequest) {
  try {
    const auth = await requireEducationAuth(request)
    if (auth.error) return auth.error
    const user_id = auth.user.id

    const { session_id, message, message_type } = await request.json()

    if (!session_id || !message) {
      return NextResponse.json({ error: 'session_id and message required' }, { status: 400 })
    }

    // Get user profile for name/avatar
    const { data: profile } = await supabase
      .from('profiles')
      .select('username, full_name, avatar_url')
      .eq('id', user_id)
      .single()

    const { data, error } = await supabase
      .from('education_chat_messages')
      .insert({
        session_id,
        user_id,
        message,
        message_type: message_type || 'text'
      })
      .select()
      .single()

    if (error) {
      console.error('[Education] chat POST error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({
      chat_message: {
        ...data,
        user_name: profile?.full_name || profile?.username || 'User',
        user_avatar: profile?.avatar_url
      }
    }, { status: 201 })
  } catch (err) {
    console.error('[Education] chat error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// GET /api/education/chat?sessionId=xxx&after=timestamp - Get chat messages
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const sessionId = searchParams.get('sessionId')
    const after = searchParams.get('after') // ISO timestamp for polling

    if (!sessionId) {
      return NextResponse.json({ error: 'sessionId required' }, { status: 400 })
    }

    let query = supabase
      .from('education_chat_messages')
      .select('*')
      .eq('session_id', sessionId)
      .order('created_at', { ascending: true })

    if (after) {
      query = query.gt('created_at', after)
    }

    // Limit to last 200 messages if no after filter
    if (!after) {
      query = query.limit(200)
    }

    const { data, error } = await query

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Get user profiles for messages
    const userIds = [...new Set((data || []).map(m => m.user_id))]
    let profiles: Record<string, { username: string; full_name: string | null; avatar_url: string | null }> = {}

    if (userIds.length > 0) {
      const { data: profilesData } = await supabase
        .from('profiles')
        .select('id, username, full_name, avatar_url')
        .in('id', userIds)

      if (profilesData) {
        profiles = Object.fromEntries(
          profilesData.map(p => [p.id, { username: p.username, full_name: p.full_name, avatar_url: p.avatar_url }])
        )
      }
    }

    const messages = (data || []).map(m => ({
      ...m,
      user_name: profiles[m.user_id]?.full_name || profiles[m.user_id]?.username || 'User',
      user_avatar: profiles[m.user_id]?.avatar_url
    }))

    return NextResponse.json({ messages })
  } catch (err) {
    console.error('[Education] chat GET error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
