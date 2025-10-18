import { NextRequest, NextResponse } from 'next/server'
import { sendPasswordResetEmail } from '@/lib/emailService'
import { createClient } from '@/lib/supabase/server'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'

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

    // Supabase 클라이언트 생성 (사용자 확인용)
    const supabase = createClient()

    // 사용자 존재 여부 확인 (Supabase Auth에서)
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    if (serviceRoleKey) {
      const adminSupabase = createSupabaseClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        serviceRoleKey,
        {
          auth: {
            autoRefreshToken: false,
            persistSession: false
          }
        }
      )

      const { data: authUsers, error: listError } = await adminSupabase.auth.admin.listUsers()
      
      if (!listError && authUsers) {
        const user = authUsers.users.find(u => u.email === email)
        if (!user) {
          console.error('[RESET_PASSWORD] 사용자 찾기 실패:', { email })
          return NextResponse.json(
            { success: false, error: '해당 이메일로 등록된 사용자를 찾을 수 없습니다.' },
            { status: 404 }
          )
        }
        console.log('[RESET_PASSWORD] 사용자 확인 성공:', { email, userId: user.id })
      }
    }

    const userNationality = nationality || 'KR'
    const language = userNationality === 'KR' ? 'ko' : 'es'

    console.log('[RESET_PASSWORD] 언어 설정:', { userNationality, language })

    // 커스텀 비밀번호 재설정 토큰 생성 (Supabase Auth 완전 우회)
    const resetToken = Buffer.from(`${email}:${Date.now()}`).toString('base64')
    
    // 프로덕션 환경에서는 실제 도메인만 사용 (개발 환경에서는 이메일 발송 안 함)
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://helloamiko.com'
    
    // 개발 환경에서는 이메일 발송하지 않음
    if (process.env.NODE_ENV === 'development') {
      console.log('[RESET_PASSWORD] 개발 환경 - 이메일 발송 건너뛰기')
      return NextResponse.json({
        success: true,
        message: '개발 환경에서는 이메일이 발송되지 않습니다.',
        debug: {
          resetLink: `${baseUrl}/reset-password?token=${resetToken}`,
          token: resetToken,
          email: email
        }
      })
    }
    
    const resetLink = `${baseUrl}/reset-password?token=${resetToken}`
    
    console.log('[RESET_PASSWORD] 커스텀 비밀번호 재설정 토큰 생성:', { 
      resetToken, 
      resetLink, 
      environment: process.env.NODE_ENV,
      baseUrl 
    })

    // 커스텀 이메일만 발송 (언어별) - Supabase 기본 이메일 완전 우회
    const emailSent = await sendPasswordResetEmail(email, resetLink, language)

    if (!emailSent) {
      console.error('[RESET_PASSWORD] 커스텀 이메일 발송 실패')
      return NextResponse.json(
        { success: false, error: '이메일 발송에 실패했습니다.' },
        { status: 500 }
      )
    }

    console.log(`[RESET_PASSWORD] ${language} 언어로 커스텀 비밀번호 재설정 이메일 발송 성공 (Supabase 기본 이메일 우회)`)
    
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