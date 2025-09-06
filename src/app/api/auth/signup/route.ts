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

    const { email, password, name, phone, country, isKorean } = await request.json()

    // 입력 검증
    if (!email || !password || !name) {
      return NextResponse.json(
        { error: '필수 필드가 누락되었습니다.' },
        { status: 400 }
      )
    }

    // 이메일 형식 검증
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: '올바른 이메일 형식이 아닙니다.' },
        { status: 400 }
      )
    }

    // 비밀번호 강도 검증
    if (password.length < 6) {
      return NextResponse.json(
        { error: '비밀번호는 최소 6자 이상이어야 합니다.' },
        { status: 400 }
      )
    }

    // Supabase Auth로 사용자 생성
    const { data: authData, error: authError } = await supabaseServer.auth.admin.createUser({
      email,
      password,
      email_confirm: false, // 이메일 인증 필요
      user_metadata: {
        name,
        phone,
        country,
        is_korean: isKorean || false
      }
    })

    if (authError) {
      console.error('[SIGNUP] 사용자 생성 실패:', authError)
      
      if (authError.message.includes('already registered')) {
        return NextResponse.json(
          { error: '이미 등록된 이메일입니다.' },
          { status: 409 }
        )
      }
      
      return NextResponse.json(
        { error: '회원가입에 실패했습니다.' },
        { status: 500 }
      )
    }

    const userId = authData.user.id

    // Supabase Auth에서 사용자 정보는 자동으로 auth.users 테이블에 저장됨

    // 사용자 프로필 생성
    const { error: profileError } = await (supabaseServer as any)
      .from('user_profiles')
      .insert({
        user_id: userId,
        display_name: name,
        country: country || 'KR',
        native_language: isKorean ? 'ko' : 'es',
        is_korean: isKorean || false
      })

    if (profileError) {
      console.error('[SIGNUP] 프로필 생성 실패:', profileError)
      // 프로필 생성 실패해도 사용자는 생성됨
    }

    // 포인트 시스템 초기화
    const { error: pointsError } = await (supabaseServer as any)
      .from('user_points')
      .insert({
        user_id: userId,
        total_points: 0,
        daily_points: 0,
        last_reset_date: new Date().toISOString().split('T')[0]
      })

    if (pointsError) {
      console.error('[SIGNUP] 포인트 초기화 실패:', pointsError)
    }

    return NextResponse.json({
      success: true,
      user: {
        id: userId,
        email,
        name,
        country,
        is_korean: isKorean || false
      },
      message: '회원가입이 완료되었습니다. 이메일 인증을 진행해주세요.'
    }, { status: 201 })

  } catch (error) {
    console.error('[SIGNUP] 오류:', error)
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}
