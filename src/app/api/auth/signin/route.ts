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
      
      // 이메일 인증 체크 제거 (개발용)
      // if (authError.message.includes('Email not confirmed')) {
      //   return NextResponse.json(
      //     { error: '계정이 활성화되지 않았습니다. 관리자에게 문의하세요.' },
      //     { status: 401 }
      //   )
      // }
      
      return NextResponse.json(
        { error: '로그인에 실패했습니다.' },
        { status: 500 }
      )
    }

    const user = authData.user
    const session = authData.session

    // 사용자 프로필 정보 가져오기
    const { data: profile, error: profileError } = await supabaseServer
      .from('users')
      .select('*')
      .eq('id', user.id)
      .single()

    if (profileError) {
      console.error('[SIGNIN] 프로필 조회 실패:', profileError)
    }

    // 포인트 정보는 기본값으로 설정 (나중에 포인트 시스템 구현 시 추가)
    const points = {
      total_points: 0,
      level: 1,
      experience_points: 0
    }

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.user_metadata?.name || profile?.full_name,
        country: user.user_metadata?.country,
        is_korean: user.user_metadata?.is_korean || false,
        avatar_url: profile?.avatar_url,
        bio: profile?.one_line_intro,
        language: profile?.language || 'ko',
        phone: profile?.phone,
        points: points.total_points,
        level: points.level,
        experience_points: points.experience_points
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
