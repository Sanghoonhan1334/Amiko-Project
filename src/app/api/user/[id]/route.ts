import { NextRequest, NextResponse } from 'next/server'
import { supabaseServer } from '@/lib/supabaseServer'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    if (!supabaseServer) {
      return NextResponse.json(
        { error: '데이터베이스 연결이 설정되지 않았습니다.' },
        { status: 500 }
      )
    }

    const userId = params.id

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
      .single()

    if (userError) {
      console.error('사용자 조회 오류:', userError)
      return NextResponse.json(
        { error: '사용자를 찾을 수 없습니다.' },
        { status: 404 }
      )
    }

    // profile 형식으로 데이터 변환
    const profile = {
      user_id: userId,
      id: userId,
      display_name: user.full_name,
      korean_name: user.korean_name,
      nickname: user.nickname,
      spanish_name: user.spanish_name,
      bio: user.one_line_intro,
      introduction: user.introduction,
      avatar_url: user.avatar_url,
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
      join_date: (user as any).join_date,
      email: user.email,
      language: user.language,
      createdAt: user.created_at,
      updatedAt: user.updated_at
    }

    return NextResponse.json({ profile })

  } catch (error) {
    console.error('프로필 조회 오류:', error)
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}
