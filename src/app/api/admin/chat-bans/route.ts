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

export async function GET(request: NextRequest) {
  try {
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
    const params = new URLSearchParams()
    if (user.id) params.append('userId', user.id)
    if (user.email) params.append('email', user.email)
    
    const checkResponse = await fetch(`${request.nextUrl.origin}/api/admin/check?${params.toString()}`)
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

    // 운영자 권한 확인됨 - 모든 채팅금지 목록 조회
    const { data: bans, error: bansError } = await supabaseAdmin
      .from('chat_bans')
      .select(`
        id,
        room_id,
        user_id,
        banned_by,
        reason,
        ban_type,
        expires_at,
        created_at
      `)
      .order('created_at', { ascending: false })

    if (bansError) {
      console.error('[CHAT_BANS] 조회 오류:', bansError)
      return NextResponse.json(
        { success: false, error: '채팅금지 목록 조회에 실패했습니다.' },
        { status: 500 }
      )
    }

    // 사용자 정보 조회 (users 테이블)
    const userIds = [...new Set(bans?.map(ban => ban.user_id) || [])]
    const { data: users } = await supabaseAdmin
      .from('users')
      .select('id, email, full_name, korean_name, spanish_name')
      .in('id', userIds)

    // 사용자 프로필 정보 조회 (user_profiles 테이블)
    const { data: userProfiles } = await supabaseAdmin
      .from('user_profiles')
      .select('user_id, display_name')
      .in('user_id', userIds)

    // 채팅방 정보 조회
    const roomIds = [...new Set(bans?.map(ban => ban.room_id) || [])]
    const { data: rooms, error: roomsError } = await supabaseAdmin
      .from('chat_rooms')
      .select('id, name, type')
      .in('id', roomIds)

    if (roomsError) {
      console.error('[CHAT_BANS] 채팅방 조회 오류:', roomsError)
    }

    // 데이터 결합
    const bansWithDetails = bans?.map(ban => {
      const user = users?.find(u => u.id === ban.user_id)
      const userProfile = userProfiles?.find(up => up.user_id === ban.user_id)
      const room = rooms?.find(r => r.id === ban.room_id)

      // 사용자 이름 결정 (우선순위: display_name > korean_name > spanish_name > full_name > email > Unknown)
      let displayName = 'Unknown'
      if (userProfile?.display_name && userProfile.display_name.trim() !== '') {
        // # 이후 부분 제거 (예: "parkg9832#c017" → "parkg9832")
        displayName = userProfile.display_name.includes('#') 
          ? userProfile.display_name.split('#')[0] 
          : userProfile.display_name
      } else if (user) {
        displayName = user.korean_name || user.spanish_name || user.full_name || user.email?.split('@')[0] || 'Unknown'
      }

      // 채팅방 이름 결정
      let roomName = ban.room_id
      if (room?.name && room.name.trim() !== '') {
        roomName = room.name
      } else if (room?.type === 'country') {
        // 전체 채팅방인 경우 기본 이름 사용
        roomName = '아미코 채팅방'
      }

      return {
        ...ban,
        users: user ? {
          ...user,
          display_name: displayName
        } : {
          id: ban.user_id,
          email: null,
          full_name: null,
          korean_name: null,
          spanish_name: null,
          display_name: displayName
        },
        rooms: room ? {
          ...room,
          name: roomName
        } : {
          id: ban.room_id,
          name: roomName,
          type: null
        }
      }
    }) || []

    return NextResponse.json({
      success: true,
      bans: bansWithDetails
    })

  } catch (error) {
    console.error('[CHAT_BANS] 오류:', error)
    return NextResponse.json(
      { success: false, error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}

