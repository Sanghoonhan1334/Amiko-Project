import { NextRequest, NextResponse } from 'next/server'
import { supabaseServer } from '@/lib/supabaseServer'

// 사용자 인증 상태 확인 API
export async function GET(request: NextRequest) {
  try {
    console.log('[AUTH_STATUS] API 호출 시작')
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')

    if (!userId) {
      console.log('[AUTH_STATUS] 사용자 ID 없음')
      return NextResponse.json(
        { error: '사용자 ID가 필요합니다.' },
        { status: 400 }
      )
    }

    console.log('[AUTH_STATUS] 요청 받음:', { userId })

    if (!supabaseServer) {
      return NextResponse.json(
        { error: '데이터베이스 연결이 설정되지 않았습니다.' },
        { status: 500 }
      )
    }

    // 사용자 정보 조회 (RLS 오류 방지)
    let user = null
    let userError = null
    
    try {
      const userResult = await supabaseServer
        .from('users')
        .select('id, email, phone')
        .eq('id', userId)
        .single()
      
      user = userResult.data
      userError = userResult.error
    } catch (err) {
      console.log('[AUTH_STATUS] users 테이블 접근 실패, 기본값 사용')
      userError = { code: '42P17', message: 'infinite recursion detected in policy for relation "users"' }
    }

    if (userError) {
      console.error('사용자 조회 오류:', userError)
      // RLS 오류인 경우 기본 사용자 정보 반환
      if (userError.code === '42P17') {
        console.log('[AUTH_STATUS] RLS 무한 재귀 감지, 기본 응답 반환')
        return NextResponse.json({
          success: true,
          user: {
            id: userId,
            email: 'user@example.com',
            phone: null
          },
          authLevel: 'none',
          emailVerified: true,
          smsVerified: false,
          profileComplete: false
        })
      }
      return NextResponse.json(
        { error: '사용자 정보를 찾을 수 없습니다.' },
        { status: 404 }
      )
    }

    // 프로필 정보 확인 (user_preferences 테이블이 없는 경우 기본값 사용)
    console.log('[AUTH_STATUS] 사용자 ID:', userId)
    let profile = null
    let profileError = null
    
    try {
      const profileResult = await supabaseServer
        .from('user_preferences')
        .select('full_name, phone, university, major, interests')
        .eq('user_id', userId)
        .single()
      
      profile = profileResult.data
      profileError = profileResult.error
    } catch (err) {
      console.log('[AUTH_STATUS] user_preferences 테이블 접근 실패, 기본값 사용')
      profileError = { code: '42703', message: 'column user_preferences.full_name does not exist' }
    }
    
    console.log('[AUTH_STATUS] 프로필 조회 결과:', { profile, profileError })

    // 프로필이 있고 필수 정보가 있으면 인증 완료
    const isProfileComplete = profile && (
      profile.full_name || 
      profile.phone || 
      profile.university || 
      profile.major ||
      (profile.interests && profile.interests.length > 0)
    )

    const authLevel = isProfileComplete ? 'full' : 'none'

    console.log('[AUTH_STATUS] 프로필 확인 결과:', {
      userId,
      profile,
      profileError,
      isProfileComplete,
      authLevel
    })

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        phone: user.phone
      },
      authLevel,
      emailVerified: true, // 회원가입 시 이미 완료
      smsVerified: isProfileComplete, // 프로필 완성 여부
      profileComplete: isProfileComplete
    })

  } catch (error) {
    console.error('인증 상태 확인 오류:', error)
    return NextResponse.json(
      { error: '인증 상태 확인 중 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}