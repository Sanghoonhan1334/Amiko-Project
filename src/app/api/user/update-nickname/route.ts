import { NextRequest, NextResponse } from 'next/server'
import { supabaseServer } from '@/lib/supabaseServer'

// 닉네임 변경 API
export async function POST(request: NextRequest) {
  try {
    const { userId, nickname } = await request.json()

    console.log('[UPDATE_NICKNAME] 닉네임 변경 요청:', { userId, nickname })

    // 입력 검증
    if (!userId || !nickname) {
      return NextResponse.json(
        { error: '사용자 ID와 닉네임을 입력해주세요.' },
        { status: 400 }
      )
    }

    // 닉네임 길이 검증
    if (nickname.length < 3 || nickname.length > 20) {
      return NextResponse.json(
        { error: '닉네임은 3-20자 사이여야 합니다.' },
        { status: 400 }
      )
    }

    // 알파벳, 숫자, 특수문자 허용
    if (!/^[a-zA-Z0-9!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]+$/.test(nickname)) {
      return NextResponse.json(
        { error: '닉네임은 알파벳, 숫자, 특수문자만 사용할 수 있습니다.' },
        { status: 400 }
      )
    }

    if (!supabaseServer) {
      return NextResponse.json(
        { error: '데이터베이스 연결이 설정되지 않았습니다.' },
        { status: 500 }
      )
    }

    // 닉네임 중복 확인 (대소문자 구분 없이)
    const { data: existingUser, error: checkError } = await supabaseServer
      .from('users')
      .select('id')
      .eq('nickname', nickname.toLowerCase())
      .neq('id', userId) // 본인은 제외
      .maybeSingle()

    if (checkError) {
      console.error('[UPDATE_NICKNAME] 중복 확인 오류:', checkError)
      return NextResponse.json(
        { error: '닉네임 중복 확인 중 오류가 발생했습니다.' },
        { status: 500 }
      )
    }

    if (existingUser) {
      return NextResponse.json(
        { error: '이미 사용 중인 닉네임입니다.' },
        { status: 409 }
      )
    }

    // 닉네임 업데이트
    const { data: updatedUser, error: updateError } = await supabaseServer
      .from('users')
      .update({ nickname: nickname.toLowerCase() })
      .eq('id', userId)
      .select('id, full_name, nickname, avatar_url')
      .single()

    if (updateError) {
      console.error('[UPDATE_NICKNAME] 닉네임 업데이트 오류:', updateError)
      return NextResponse.json(
        { error: '닉네임 변경에 실패했습니다.' },
        { status: 500 }
      )
    }

    console.log('[UPDATE_NICKNAME] 닉네임 변경 성공:', updatedUser)

    return NextResponse.json({
      success: true,
      user: updatedUser,
      message: '닉네임이 성공적으로 변경되었습니다.'
    })

  } catch (error) {
    console.error('[UPDATE_NICKNAME] 닉네임 변경 처리 오류:', error)
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}

