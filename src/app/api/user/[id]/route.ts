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

    // 사용자 기본 정보 가져오기
    const { data: user, error: userError } = await supabaseServer
      .from('users')
      .select('*')
      .eq('id', userId)
      .single()

    if (userError) {
      console.error('사용자 조회 실패:', userError)
      return NextResponse.json(
        { error: '사용자를 찾을 수 없습니다.' },
        { status: 404 }
      )
    }

    // 사용자 선호도 정보 가져오기
    const { data: preferences, error: preferencesError } = await supabaseServer
      .from('user_preferences')
      .select('*')
      .eq('user_id', userId)
      .single()

    // 사용자 학생 정보 가져오기
    const { data: studentInfo, error: studentError } = await supabaseServer
      .from('user_student_info')
      .select('*')
      .eq('user_id', userId)
      .single()

    // 사용자 일반 정보 가져오기
    const { data: generalInfo, error: generalError } = await supabaseServer
      .from('user_general_info')
      .select('*')
      .eq('user_id', userId)
      .single()

    // 프로필 데이터 조합
    const profile = {
      id: (user as any).id,
      full_name: (user as any).full_name,
      email: (user as any).email,
      profile_image: (user as any).profile_image,
      bio: (user as any).bio,
      location: (user as any).location,
      is_korean: (user as any).is_korean,
      user_type: (preferences as any)?.user_type || 'student',
      university: (studentInfo as any)?.university,
      major: (studentInfo as any)?.major,
      grade: (studentInfo as any)?.grade,
      occupation: (generalInfo as any)?.occupation,
      company: (generalInfo as any)?.company,
      work_experience: (generalInfo as any)?.work_experience,
      interests: (preferences as any)?.interests || [],
      language_levels: {
        korean: (preferences as any)?.korean_level,
        english: (preferences as any)?.english_level,
        spanish: (preferences as any)?.spanish_level,
      },
      created_at: (user as any).created_at,
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
