import { NextRequest, NextResponse } from 'next/server'
import { supabaseServer } from '@/lib/supabaseServer'

// 인증 정보 제출
export async function POST(request: NextRequest) {
  try {
    if (!supabaseServer) {
      return NextResponse.json(
        { error: '데이터베이스 연결이 설정되지 않았습니다.' },
        { status: 500 }
      )
    }

    const body = await request.json()
    const {
      full_name,
      phone,
      university,
      major,
      grade,
      occupation,
      company,
      work_experience,
      one_line_intro,
      interests,
      custom_interests,
      matching_preferences,
      language,
      korean_level,
      english_level,
      spanish_level,
      is_korean,
      user_type,
      email,
      profile_image
    } = body

    // Authorization 헤더에서 사용자 ID 추출
    const authHeader = request.headers.get('Authorization')
    if (!authHeader) {
      return NextResponse.json(
        { error: '인증이 필요합니다.' },
        { status: 401 }
      )
    }

    const userId = authHeader.replace('Bearer ', '')

    // 사용자 기본 정보 업데이트 또는 생성
    const userData: any = {
      id: userId,
      email: email || '', 
      full_name,
      phone,
      one_line_intro,
      language,
      updated_at: new Date().toISOString()
    }

    // is_korean 필드 추가
    if (is_korean !== undefined && is_korean !== null) {
      userData.is_korean = is_korean
    }

    // 프로필 사진 추가
    if (profile_image) {
      userData.profile_image = profile_image
    }

    const { data: user, error: userError } = await supabaseServer
      .from('users')
      .upsert(userData)
      .select()
      .single()

    if (userError) {
      console.error('[VERIFICATION] 사용자 업데이트 실패:', userError)
      
      // auth.users에서 이메일 가져오기
      const { data: authUser } = await supabaseServer.auth.admin.getUserById(userId)
      
      // 다시 시도 (이메일 포함)
      const retryUserData: any = {
        id: userId,
        email: authUser?.user?.email || '',
        full_name,
        phone,
        one_line_intro,
        language,
        updated_at: new Date().toISOString()
      }

      // is_korean 필드 추가
      if (is_korean !== undefined && is_korean !== null) {
        retryUserData.is_korean = is_korean
      }

      // 프로필 사진 추가
      if (profile_image) {
        retryUserData.profile_image = profile_image
      }

      const { data: userRetry, error: userRetryError } = await supabaseServer
        .from('users')
        .upsert(retryUserData)
        .select()
        .single()

      if (userRetryError) {
        console.error('[VERIFICATION] 사용자 생성 재시도 실패:', userRetryError)
        console.error('[VERIFICATION] 재시도 데이터:', retryUserData)
        return NextResponse.json(
          { error: `사용자 정보 저장에 실패했습니다: ${userRetryError.message}` },
          { status: 500 }
        )
      }
    }

    // 사용자 선호도 정보 저장 (테이블이 없을 수 있으므로 try-catch 사용)
    let preferences = null
    try {
      const { data: preferencesData, error: preferencesError } = await supabaseServer
        .from('user_preferences' as any)
        .upsert({
          user_id: userId,
          matching_preferences,
          interests,
          custom_interests,
          korean_level,
          english_level,
          spanish_level,
          is_korean,
          user_type,
          updated_at: new Date().toISOString()
        } as any)
        .select()
        .single()

      if (preferencesError) {
        console.error('[VERIFICATION] 사용자 선호도 저장 실패:', preferencesError)
        console.log('사용자 선호도는 나중에 테이블 생성 후 저장됩니다.')
      } else {
        preferences = preferencesData
      }
    } catch (error) {
      console.error('[VERIFICATION] user_preferences 테이블 접근 실패:', error)
      console.log('user_preferences 테이블이 아직 생성되지 않았습니다.')
    }

    // 사용자 상세 정보 저장 (대학생/일반인 구분)
    let userDetails = null
    if (user_type === 'student') {
      try {
        const { data: studentInfo, error: studentError } = await supabaseServer
          .from('user_student_info' as any)
          .upsert({
            user_id: userId,
            university,
            major,
            grade,
            updated_at: new Date().toISOString()
          } as any)
          .select()
          .single()
        
        if (studentError) {
          console.log('학생 정보는 나중에 테이블 생성 후 저장됩니다.')
        } else {
          userDetails = studentInfo
        }
      } catch (error) {
        console.error('[VERIFICATION] user_student_info 테이블 접근 실패:', error)
        console.log('user_student_info 테이블이 아직 생성되지 않았습니다.')
      }
    } else {
      try {
        const { data: generalInfo, error: generalError } = await supabaseServer
          .from('user_general_info' as any)
          .upsert({
            user_id: userId,
            occupation,
            company,
            work_experience,
            updated_at: new Date().toISOString()
          } as any)
          .select()
          .single()
        
        if (generalError) {
          console.log('일반인 정보는 나중에 테이블 생성 후 저장됩니다.')
        } else {
          userDetails = generalInfo
        }
      } catch (error) {
        console.error('[VERIFICATION] user_general_info 테이블 접근 실패:', error)
        console.log('user_general_info 테이블이 아직 생성되지 않았습니다.')
      }
    }

    return NextResponse.json({
      success: true,
      message: '인증 정보가 성공적으로 제출되었습니다.',
      user,
      preferences,
      userDetails
    })

  } catch (error) {
    console.error('[VERIFICATION] 인증 제출 오류:', error)
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}

// 인증 상태 조회
export async function GET(request: NextRequest) {
  try {
    if (!supabaseServer) {
      return NextResponse.json(
        { error: '데이터베이스 연결이 설정되지 않았습니다.' },
        { status: 500 }
      )
    }

    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')

    if (!userId) {
      return NextResponse.json(
        { error: '사용자 ID가 필요합니다.' },
        { status: 400 }
      )
    }

    // 사용자 인증 상태 조회 (users 테이블과 user_preferences 테이블 모두 확인)
    try {
      // 1. users 테이블에서 기본 인증 정보 확인
      const { data: userData, error: userError } = await supabaseServer
        .from('users')
        .select('id, full_name, phone, university, major, email_verified_at, created_at')
        .eq('id', userId)
        .single()

      if (userError) {
        console.error('[VERIFICATION] 사용자 정보 조회 실패:', userError)
      }

      // 2. user_preferences 테이블에서 추가 인증 정보 확인
      const { data: preferences, error: preferencesError } = await supabaseServer
        .from('user_preferences' as any)
        .select('*')
        .eq('user_id', userId)
        .single()

      if (preferencesError && preferencesError.code !== 'PGRST116') {
        console.error('[VERIFICATION] user_preferences 조회 실패:', preferencesError)
      }

      // 3. 실제 인증 완료 여부 확인 (users 테이블 우선)
      const hasBasicInfo = userData && (
        userData.full_name ||
        userData.phone ||
        userData.university ||
        userData.major
      )

      const hasPreferencesInfo = preferences && (
        (preferences as any).full_name ||
        (preferences as any).phone ||
        (preferences as any).university ||
        (preferences as any).major
      )

      const isVerified = hasBasicInfo || hasPreferencesInfo

      console.log('[VERIFICATION] 인증 상태 확인:', {
        userId,
        hasBasicInfo,
        hasPreferencesInfo,
        isVerified,
        userData: userData ? {
          full_name: userData.full_name,
          phone: userData.phone,
          university: userData.university,
          major: userData.major
        } : null
      })

      const verification = isVerified ? {
        status: 'approved' as const,
        message: '인증이 완료되었습니다.',
        submitted_at: userData?.created_at || (preferences as any)?.created_at,
        user_data: userData,
        preferences: preferences
      } : {
        status: 'not_submitted' as const,
        message: '인증 정보가 제출되지 않았습니다.',
        user_data: userData,
        preferences: preferences
      }

      return NextResponse.json({ verification })

    } catch (error) {
      console.error('[VERIFICATION] 인증 상태 조회 오류:', error)
      return NextResponse.json({
        verification: {
          status: 'not_submitted' as const,
          message: '인증 정보가 제출되지 않았습니다.'
        }
      })
    }

  } catch (error) {
    console.error('[VERIFICATION] 인증 상태 조회 오류:', error)
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}
