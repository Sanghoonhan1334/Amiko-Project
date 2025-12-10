import { NextRequest, NextResponse } from 'next/server'
import { supabaseServer } from '@/lib/supabaseServer'
import { sendEmail, createEmailTemplate } from '@/lib/emailService'

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

    // Supabase Auth로 비밀번호 재설정 토큰 생성
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://helloamiko.com'
    const { error } = await supabaseServer.auth.resetPasswordForEmail(email, {
      redirectTo: `${baseUrl}/reset-password`,
    })

    if (error) {
      console.error('[FORGOT_PASSWORD] 비밀번호 재설정 실패:', error)
      return NextResponse.json(
        { error: language === 'es' ? 'Error al solicitar restablecimiento de contraseña.' : '비밀번호 재설정 요청에 실패했습니다.' },
        { status: 500 }
      )
    }

    // 커스텀 이메일 발송 (언어별)
    try {
      const resetLink = `${baseUrl}/reset-password`
      const emailTemplate = createEmailTemplate('passwordReset', { resetLink }, userLanguage as 'ko' | 'es')
      
      await sendEmail({
        to: email,
        template: emailTemplate
      })
      
      console.log(`✅ [FORGOT_PASSWORD] ${userLanguage} 언어로 비밀번호 재설정 이메일 발송 완료: ${email}`)
    } catch (emailError) {
      console.error('❌ [FORGOT_PASSWORD] 커스텀 이메일 발송 실패:', emailError)
      // Supabase Auth 이메일은 이미 발송되었으므로 계속 진행
    }

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
