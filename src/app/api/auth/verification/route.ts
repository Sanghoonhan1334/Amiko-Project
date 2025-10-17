import { NextRequest, NextResponse } from 'next/server'
import { sendVerificationEmail } from '@/lib/emailService'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    console.log('[VERIFICATION] 이메일 인증 요청 시작')
    
    const body = await request.json()
    const { email, type, nationality } = body
    
    console.log('[VERIFICATION] 요청 데이터:', { email, type, nationality })
    
    // 유효성 검사
    if (!email || !type) {
      return NextResponse.json(
        { success: false, error: '이메일과 인증 타입이 필요합니다.' },
        { status: 400 }
      )
    }
    
    // 6자리 인증코드 생성
    const verificationCode = Math.floor(100000 + Math.random() * 900000).toString()
    
    console.log('[VERIFICATION] 인증코드 생성:', verificationCode)
    
    // 임시로 메모리 저장소 사용 (데이터베이스 테이블 생성 전까지)
    const { storeVerificationCode } = await import('./check/route')
    storeVerificationCode(email, verificationCode)
    
    console.log('[VERIFICATION] 인증코드 메모리 저장 완료:', { email, code: verificationCode })
    
    // 이메일 발송
    const emailSent = await sendVerificationEmail(email, verificationCode)
    
    if (emailSent) {
      console.log('[VERIFICATION] 이메일 발송 성공')
      
      // 개발 환경에서만 디버그 정보 포함
      const response: any = {
        success: true,
        message: '인증코드가 발송되었습니다.',
        timestamp: new Date().toISOString()
      }
      
      // 개발 환경에서만 인증코드 반환
      if (process.env.NODE_ENV === 'development') {
        response.debug = {
          verificationCode: verificationCode,
          email: email,
          type: type
        }
      }
      
      return NextResponse.json(response)
    } else {
      console.error('[VERIFICATION] 이메일 발송 실패')
      return NextResponse.json(
        { success: false, error: '이메일 발송에 실패했습니다.' },
        { status: 500 }
      )
    }
    
  } catch (error) {
    console.error('[VERIFICATION] 에러 발생:', error)
    return NextResponse.json(
      { success: false, error: '서버 오류가 발생했습니다.', details: error.message },
      { status: 500 }
    )
  }
}

// PUT 메서드도 지원 (기존 코드와의 호환성을 위해)
export async function PUT(request: NextRequest) {
  return POST(request)
}