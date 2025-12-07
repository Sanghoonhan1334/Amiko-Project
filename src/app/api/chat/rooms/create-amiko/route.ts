import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

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
    // 이미 아미코 채팅방이 있는지 확인 (is_active 상태와 관계없이)
    const { data: existingRooms, error: checkError } = await supabaseAdmin
      .from('chat_rooms')
      .select('*')
      .eq('type', 'country')
      .or('name.ilike.%amiko%,name.ilike.%아미코%')
      .limit(1)

    if (checkError) {
      console.error('Error checking existing rooms:', checkError)
    }

    if (existingRooms && existingRooms.length > 0) {
      const existingRoom = existingRooms[0]
      
      // 비활성화된 채팅방이면 다시 활성화
      if (!existingRoom.is_active) {
        const { data: updatedRoom, error: updateError } = await supabaseAdmin
          .from('chat_rooms')
          .update({ is_active: true })
          .eq('id', existingRoom.id)
          .select()
          .single()
        
        if (updateError) {
          console.error('Error reactivating room:', updateError)
        } else {
          return NextResponse.json({
            success: true,
            room: updatedRoom,
            message: 'Amiko chat room reactivated'
          })
        }
      }
      
      return NextResponse.json({
        success: true,
        room: existingRoom,
        message: 'Amiko chat room already exists'
      })
    }

    // 관리자 계정 찾기 (created_by로 사용)
    const { data: adminUser } = await supabaseAdmin
      .from('users')
      .select('id')
      .eq('is_admin', true)
      .limit(1)
      .single()

    // 아미코 채팅방 생성
    const { data: newRoom, error: createError } = await supabaseAdmin
      .from('chat_rooms')
      .insert({
        name: '아미코 채팅방',
        type: 'country',
        country: 'Korea',
        description: 'Amiko Chat - 한국과 남미를 잇는 채팅방',
        is_active: true,
        max_participants: 1000,
        created_by: adminUser?.id || null // 관리자 ID 또는 null
      })
      .select()
      .single()

    if (createError) {
      console.error('Error creating Amiko chat room:', createError)
      return NextResponse.json(
        { success: false, error: createError.message },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      room: newRoom,
      message: 'Amiko chat room created successfully'
    })
  } catch (error) {
    console.error('Error in POST /api/chat/rooms/create-amiko:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to create Amiko chat room' },
      { status: 500 }
    )
  }
}

