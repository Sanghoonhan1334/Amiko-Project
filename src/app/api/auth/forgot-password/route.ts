import { NextRequest, NextResponse } from 'next/server'
import { supabaseServer } from '@/lib/supabaseServer'
import { sendPasswordResetEmail } from '@/lib/emailService'

export async function POST(request: NextRequest) {
  try {
    const { email, language = 'ko' } = await request.json()

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

    // 사용자 존재 여부 확인
    if (!supabaseServer) {
      return NextResponse.json(
        { error: '데이터베이스 연결이 설정되지 않았습니다.' },
        { status: 500 }
      )
    }

    // 사용자 정보 조회 (언어 설정 포함)
    const { data: userData, error: userError } = await supabaseServer
      .from('users')
      .select('id, email, language')
      .eq('email', email)
      .single()

    // 사용자가 존재하지 않는 경우에도 성공으로 처리 (보안상)
    if (userError || !userData) {
      return NextResponse.json({
        success: true,
        message: language === 'es' ? 'Se ha enviado un enlace de restablecimiento de contraseña.' : '비밀번호 재설정 링크를 보내드렸습니다.'
      })
    }

    // 사용자의 언어 설정 사용 (없으면 요청에서 받은 언어 사용)
    const userLanguage = userData.language || language

    // 커스텀 비밀번호 재설정 토큰 생성 (Supabase Auth 완전 우회)
    // Supabase의 resetPasswordForEmail을 호출하지 않음으로써 기본 이메일 발송 방지
    const resetToken = Buffer.from(`${email}:${Date.now()}`).toString('base64')
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://helloamiko.com'
    const resetLink = `${baseUrl}/reset-password?token=${resetToken}`

    console.log('[FORGOT_PASSWORD] 커스텀 비밀번호 재설정 토큰 생성 (Supabase 기본 이메일 우회):', { 
      email,
      resetLink,
      language: userLanguage
    })

    // 커스텀 이메일만 발송 (언어별) - Supabase 기본 이메일 완전 우회
    const emailSent = await sendPasswordResetEmail(email, resetLink, userLanguage as 'ko' | 'es')

    if (!emailSent) {
      console.error('[FORGOT_PASSWORD] 커스텀 이메일 발송 실패')
      return NextResponse.json(
        { error: userLanguage === 'es' ? 'Error al enviar el email de restablecimiento de contraseña.' : '비밀번호 재설정 이메일 발송에 실패했습니다.' },
        { status: 500 }
      )
    }

    console.log(`✅ [FORGOT_PASSWORD] ${userLanguage} 언어로 커스텀 비밀번호 재설정 이메일 발송 성공 (Supabase 기본 이메일 우회): ${email}`)

    return NextResponse.json({
      success: true,
      message: userLanguage === 'es' ? 'Se ha enviado un enlace de restablecimiento de contraseña.' : '비밀번호 재설정 링크를 보내드렸습니다.'
    })

  } catch (error) {
    console.error('[FORGOT_PASSWORD] 오류:', error)
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}
