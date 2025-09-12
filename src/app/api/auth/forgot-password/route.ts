import { NextRequest, NextResponse } from 'next/server'
import { supabaseServer } from '@/lib/supabaseServer'

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json()

    // 입력 검증
    if (!email) {
      return NextResponse.json(
        { error: '이메일을 입력해주세요.' },
        { status: 400 }
      )
    }

    // 이메일 형식 검증
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: '올바른 이메일 형식을 입력해주세요.' },
        { status: 400 }
      )
    }

    // Supabase Auth로 비밀번호 재설정 이메일 전송
    if (!supabaseServer) {
      return NextResponse.json(
        { error: '데이터베이스 연결이 설정되지 않았습니다.' },
        { status: 500 }
      )
    }

    const { error } = await supabaseServer.auth.resetPasswordForEmail(email, {
      redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/reset-password`,
    })

    if (error) {
      console.error('[FORGOT_PASSWORD] 비밀번호 재설정 실패:', error)
      
      // 사용자가 존재하지 않는 경우에도 성공으로 처리 (보안상)
      if (error.message.includes('User not found')) {
        return NextResponse.json({
          success: true,
          message: '비밀번호 재설정 링크를 보내드렸습니다.'
        })
      }
      
      return NextResponse.json(
        { error: '비밀번호 재설정 요청에 실패했습니다.' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: '비밀번호 재설정 링크를 보내드렸습니다.'
    })

  } catch (error) {
    console.error('[FORGOT_PASSWORD] 오류:', error)
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}
