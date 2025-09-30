import { NextRequest, NextResponse } from 'next/server'
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

    // 임시로 로그인 성공 처리 (테스트용)
    const mockUserId = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    
    console.log('\n' + '='.repeat(60))
    console.log('🔐 로그인 처리 (개발 환경)')
    console.log('='.repeat(60))
    console.log(`로그인 ID: ${identifier}`)
    console.log(`비밀번호: ${password}`)
    console.log(`사용자 ID: ${mockUserId}`)
    console.log('='.repeat(60) + '\n')

    return NextResponse.json({
      success: true,
      message: '로그인이 완료되었습니다.',
      data: {
        user: {
          id: mockUserId,
          email: identifier.includes('@') ? identifier : 'test@example.com',
          name: '테스트 사용자',
          phone: identifier.includes('@') ? '010-1234-5678' : identifier,
          country: 'KR',
          isKorean: true,
          emailVerified: true,
          phoneVerified: false,
          biometricEnabled: false
        },
        session: {
          access_token: `mock_token_${Date.now()}`,
          refresh_token: `mock_refresh_${Date.now()}`,
          expires_at: Date.now() + (24 * 60 * 60 * 1000) // 24시간
        }
      }
    })

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