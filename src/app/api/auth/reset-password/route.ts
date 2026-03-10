import { NextRequest, NextResponse } from 'next/server'
import { sendPasswordResetEmail } from '@/lib/emailService'
import { createClient } from '@/lib/supabase/server'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import { createHmac } from 'crypto'

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
      
    // 사용자 존재 여부 무관하게 항상 성공으로 처리 (사용자 열거 공격 방지)
    if (!listError && authUsers) {
      const user = authUsers.users.find(u => u.email === email)
      if (!user) {
        console.log('[RESET_PASSWORD] 사용자를 찾을 수 없음 (열거 방지: 성공 응답 반환)')
        return NextResponse.json({
          success: true,
          message: language === 'ko' ? '비밀번호 재설정 이메일이 발송되었습니다.' : 'Se ha enviado el email de restablecimiento de contraseña.',
          language: language
        })
      }
      console.log('[RESET_PASSWORD] 사용자 확인 성공:', { email, userId: user.id })
    }
    }

    const userNationality = nationality || 'KR'
    const language = userNationality === 'KR' ? 'ko' : 'es'

    console.log('[RESET_PASSWORD] 언어 설정:', { userNationality, language })

    // 커스텀 비밀번호 재설정 토큰 생성 (HMAC-SHA256 서명)
    const secret = process.env.RESET_TOKEN_SECRET
    if (!secret) {
      console.error('[RESET_PASSWORD] RESET_TOKEN_SECRET 환경변수가 설정되지 않음')
      return NextResponse.json(
        { success: false, error: '서버 설정 오류가 발생했습니다.' },
        { status: 500 }
      )
    }
    const timestamp = Date.now().toString()
    const payload = `${email}:${timestamp}`
    const hmac = createHmac('sha256', secret).update(payload).digest('hex')
    const resetToken = Buffer.from(`${payload}:${hmac}`).toString('base64url')

    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://helloamiko.com'

    // 개발 환경에서는 이메일 발송하지 않음
    if (process.env.NODE_ENV === 'development') {
      console.log('[RESET_PASSWORD] 개발 환경 - 이메일 발송 건너뛰기')
      return NextResponse.json({
        success: true,
        message: '개발 환경에서는 이메일이 발송되지 않습니다.'
      })
    }

    const resetLink = `${baseUrl}/reset-password?token=${resetToken}`

    console.log('[RESET_PASSWORD] HMAC 서명 비밀번호 재설정 토큰 생성:', { 
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