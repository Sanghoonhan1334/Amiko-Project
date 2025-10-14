import { NextRequest, NextResponse } from 'next/server'
import { supabaseServer } from '@/lib/supabaseServer'

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const params = await context.params
  try {
    const userId = params.id

    if (!userId) {
      return NextResponse.json(
        { error: '사용자 ID가 필요합니다.' },
        { status: 400 }
      )
    }

    if (!supabaseServer) {
      return NextResponse.json(
        { error: '데이터베이스 연결이 설정되지 않았습니다.' },
        { status: 500 }
      )
    }

    // 사용자 기본 정보 가져오기 (모든 프로필 정보가 users 테이블에 통합됨)
    const { data: user, error: userError } = await supabaseServer
      .from('users')
      .select(`
        id,
        email,
        full_name,
        nickname,
        korean_name,
        spanish_name,
        profile_image,
        bio,
        introduction,
        location,
        is_korean,
        user_type,
        university,
        major,
        grade,
        occupation,
        company,
        career,
        interests,
        korean_level,
        english_level,
        spanish_level,
        created_at,
        join_date
      `)
      .eq('id', userId)
      .single()

    if (userError) {
      console.error('사용자 조회 실패:', userError)
      return NextResponse.json(
        { error: '사용자를 찾을 수 없습니다.' },
        { status: 404 }
      )
    }

    // 프로필 데이터 (users 테이블에서 직접 가져옴)
    const profile = {
      id: user.id,
      full_name: user.full_name || user.nickname || user.korean_name || user.spanish_name || '사용자',
      nickname: user.nickname,
      korean_name: user.korean_name,
      spanish_name: user.spanish_name,
      email: user.email,
      profile_image: user.profile_image,
      bio: user.introduction || user.bio,
      location: user.location,
      is_korean: user.is_korean,
      user_type: user.user_type || 'student',
      university: user.university,
      major: user.major,
      grade: user.grade,
      occupation: user.occupation,
      company: user.company,
      work_experience: user.career,
      interests: user.interests || [],
      language_levels: {
        korean: user.korean_level,
        english: user.english_level,
        spanish: user.spanish_level,
      },
      created_at: user.created_at,
      join_date: user.join_date,
    }

    return NextResponse.json({ profile })

  } catch (error) {
    console.error('프로필 조회 중 오류:', error)
    return NextResponse.json(
      { error: '프로필을 불러오는데 실패했습니다.' },
      { status: 500 }
    )
  }
}
