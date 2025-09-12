import { NextRequest, NextResponse } from 'next/server'
import { supabaseServer } from '@/lib/supabaseServer'

// 사용자 프로필 초기화 (임시)
export async function POST(request: NextRequest) {
  try {
    if (!supabaseServer) {
      return NextResponse.json(
        { error: '데이터베이스 연결이 설정되지 않았습니다.' },
        { status: 500 }
      )
    }

    const authHeader = request.headers.get('Authorization')
    if (!authHeader) {
      return NextResponse.json(
        { error: '인증이 필요합니다.' },
        { status: 401 }
      )
    }

    const userId = authHeader.replace('Bearer ', '')

    // auth.users에서 사용자 정보 가져오기
    const { data: authUser, error: authError } = await supabaseServer.auth.admin.getUserById(userId)
    
    if (authError || !authUser) {
      return NextResponse.json(
        { error: '사용자 정보를 찾을 수 없습니다.' },
        { status: 404 }
      )
    }

    // public.users에 기본 프로필 생성
    const { data: user, error: userError } = await supabaseServer
      .from('users')
      .upsert({
        id: userId,
        email: authUser.email,
        full_name: authUser.user_metadata?.name || '사용자',
        phone: authUser.user_metadata?.phone || '',
        one_line_intro: '안녕하세요! 새로운 사용자입니다.',
        language: 'ko',
        is_admin: false
      })
      .select()
      .single()

    if (userError) {
      console.error('[PROFILE_INIT] 사용자 생성 실패:', userError)
      return NextResponse.json(
        { error: '프로필 초기화에 실패했습니다.' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      user,
      message: '프로필이 초기화되었습니다.'
    })

  } catch (error) {
    console.error('[PROFILE_INIT] 프로필 초기화 오류:', error)
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}
