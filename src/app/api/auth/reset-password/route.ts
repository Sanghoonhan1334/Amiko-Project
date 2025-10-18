import { NextRequest, NextResponse } from 'next/server'
import { sendPasswordResetEmail } from '@/lib/emailService'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    console.log('[RESET_PASSWORD] 비밀번호 재설정 요청 시작')

    const body = await request.json()
    const { email, nationality } = body

    console.log('[RESET_PASSWORD] 요청 데이터:', { email, nationality })

    // 유효성 검사
    if (!email) {
      return NextResponse.json(
        { success: false, error: '이메일 주소가 필요합니다.' },
        { status: 400 }
      )
    }

    const supabase = createClient()

    // 언어 설정 (요청에서 제공된 국적 기반)
    const userNationality = nationality || 'KR'
    const language = userNationality === 'KR' ? 'ko' : 'es'

    console.log('[RESET_PASSWORD] 언어 설정:', { userNationality, language })

    // 커스텀 비밀번호 재설정 토큰 생성 (Supabase Auth 우회)
    const resetToken = Buffer.from(`${email}:${Date.now()}`).toString('base64')
    
    // 개발 환경에서는 localhost로, 프로덕션에서는 실제 도메인으로
    const baseUrl = process.env.NODE_ENV === 'development' 
      ? 'http://localhost:3000' 
      : (process.env.NEXT_PUBLIC_SITE_URL || 'https://helloamiko.com')
    
    const resetLink = `${baseUrl}/reset-password?token=${resetToken}`
    
    console.log('[RESET_PASSWORD] 커스텀 비밀번호 재설정 토큰 생성:', { 
      resetToken, 
      resetLink, 
      environment: process.env.NODE_ENV,
      baseUrl 
    })

    // 커스텀 이메일만 발송 (언어별)
    const emailSent = await sendPasswordResetEmail(email, resetLink, language)

    if (!emailSent) {
      console.error('[RESET_PASSWORD] 커스텀 이메일 발송 실패')
      return NextResponse.json(
        { success: false, error: '이메일 발송에 실패했습니다.' },
        { status: 500 }
      )
    }

    console.log(`[RESET_PASSWORD] ${language} 언어로 비밀번호 재설정 이메일 발송 성공`)
    
    return NextResponse.json({
      success: true,
      message: language === 'ko' ? '비밀번호 재설정 이메일이 발송되었습니다.' : 'Se ha enviado el email de restablecimiento de contraseña.',
      language: language
    })

  } catch (error: any) {
    console.error('[RESET_PASSWORD] 에러 발생:', error)
    return NextResponse.json(
      { success: false, error: '서버 오류가 발생했습니다.', details: error.message },
      { status: 500 }
    )
  }
}