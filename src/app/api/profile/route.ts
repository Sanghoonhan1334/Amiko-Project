import { NextRequest, NextResponse } from 'next/server'
import { supabaseServer } from '@/lib/supabaseServer'

// 사용자 프로필 업데이트
export async function PUT(request: NextRequest) {
  try {
    if (!supabaseServer) {
      return NextResponse.json(
        { error: '데이터베이스 연결이 설정되지 않았습니다.' },
        { status: 500 }
      )
    }

    const body = await request.json()
    const { full_name, phone, one_line_intro, language, profile_image, profile_images, main_profile_image, user_type, university, major, grade, occupation, company, work_experience } = body

    // Authorization 헤더에서 사용자 ID 추출 (임시)
    const authHeader = request.headers.get('Authorization')
    if (!authHeader) {
      return NextResponse.json(
        { error: '인증이 필요합니다.' },
        { status: 401 }
      )
    }

    const userId = authHeader.replace('Bearer ', '')

    // 사용자 기본 정보 업데이트
    const updateData: any = {
      full_name,
      phone,
      one_line_intro,
      language,
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

    const { data: user, error: userError } = await (supabaseServer as any)
      .from('users')
      .update(updateData)
      .eq('id', userId)
      .select()
      .single()

    if (userError) {
      console.error('[PROFILE] 사용자 업데이트 실패:', userError)
      return NextResponse.json(
        { error: '사용자 정보 업데이트에 실패했습니다.' },
        { status: 500 }
      )
    }

    // 사용자 타입 업데이트
    if (user_type) {
      try {
        await supabaseServer
          .from('user_preferences' as any)
          .upsert({
            user_id: userId,
            user_type: user_type,
            updated_at: new Date().toISOString()
          } as any)
      } catch (error) {
        console.error('[PROFILE] 사용자 타입 업데이트 실패:', error)
      }
    }

    // 학생 정보 업데이트
    if (user_type === 'student' && (university || major || grade)) {
      try {
        await supabaseServer
          .from('user_student_info' as any)
          .upsert({
            user_id: userId,
            university: university || null,
            major: major || null,
            grade: grade || null,
            updated_at: new Date().toISOString()
          } as any)
      } catch (error) {
        console.error('[PROFILE] 학생 정보 업데이트 실패:', error)
      }
    }

    // 직장인 정보 업데이트
    if (user_type === 'professional' && (occupation || company || work_experience)) {
      try {
        await supabaseServer
          .from('user_general_info' as any)
          .upsert({
            user_id: userId,
            occupation: occupation || null,
            company: company || null,
            work_experience: work_experience || null,
            updated_at: new Date().toISOString()
          } as any)
      } catch (error) {
        console.error('[PROFILE] 직장인 정보 업데이트 실패:', error)
      }
    }

    return NextResponse.json({
      success: true,
      user,
      message: '프로필이 성공적으로 업데이트되었습니다.'
    })

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

    console.log('[PROFILE] 사용자 ID:', userId)
    
    // 사용자 기본 정보 조회
    const { data: user, error: userError } = await supabaseServer
      .from('users')
      .select('*')
      .eq('id', userId)
      .single()

    console.log('[PROFILE] 사용자 조회 결과:', { user, userError })

    if (userError) {
      console.error('[PROFILE] 사용자 조회 실패:', userError)
      
      // 사용자가 없으면 auth.users에서 확인
      const { data: authUser, error: authError } = await supabaseServer.auth.admin.getUserById(userId)
      console.log('[PROFILE] Auth 사용자 확인:', { authUser, authError })
      
      if (authUser && !authError) {
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

    // 사용자 프로필은 users 테이블에 포함되어 있음
    const profile = null // users 테이블에서 이미 가져왔으므로 별도 조회 불필요

    // 포인트 정보는 기본값으로 설정 (나중에 포인트 시스템 구현 시 추가)
    const points = {
      total_points: 0,
      daily_points: 0,
      last_reset_date: new Date().toISOString().split('T')[0]
    }

    // 관련 테이블들 조회
    let userPreferences = null
    let studentInfo = null
    let generalInfo = null
    
    try {
      const { data: preferencesData } = await supabaseServer
        .from('user_preferences' as any)
        .select('*')
        .eq('user_id', userId)
        .single()
      userPreferences = preferencesData
    } catch (error) {
      console.log('[PROFILE] user_preferences 조회 실패:', error)
    }
    
    try {
      const { data: studentData } = await supabaseServer
        .from('user_student_info' as any)
        .select('*')
        .eq('user_id', userId)
        .single()
      studentInfo = studentData
    } catch (error) {
      console.log('[PROFILE] user_student_info 조회 실패:', error)
    }
    
    try {
      const { data: generalData } = await supabaseServer
        .from('user_general_info' as any)
        .select('*')
        .eq('user_id', userId)
        .single()
      generalInfo = generalData
    } catch (error) {
      console.log('[PROFILE] user_general_info 조회 실패:', error)
    }

    // 사용자 타입 결정
    const userType = (userPreferences as any)?.user_type || 'student'
    
    return NextResponse.json({
      user: {
        id: (user as any).id,
        email: (user as any).email,
        full_name: (user as any).full_name,
        phone: (user as any).phone,
        one_line_intro: (user as any).one_line_intro,
        language: (user as any).language,
        avatar_url: (user as any).avatar_url,
        is_admin: (user as any).is_admin,
        created_at: (user as any).created_at,
        updated_at: (user as any).updated_at,
        user_type: userType
      },
      profile: {
        user_id: userId,
        display_name: (user as any).full_name,
        bio: (user as any).one_line_intro,
        avatar_url: (user as any).avatar_url,
        country: 'KR',
        native_language: (user as any).language,
        is_korean: (user as any).language === 'ko',
        user_type: userType,
        university: (studentInfo as any)?.university || null,
        major: (studentInfo as any)?.major || null,
        grade: (studentInfo as any)?.grade || null,
        occupation: (generalInfo as any)?.occupation || null,
        company: (generalInfo as any)?.company || null,
        work_experience: (generalInfo as any)?.work_experience || null,
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

