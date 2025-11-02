import { NextRequest, NextResponse } from 'next/server'
import { supabaseServer } from '@/lib/supabaseServer'

// 사용자 정보 조회
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    if (!supabaseServer) {
      return NextResponse.json(
        { error: 'Database connection not available' },
        { status: 500 }
      )
    }

    const userId = params.id
    console.log('[USER_GET] 사용자 조회 시작:', userId)

    // 1. user_profiles 테이블에서 display_name 확인 (닉네임 우선)
    const { data: profile, error: profileError } = await supabaseServer
      .from('user_profiles')
      .select('display_name, avatar_url')
      .eq('user_id', userId)
      .single()
    
    console.log('[USER_GET] user_profiles 조회:', { profile, error: profileError?.message })

    // 2. users 테이블에서 사용자 정보 조회
    const { data: user, error } = await supabaseServer
      .from('users')
      .select('id, full_name, nickname, avatar_url, profile_image')
      .eq('id', userId)
      .single()

    console.log('[USER_GET] users 조회:', { 
      id: user?.id, 
      full_name: user?.full_name, 
      nickname: user?.nickname,
      error: error?.message 
    })

    if (error || !user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // 3. 닉네임 우선순위: display_name > nickname > full_name
    let displayName = user.full_name
    if (profile?.display_name && profile.display_name.trim() !== '') {
      // display_name에서 # 이후 제거
      displayName = profile.display_name.includes('#') 
        ? profile.display_name.split('#')[0] 
        : profile.display_name
    } else if (user.nickname && user.nickname.trim() !== '') {
      displayName = user.nickname
    }

    console.log('[USER_GET] 최종 표시 이름:', displayName)

    return NextResponse.json({
      success: true,
      user: {
        ...user,
        nickname: displayName, // 최종 닉네임을 반환
        display_name: displayName
      }
    })

  } catch (error) {
    console.error('Error fetching user:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

