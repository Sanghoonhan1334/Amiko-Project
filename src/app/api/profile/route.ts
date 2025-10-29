import { NextRequest, NextResponse } from 'next/server'
import { supabaseServer } from '@/lib/supabaseServer'

// 사용자 프로필 생성/업데이트 (POST와 PUT 모두 지원)
export async function POST(request: NextRequest) {
  return handleProfileUpdate(request)
}

export async function PUT(request: NextRequest) {
  return handleProfileUpdate(request)
}

async function handleProfileUpdate(request: NextRequest) {
  try {
    if (!supabaseServer) {
      return NextResponse.json(
        { error: '데이터베이스 연결이 설정되지 않았습니다.' },
        { status: 500 }
      )
    }

    const body = await request.json()
    console.log('[PROFILE] 요청 데이터:', body)
    console.log('[PROFILE] 요청 데이터 타입:', typeof body)
    console.log('[PROFILE] 요청 데이터 키들:', Object.keys(body))
    const { 
      full_name, 
      korean_name,
      spanish_name, 
      nickname, 
      phone, 
      one_line_intro, 
      language, 
      profile_image, 
      profile_images, 
      main_profile_image, 
      user_type, 
      university, 
      major, 
      grade, 
      occupation, 
      company, 
      career,
      introduction,
      interests
    } = body

    // Authorization 헤더에서 토큰 추출
    const authHeader = request.headers.get('Authorization')
    if (!authHeader) {
      return NextResponse.json(
        { error: '인증이 필요합니다.' },
        { status: 401 }
      )
    }

    const token = authHeader.replace('Bearer ', '')
    
    // 토큰 디코딩 (인코딩된 토큰 처리)
    const decodedToken = decodeURIComponent(token)
    
    // 토큰에서 사용자 정보 추출
    let authUser = null
    let userId = null
    
    console.log('[PROFILE] 토큰 확인:', { 
      hasToken: !!token, 
      tokenLength: token?.length,
      decodedLength: decodedToken?.length 
    })
    
    const { data: { user: initialUser }, error: authError } = await supabaseServer.auth.getUser(decodedToken)
    
    if (authError || !initialUser) {
      console.error('[PROFILE] 인증 실패:', authError)
      
      // 토큰 갱신 시도
      try {
        const { data: { session }, error: refreshError } = await supabaseServer.auth.refreshSession()
        if (session && !refreshError) {
          console.log('[PROFILE] 토큰 갱신 성공, 다시 시도')
          const { data: { user: refreshedUser }, error: retryError } = await supabaseServer.auth.getUser(session.access_token)
          if (refreshedUser && !retryError) {
            authUser = refreshedUser
            userId = refreshedUser.id
            console.log('[PROFILE] 갱신된 사용자 ID:', userId)
          } else {
            return NextResponse.json(
              { error: '인증에 실패했습니다. 다시 로그인해주세요.' },
              { status: 401 }
            )
          }
        } else {
          return NextResponse.json(
            { error: '인증에 실패했습니다. 다시 로그인해주세요.' },
            { status: 401 }
          )
        }
      } catch (refreshError) {
        console.error('[PROFILE] 토큰 갱신 실패:', refreshError)
        return NextResponse.json(
          { error: '인증에 실패했습니다. 다시 로그인해주세요.' },
          { status: 401 }
        )
      }
    } else {
      authUser = initialUser
      userId = authUser.id
      console.log('[PROFILE] 사용자 ID:', userId)
    }

    // 사용자 기본 정보 업데이트
    const updateData: any = {
      full_name,
      korean_name,
      spanish_name,
      nickname,
      phone,
      one_line_intro,
      introduction,
      language,
      user_type,
      university,
      major,
      grade,
      occupation,
      company,
      career,
      interests,
      join_date: new Date().toISOString().split('T')[0],
      updated_at: new Date().toISOString()
    }

    // 프로필 사진이 있으면 추가
    if (profile_image) {
      updateData.profile_image = profile_image
    }

    // 여러 프로필 사진이 있으면 추가
    if (profile_images && profile_images.length > 0) {
      updateData.profile_images = profile_images
    }

    // 대표 프로필 사진이 있으면 추가
    if (main_profile_image) {
      updateData.main_profile_image = main_profile_image
    }

    // 먼저 사용자가 users 테이블에 존재하는지 확인
    console.log('[PROFILE] 사용자 존재 여부 확인 중...')
    const { data: existingUser, error: checkError } = await supabaseServer
      .from('users')
      .select('id')
      .eq('id', userId)
      .single()
    
    console.log('[PROFILE] 사용자 존재 확인 결과:', { existingUser, checkError })

    let user
    if (checkError && checkError.code === 'PGRST116') {
      // 사용자가 존재하지 않으면 새로 생성
      console.log('[PROFILE] 사용자가 존재하지 않아 새로 생성합니다.')
      const { data: newUser, error: createError } = await supabaseServer
        .from('users')
        .insert({
          id: userId,
          email: authUser.email,
          ...updateData
        })
        .select()
        .single()

      if (createError) {
        console.error('[PROFILE] 사용자 생성 실패:', createError)
        return NextResponse.json(
          { error: '사용자 생성에 실패했습니다.' },
          { status: 500 }
        )
      }
      user = newUser
      console.log('[PROFILE] 사용자 생성 성공:', newUser)
    } else {
      // 사용자가 존재하면 업데이트
      const { data: updatedUser, error: updateError } = await supabaseServer
        .from('users')
        .update(updateData as any)
        .eq('id', userId)
        .select()
        .single()

      if (updateError) {
        console.error('[PROFILE] 사용자 업데이트 실패:', updateError)
        console.error('[PROFILE] updateData:', JSON.stringify(updateData, null, 2))
        return NextResponse.json(
          { error: '사용자 정보 업데이트에 실패했습니다.', details: updateError.message, code: updateError.code },
          { status: 500 }
        )
      }
      user = updatedUser
      console.log('[PROFILE] 사용자 업데이트 성공:', updatedUser)
    }

    // 모든 정보가 users 테이블에 통합되어 있으므로 별도 업데이트 불필요

    // 업데이트된 사용자 정보를 다시 조회하여 최신 데이터 반환
    const { data: finalUser, error: finalError } = await supabaseServer
      .from('users')
      .select('*')
      .eq('id', userId)
      .single()

    if (finalError) {
      console.error('[PROFILE] 최종 사용자 조회 실패:', finalError)
      return NextResponse.json({
        success: true,
        user,
        message: '프로필이 성공적으로 업데이트되었습니다.'
      })
    }

    console.log('[PROFILE] 최종 사용자 데이터:', finalUser)
    console.log('[PROFILE] 최종 사용자 데이터 타입:', typeof finalUser)
    console.log('[PROFILE] 최종 사용자 데이터 키들:', finalUser ? Object.keys(finalUser) : 'null')

    const responseData = {
      success: true,
      user: finalUser,
      message: '프로필이 성공적으로 업데이트되었습니다.'
    }
    
    console.log('[PROFILE] 응답 데이터:', responseData)
    console.log('[PROFILE] 응답 데이터 타입:', typeof responseData)
    console.log('[PROFILE] 응답 데이터 키들:', Object.keys(responseData))

    return NextResponse.json(responseData)

  } catch (error) {
    console.error('[PROFILE] 프로필 업데이트 오류:', error)
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}

// 사용자 프로필 조회
export async function GET(request: NextRequest) {
  console.log('[PROFILE GET] API 호출 시작')
  try {
    if (!supabaseServer) {
      console.log('[PROFILE GET] Supabase 서버 클라이언트가 없음')
      return NextResponse.json(
        { error: '데이터베이스 연결이 설정되지 않았습니다.' },
        { status: 500 }
      )
    }
    console.log('[PROFILE GET] Supabase 서버 클라이언트 확인됨')

    const { searchParams } = new URL(request.url)
    let userId = searchParams.get('userId')

    // userId가 쿼리 파라미터에 없으면 Authorization 헤더에서 추출
    if (!userId) {
      const authHeader = request.headers.get('Authorization')
      if (authHeader) {
        const token = authHeader.replace('Bearer ', '')
        const decodedToken = decodeURIComponent(token)
        
        try {
          const { data: { user: authUser }, error: authError } = await supabaseServer.auth.getUser(decodedToken)
          if (authUser && !authError) {
            userId = authUser.id
            console.log('[PROFILE GET] Authorization 헤더에서 userId 추출:', userId)
          }
        } catch (error) {
          console.error('[PROFILE GET] 토큰 검증 실패:', error)
        }
      }
    }

    if (!userId) {
      return NextResponse.json(
        { error: '사용자 ID가 필요합니다. 로그인을 다시 해주세요.' },
        { status: 400 }
      )
    }

    // 임시 ID인 경우 처리 (개발 환경)
    if (userId.startsWith('user_') || userId.startsWith('temp_')) {
      return NextResponse.json({
        user: {
          id: userId,
          email: 'temp@example.com',
          full_name: '임시 사용자',
          korean_name: null,
          spanish_name: null,
          nickname: null,
          phone: null,
          one_line_intro: null,
          introduction: null,
          language: 'ko',
          avatar_url: null,
          profile_image: null,
          profile_images: null,
          main_profile_image: null,
          user_type: 'student',
          university: null,
          major: null,
          grade: null,
          occupation: null,
          company: null,
          career: null,
          interests: null,
          join_date: new Date().toISOString().split('T')[0],
          is_admin: false,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        },
        profile: {
          user_id: userId,
          display_name: '임시 사용자',
          bio: null,
          avatar_url: null,
          country: 'KR',
          native_language: 'ko',
          is_korean: true,
          user_type: 'student',
          university: null,
          major: null,
          grade: null,
          occupation: null,
          company: null,
          work_experience: null,
          kakao_linked_at: null,
          wa_verified_at: null,
          sms_verified_at: null,
          email_verified_at: null
        },
        points: {
          total_points: 0,
          daily_points: 0,
          last_reset_date: new Date().toISOString().split('T')[0]
        }
      })
    }
    console.log('[PROFILE GET] users 테이블에서 사용자 조회 시작:', userId)
    const { data: user, error: userError } = await supabaseServer
      .from('users')
      .select('*')
      .eq('id', userId)
      .single()

    if (userError) {
      console.log('[PROFILE GET] users 테이블에서 사용자 없음, auth.users 확인:', userError.message)
      // 사용자가 없으면 auth.users에서 확인
      const { data: authUser, error: authError } = await supabaseServer.auth.admin.getUserById(userId)
      
      if (authUser && !authError) {
        console.log('[PROFILE GET] auth.users에는 있지만 public.users에는 없음')
        // auth.users에는 있지만 public.users에는 없는 경우
        return NextResponse.json({
          error: '사용자 프로필이 설정되지 않았습니다. 인증을 완료해주세요.',
          needsVerification: true,
          authUser: {
            id: (authUser as any).id,
            email: (authUser as any).email,
            user_metadata: (authUser as any).user_metadata
          }
        }, { status: 404 })
      }
      
      return NextResponse.json(
        { error: '사용자 정보를 찾을 수 없습니다.' },
        { status: 404 }
      )
    }

    // auth.users에서 user_metadata 가져오기 (회원가입 시 입력한 국적 정보가 여기 있음)
    let userMetadata = null
    try {
      const { data: authUserData, error: authUserError } = await supabaseServer.auth.admin.getUserById(userId)
      if (authUserData && !authUserError) {
        userMetadata = authUserData.user.user_metadata
        console.log('[PROFILE GET] auth.users에서 user_metadata 가져옴:', userMetadata)
      } else {
        console.log('[PROFILE GET] auth.users 조회 실패 또는 user_metadata 없음:', authUserError?.message)
      }
    } catch (error) {
      console.error('[PROFILE GET] auth.users 조회 예외:', error)
    }

    // 사용자 프로필은 users 테이블에 포함되어 있음
    const profile = null // users 테이블에서 이미 가져왔으므로 별도 조회 불필요

    // 포인트 정보는 기본값으로 설정 (나중에 포인트 시스템 구현 시 추가)
    const points = {
      total_points: 0,
      daily_points: 0,
      last_reset_date: new Date().toISOString().split('T')[0]
    }

    // 모든 정보가 users 테이블에 통합되어 있으므로 별도 조회 불필요
    const userType = (user as any)?.user_type || 'student'
    
    // 회원가입 시 입력한 국적 (user_metadata.country) 우선 사용
    const signupCountry = userMetadata?.country
    
    return NextResponse.json({
      user: {
        id: (user as any).id,
        email: (user as any).email,
        full_name: (user as any).full_name,
        korean_name: (user as any).korean_name,
        spanish_name: (user as any).spanish_name,
        nickname: (user as any).nickname,
        phone: (user as any).phone,
        one_line_intro: (user as any).one_line_intro,
        introduction: (user as any).introduction,
        language: (user as any).language,
        country: signupCountry || (user as any).country, // 회원가입 시 입력한 국적 우선
        avatar_url: (user as any).avatar_url,
        profile_image: (user as any).profile_image,
        profile_images: (user as any).profile_images,
        main_profile_image: (user as any).main_profile_image,
        user_type: (user as any).user_type || userType,
        university: (user as any).university,
        major: (user as any).major,
        grade: (user as any).grade,
        occupation: (user as any).occupation,
        company: (user as any).company,
        career: (user as any).career,
        interests: (user as any).interests,
        join_date: (user as any).join_date,
        is_admin: (user as any).is_admin,
        is_korean: !!(user as any).is_korean || (user as any).language === 'ko',
        created_at: (user as any).created_at,
        updated_at: (user as any).updated_at,
        user_metadata: userMetadata // auth.users의 metadata (회원가입 시 입력한 국적 포함)
      },
      profile: {
        user_id: userId,
        display_name: (user as any).full_name,
        korean_name: (user as any).korean_name,
        nickname: (user as any).nickname,
        spanish_name: (user as any).spanish_name,
        bio: (user as any).one_line_intro,
        introduction: (user as any).introduction,
        avatar_url: (user as any).avatar_url,
        country: (user as any).country || (user as any).user_metadata?.country || ((user as any).language === 'ko' ? 'KR' : null),
        native_language: (user as any).language,
        is_korean: !!(user as any).is_korean || (user as any).language === 'ko',
        user_type: (user as any).user_type || userType,
        university: (user as any).university,
        major: (user as any).major,
        grade: (user as any).grade,
        occupation: (user as any).occupation,
        company: (user as any).company,
        career: (user as any).career,
        interests: (user as any).interests,
        join_date: (user as any).join_date,
        kakao_linked_at: null,
        wa_verified_at: null,
        sms_verified_at: null,
        email_verified_at: (user as any).email_verified_at
      },
      points: points || {
        total_points: 0,
        daily_points: 0,
        last_reset_date: new Date().toISOString().split('T')[0]
      }
    })

  } catch (error) {
    console.error('[PROFILE] 오류:', error)
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}

