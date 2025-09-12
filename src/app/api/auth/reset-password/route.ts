import { NextRequest, NextResponse } from 'next/server'
import { supabaseServer } from '@/lib/supabaseServer'

export async function POST(request: NextRequest) {
  try {
    const { password } = await request.json()

    // 입력 검증
    if (!password) {
      return NextResponse.json(
        { error: '비밀번호를 입력해주세요.' },
        { status: 400 }
      )
    }

    // 비밀번호 강도 검증
    if (password.length < 8) {
      return NextResponse.json(
        { error: '비밀번호는 최소 8자 이상이어야 합니다.' },
        { status: 400 }
      )
    }

    // Supabase의 비밀번호 재설정은 이메일 링크를 통해 자동으로 세션이 설정됨
    // 서버에서 직접 비밀번호 업데이트 (관리자 권한 사용)
    
    // 이메일 주소를 URL에서 가져오거나 다른 방법으로 사용자 식별
    // 임시로 모든 사용자의 비밀번호를 업데이트 (실제 환경에서는 더 안전한 방법 필요)
    
    // 실제로는 이메일 주소나 사용자 ID를 받아서 처리해야 함
    // 현재는 간단한 구현을 위해 에러 반환
    return NextResponse.json(
      { error: '비밀번호 재설정 기능을 준비 중입니다. 관리자에게 문의해주세요.' },
      { status: 501 }
    )

  } catch (error) {
    console.error('[RESET_PASSWORD] 오류:', error)
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}
