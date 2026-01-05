import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

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

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { roomId, userId, lastReadAt } = body

    if (!roomId || !userId) {
      return NextResponse.json(
        { success: false, error: 'Room ID and User ID required' },
        { status: 400 }
      )
    }

    // lastReadAt이 제공되지 않으면 가장 최근 메시지의 시간 사용
    let finalLastReadAt = lastReadAt
    if (!finalLastReadAt) {
      const { data: latestMessage } = await supabaseAdmin
        .from('chat_messages')
        .select('created_at')
        .eq('room_id', roomId)
        .order('created_at', { ascending: false })
        .limit(1)
        .single()

      if (latestMessage) {
        finalLastReadAt = latestMessage.created_at
      } else {
        finalLastReadAt = new Date().toISOString()
      }
    }

    // 읽음 상태 업데이트
    const { error } = await supabaseAdmin
      .from('chat_room_participants')
      .upsert({
        room_id: roomId,
        user_id: userId,
        last_read_at: finalLastReadAt
      })

    if (error) {
      console.error('[UPDATE_READ_STATUS] 업데이트 실패:', error)
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      lastReadAt: finalLastReadAt
    })
  } catch (error) {
    console.error('Error in POST /api/chat/update-read-status:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to update read status' },
      { status: 500 }
    )
  }
}

