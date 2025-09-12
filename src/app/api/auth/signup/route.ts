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

    const { 
      email, 
      password, 
      name, 
      phone, 
      country, 
      isKorean
    } = await request.json()
    
    // IP 주소 가져오기
    const ip = request.headers.get('x-forwarded-for') || 
               request.headers.get('x-real-ip') || 
               '127.0.0.1'

    // 입력 검증
    if (!email || !password || !name || !phone) {
      return NextResponse.json(
        { error: '필수 필드가 누락되었습니다.' },
        { status: 400 }
      )
    }

    // 이메일 중복 체크 (Supabase Auth 레벨에서 확인)
    try {
      const { data: existingUser } = await supabaseServer.auth.admin.getUserByEmail(email)
      if (existingUser.user) {
        return NextResponse.json(
          { error: '이미 등록된 이메일입니다.' },
          { status: 409 }
        )
      }
    } catch (error) {
      // 사용자가 존재하지 않는 경우 정상 진행
      console.log('이메일 중복 체크 통과:', email)
    }

    // 전화번호 중복 체크
    const { data: existingPhone } = await supabaseServer
      .from('users')
      .select('id')
      .eq('phone', phone)
      .single()

    if (existingPhone) {
      return NextResponse.json(
        { error: '이미 등록된 전화번호입니다. 한 번의 계정만 생성할 수 있습니다.' },
        { status: 409 }
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
      email_confirm: true, // 이메일 인증 비활성화 (자동 인증)
      user_metadata: {
        name,
        phone,
        country,
        is_korean: isKorean || false
      }
    })

    if (authError) {
      console.error('[SIGNUP] 사용자 생성 실패:', authError)
      
      if (authError.message.includes('already registered') || authError.code === 'email_exists') {
        return NextResponse.json(
          { error: '이미 등록된 이메일입니다.' },
          { status: 409 }
        )
      }
      
      return NextResponse.json(
        { error: `회원가입에 실패했습니다: ${authError.message}` },
        { status: 500 }
      )
    }

    const userId = authData.user.id

    // Supabase Auth에서 사용자 정보는 자동으로 auth.users 테이블에 저장됨

    // 사용자 프로필 생성 (users 테이블에 직접 저장)
    const { error: profileError } = await supabaseServer
      .from('users')
      .insert({
        id: userId,
        email: email,
        full_name: name,
        phone: phone,
        language: 'ko',
        is_admin: false
      })

    if (profileError) {
      console.error('[SIGNUP] 프로필 생성 실패:', profileError)
      // 프로필 생성 실패해도 사용자는 생성됨
    }

    // 포인트 시스템은 나중에 구현

    return NextResponse.json({
      success: true,
      user: {
        id: userId,
        email,
        name,
        phone,
        country,
        is_korean: isKorean || false
      },
      message: '회원가입이 완료되었습니다. 바로 로그인하실 수 있습니다.'
    }, { status: 201 })

  } catch (error) {
    console.error('[SIGNUP] 오류:', error)
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}
