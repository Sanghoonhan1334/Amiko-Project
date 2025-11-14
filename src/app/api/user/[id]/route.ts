import { NextRequest, NextResponse } from 'next/server'
import { supabaseServer } from '@/lib/supabaseServer'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  console.log('[API] /api/user/[id] - 요청 시작')
  try {
    if (!supabaseServer) {
      console.error('[API] Supabase 서버가 초기화되지 않음')
      return NextResponse.json(
        { error: '데이터베이스 연결이 설정되지 않았습니다.' },
        { status: 500 }
      )
    }

    // Next.js 15에서 params는 항상 Promise
    const { id } = await params
    const userId = id

    console.log('[API] /api/user/[id] - 요청 URL:', request.url)
    console.log('[API] /api/user/[id] - userId:', userId)

    if (!userId) {
      return NextResponse.json(
        { error: '사용자 ID가 필요합니다.' },
        { status: 400 }
      )
    }

    // users 테이블에서 사용자 정보 조회
    const { data: user, error: userError } = await supabaseServer
      .from('users')
      .select('*')
      .eq('id', userId)
      .maybeSingle()

    if (userError) {
      console.error('[API] 사용자 조회 오류:', { userId, error: userError, code: userError.code })
      return NextResponse.json(
        { error: `사용자를 찾을 수 없습니다. (${userError.message || userError.code || 'Unknown error'})` },
        { status: 404 }
      )
    }

    if (!user) {
      console.error('[API] 사용자를 찾을 수 없음:', userId)
      return NextResponse.json(
        { error: '사용자를 찾을 수 없습니다.' },
        { status: 404 }
      )
    }

    console.log('[API] 사용자 조회 성공:', { userId, name: user.full_name })

    // 포인트 정보 조회
    let totalPoints = 0
    let isVip = false
    try {
      const { data: pointsData, error: pointsError } = await supabaseServer
        .from('user_points')
        .select('total_points, is_vip')
        .eq('user_id', userId)
        .maybeSingle()
      
      if (!pointsError && pointsData) {
        totalPoints = pointsData.total_points || 0
        isVip = pointsData.is_vip || false
      } else if (pointsError && pointsError.code !== 'PGRST116') {
        // PGRST116은 "결과 없음" 에러이므로 무시
        console.error('포인트 정보 조회 실패:', pointsError)
      }
    } catch (error) {
      console.error('포인트 정보 조회 예외:', error)
    }

    // profile 형식으로 데이터 변환
    const profile = {
      user_id: userId,
      id: userId,
      full_name: user.full_name,
      display_name: user.full_name,
      korean_name: user.korean_name,
      nickname: user.nickname,
      spanish_name: user.spanish_name,
      bio: user.one_line_intro,
      introduction: user.introduction,
      avatar_url: user.avatar_url,
      profile_image: user.profile_image || user.avatar_url,
      profile_images: user.profile_images,
      country: 'KR',
      native_language: user.language,
      is_korean: !!(user as any).is_korean || user.language === 'ko',
      user_type: user.user_type,
      university: user.university,
      major: user.major,
      grade: user.grade,
      occupation: user.occupation,
      company: user.company,
      career: user.career,
      work_experience: user.career,
      interests: (user as any).interests,
      join_date: (user as any).join_date || user.created_at,
      email: user.email,
      language: user.language,
      created_at: user.created_at,
      createdAt: user.created_at,
      updatedAt: user.updated_at,
      total_points: totalPoints,
      is_vip: isVip
    }

    return NextResponse.json({ profile })

  } catch (error) {
    console.error('[API] /api/user/[id] - 예외 발생:', error)
    console.error('[API] /api/user/[id] - 에러 상세:', {
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      name: error instanceof Error ? error.name : undefined
    })
    return NextResponse.json(
      { 
        error: '서버 오류가 발생했습니다.',
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    )
  }
}
