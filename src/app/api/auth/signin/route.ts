import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseClient } from '@/lib/supabase'
import { supabaseServer } from '@/lib/supabaseServer'

// 로그인 처리
export async function POST(request: NextRequest) {
  try {
    const { identifier, password } = await request.json()

    // 필수 필드 검증
    if (!identifier || !password) {
      return NextResponse.json(
        { error: '이메일/전화번호와 비밀번호를 입력해주세요.' },
        { status: 400 }
      )
    }

    // Supabase 클라이언트 생성 (쿠키 기반)
    const supabase = await createSupabaseClient()

    // 이메일 또는 전화번호로 로그인 시도
    // identifier가 이메일인지 전화번호인지 확인
    const isEmail = identifier.includes('@')
    
    let authResult
    if (isEmail) {
      // 이메일로 로그인
      authResult = await supabase.auth.signInWithPassword({
        email: identifier,
        password,
      })
    } else {
      // 전화번호로 로그인 (전화번호는 users 테이블에서 조회 필요)
      // 먼저 전화번호로 사용자 찾기
      if (!supabaseServer) {
        return NextResponse.json(
          { error: '데이터베이스 연결이 설정되지 않았습니다.' },
          { status: 500 }
        )
      }

      // 전화번호로 사용자 찾기
      const { data: userData, error: userError } = await supabaseServer
        .from('users')
        .select('email')
        .eq('phone', identifier)
        .single()

      if (userError || !userData?.email) {
        return NextResponse.json(
          { error: '이메일 또는 비밀번호가 올바르지 않습니다.' },
          { status: 401 }
        )
      }

      // 찾은 이메일로 로그인
      authResult = await supabase.auth.signInWithPassword({
        email: userData.email,
        password,
      })
    }

    if (authResult.error) {
      console.error('[SIGNIN] 로그인 실패:', authResult.error)
      return NextResponse.json(
        { error: '이메일 또는 비밀번호가 올바르지 않습니다.' },
        { status: 401 }
      )
    }

    if (!authResult.data.session || !authResult.data.user) {
      return NextResponse.json(
        { error: '로그인에 실패했습니다.' },
        { status: 401 }
      )
    }

    // 사용자 정보 조회
    const { data: userInfo, error: userInfoError } = await supabaseServer!
      .from('users')
      .select('*')
      .eq('id', authResult.data.user.id)
      .single()

    if (userInfoError) {
      console.error('[SIGNIN] 사용자 정보 조회 실패:', userInfoError)
    }

    // 사용자 인증 상태 조회
    const { data: authStatus } = await supabaseServer!
      .from('user_auth_status')
      .select('*')
      .eq('user_id', authResult.data.user.id)
      .single()

    console.log('[SIGNIN] 로그인 성공:', {
      userId: authResult.data.user.id,
      email: authResult.data.user.email
    })

    // 응답 생성
    const response = NextResponse.json({
      success: true,
      message: '로그인이 완료되었습니다.',
      data: {
        user: {
          id: authResult.data.user.id,
          email: authResult.data.user.email,
          name: userInfo?.name || '',
          phone: userInfo?.phone || '',
          country: userInfo?.country || '',
          isKorean: userInfo?.is_korean || false,
          emailVerified: authStatus?.email_verified || false,
          phoneVerified: authStatus?.phone_verified || false,
          biometricEnabled: authStatus?.biometric_enabled || false
        },
        session: {
          access_token: authResult.data.session.access_token,
          refresh_token: authResult.data.session.refresh_token,
          expires_at: authResult.data.session.expires_at
        }
      }
    })

    // 세션 쿠키는 createSupabaseClient가 자동으로 설정함
    return response

  } catch (error) {
    console.error('[SIGNIN] 오류:', error)
    return NextResponse.json(
      { error: '로그인 중 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}

// 로그인 상태 확인
export async function GET(request: NextRequest) {
  try {
    if (!supabaseServer) {
      return NextResponse.json(
        { error: '데이터베이스 연결이 설정되지 않았습니다.' },
        { status: 500 }
      )
    }

    // 세션 확인
    const { data: { session }, error: sessionError } = await supabaseServer.auth.getSession()

    if (sessionError || !session) {
      return NextResponse.json({
        success: false,
        data: { isAuthenticated: false }
      })
    }

    // 사용자 정보 조회
    const { data: user, error: userError } = await supabaseServer
      .from('users')
      .select('*')
      .eq('id', session.user.id)
      .single()

    if (userError || !user) {
      return NextResponse.json(
        { error: '사용자 정보를 찾을 수 없습니다.' },
        { status: 404 }
      )
    }

    // 사용자 인증 상태 조회
    const { data: authStatus, error: statusError } = await supabaseServer
      .from('user_auth_status')
      .select('*')
      .eq('user_id', session.user.id)
      .single()

    return NextResponse.json({
      success: true,
      data: {
        isAuthenticated: true,
        user: {
          id: session.user.id,
          email: session.user.email,
          name: user.name,
          phone: user.phone,
          country: user.country,
          isKorean: user.is_korean,
          emailVerified: authStatus?.email_verified || false,
          phoneVerified: authStatus?.phone_verified || false,
          biometricEnabled: authStatus?.biometric_enabled || false
        },
        session: session
      }
    })

  } catch (error) {
    console.error('[SIGNIN_STATUS] 오류:', error)
    return NextResponse.json(
      { error: '로그인 상태 확인 중 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}