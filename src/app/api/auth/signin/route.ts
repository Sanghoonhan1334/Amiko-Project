import { NextRequest, NextResponse } from 'next/server'
import { supabaseServer } from '@/lib/supabaseServer'

export async function POST(request: NextRequest) {
  try {
    if (!supabaseServer) {
      return NextResponse.json(
        { error: '데이터베이스 연결이 설정되지 않았습니다.' },
        { status: 500 }
      )
    }

    const { email, password } = await request.json()

    // 입력 검증
    if (!email || !password) {
      return NextResponse.json(
        { error: '이메일과 비밀번호를 입력해주세요.' },
        { status: 400 }
      )
    }

    // Supabase Auth로 로그인
    const { data: authData, error: authError } = await supabaseServer.auth.signInWithPassword({
      email,
      password
    })

    if (authError) {
      console.error('[SIGNIN] 로그인 실패:', authError)
      
      if (authError.message.includes('Invalid login credentials')) {
        return NextResponse.json(
          { error: '이메일 또는 비밀번호가 올바르지 않습니다.' },
          { status: 401 }
        )
      }
      
      if (authError.message.includes('Email not confirmed')) {
        return NextResponse.json(
          { error: '이메일 인증이 필요합니다.' },
          { status: 401 }
        )
      }
      
      return NextResponse.json(
        { error: '로그인에 실패했습니다.' },
        { status: 500 }
      )
    }

    const user = authData.user
    const session = authData.session

    // 사용자 프로필 정보 가져오기
    const { data: profile, error: profileError } = await supabaseServer
      .from('user_profiles')
      .select('*')
      .eq('user_id', user.id)
      .single()

    if (profileError) {
      console.error('[SIGNIN] 프로필 조회 실패:', profileError)
    }

    // 포인트 정보 가져오기
    const { data: points, error: pointsError } = await supabaseServer
      .from('user_points')
      .select('*')
      .eq('user_id', user.id)
      .single()

    if (pointsError) {
      console.error('[SIGNIN] 포인트 조회 실패:', pointsError)
    }

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.user_metadata?.name || (profile as any)?.display_name,
        country: user.user_metadata?.country || (profile as any)?.country,
        is_korean: user.user_metadata?.is_korean || (profile as any)?.is_korean,
        avatar_url: (profile as any)?.avatar_url,
        bio: (profile as any)?.bio,
        native_language: (profile as any)?.native_language,
        kakao_linked_at: (profile as any)?.kakao_linked_at,
        wa_verified_at: (profile as any)?.wa_verified_at,
        sms_verified_at: (profile as any)?.sms_verified_at,
        email_verified_at: (profile as any)?.email_verified_at,
        points: (points as any)?.total_points || 0,
        daily_points: (points as any)?.daily_points || 0
      },
      session: {
        access_token: session.access_token,
        refresh_token: session.refresh_token,
        expires_at: session.expires_at
      }
    })

  } catch (error) {
    console.error('[SIGNIN] 오류:', error)
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}
