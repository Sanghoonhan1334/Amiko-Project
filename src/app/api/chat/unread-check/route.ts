import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

// Server-side client with service role key to bypass RLS
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
)

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const roomId = searchParams.get('roomId')
    const userId = searchParams.get('userId')

    if (!roomId || !userId) {
      return NextResponse.json(
        { success: false, error: 'Room ID and User ID required' },
        { status: 400 }
      )
    }

    // 사용자의 last_read_at 가져오기
    const { data: participant, error: participantError } = await supabaseAdmin
      .from('chat_room_participants')
      .select('last_read_at')
      .eq('room_id', roomId)
      .eq('user_id', userId)
      .single()

    if (participantError || !participant) {
      // 참가자 정보가 없으면 읽지 않은 메시지가 있다고 간주
      return NextResponse.json({
        success: true,
        hasUnread: true
      })
    }

    const lastReadAt = participant.last_read_at

    // last_read_at이 없으면 읽지 않은 메시지가 있다고 간주
    if (!lastReadAt) {
      return NextResponse.json({
        success: true,
        hasUnread: true
      })
    }

    // last_read_at 이후의 메시지가 있는지 확인 (현재 시간보다 미래인 메시지는 제외)
    const now = new Date().toISOString()
    const { data: unreadMessages, error: messagesError } = await supabaseAdmin
      .from('chat_messages')
      .select('id')
      .eq('room_id', roomId)
      .gt('created_at', lastReadAt)
      .lte('created_at', now) // 현재 시간보다 미래인 메시지는 제외
      .limit(1)

    if (messagesError) {
      console.error('[UNREAD_CHECK] 메시지 조회 실패:', messagesError)
      return NextResponse.json(
        { success: false, error: messagesError.message },
        { status: 500 }
      )
    }

    const hasUnread = unreadMessages && unreadMessages.length > 0

    return NextResponse.json({
      success: true,
      hasUnread
    })
  } catch (error) {
    console.error('Error in GET /api/chat/unread-check:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to check unread messages' },
      { status: 500 }
    )
  }
}

