import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

// Server-side client with service role key to bypass RLS
const supabaseAdmin = createClient(
  supabaseUrl,
  supabaseServiceKey,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
)

// 일반 클라이언트 (인증 확인용)
const supabase = createClient(supabaseUrl, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: banId } = await params
    const body = await request.json()
    const { userId, roomId } = body

    // Authorization 헤더에서 토큰 추출
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { success: false, error: '인증이 필요합니다.' },
        { status: 401 }
      )
    }

    const token = authHeader.replace('Bearer ', '')
    
    // 토큰으로 사용자 정보 가져오기
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)
    
    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: '유효하지 않은 인증입니다.' },
        { status: 401 }
      )
    }

    // 운영자 권한 확인
    const params_check = new URLSearchParams()
    if (user.id) params_check.append('userId', user.id)
    if (user.email) params_check.append('email', user.email)
    
    const checkResponse = await fetch(`${request.nextUrl.origin}/api/admin/check?${params_check.toString()}`)
    const checkData = await checkResponse.json()
    
    if (!checkData.isAdmin) {
      // users 테이블의 is_admin도 확인
      const { data: userData } = await supabaseAdmin
        .from('users')
        .select('is_admin')
        .eq('id', user.id)
        .single()

      if (!userData?.is_admin) {
        return NextResponse.json(
          { success: false, error: '운영자 권한이 필요합니다.' },
          { status: 403 }
        )
      }
    }

    // 채팅금지 기록 삭제
    const { error: deleteError } = await supabaseAdmin
      .from('chat_bans')
      .delete()
      .eq('id', banId)

    if (deleteError) {
      console.error('[CHAT_BANS] 삭제 오류:', deleteError)
      return NextResponse.json(
        { success: false, error: '채팅금지 해제에 실패했습니다.' },
        { status: 500 }
      )
    }

    // 참여자 목록에 다시 추가 (없는 경우에만)
    if (roomId && userId) {
      const { data: existingParticipant } = await supabaseAdmin
        .from('chat_room_participants')
        .select('user_id')
        .eq('room_id', roomId)
        .eq('user_id', userId)
        .single()

      if (!existingParticipant) {
        await supabaseAdmin
          .from('chat_room_participants')
          .insert({
            room_id: roomId,
            user_id: userId,
            last_read_at: new Date().toISOString()
          })
      }
    }

    return NextResponse.json({
      success: true,
      message: '채팅금지가 해제되었습니다.'
    })

  } catch (error) {
    console.error('[CHAT_BANS] 오류:', error)
    return NextResponse.json(
      { success: false, error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}

