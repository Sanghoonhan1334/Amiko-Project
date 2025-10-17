import { NextRequest, NextResponse } from 'next/server'
import { sendVerificationEmail } from '@/lib/emailService'
import { sendVerificationSMS, sendVerificationWhatsApp } from '@/lib/smsService'
import { createClient } from '@/lib/supabase/server'
import { formatPhoneNumber } from '@/lib/twilioService'

export async function POST(request: NextRequest) {
  try {
    console.log('[VERIFICATION] 인증 요청 시작')
    
    const body = await request.json()
    const { email, phoneNumber, type, nationality } = body
    
    console.log('[VERIFICATION] 요청 데이터:', { email, phoneNumber, type, nationality })

    // 전화번호 정규화 (저장과 검증에서 동일한 형식 사용)
    let normalizedPhoneNumber = phoneNumber
    if (phoneNumber && nationality) {
      normalizedPhoneNumber = formatPhoneNumber(phoneNumber, nationality)
      console.log('[VERIFICATION] 전화번호 정규화:', { original: phoneNumber, normalized: normalizedPhoneNumber })
    }

    // 유효성 검사
    if ((!email && !phoneNumber) || !type) {
      return NextResponse.json(
        { success: false, error: '이메일 또는 전화번호와 인증 타입이 필요합니다.' },
        { status: 400 }
      )
    }
    
    // 6자리 인증코드 생성
    const verificationCode = Math.floor(100000 + Math.random() * 900000).toString()
    
    console.log('[VERIFICATION] 인증코드 생성:', verificationCode)
    
    const supabase = createClient()
    
    // 기존 미인증 코드들 비활성화
    const deactivateQuery = supabase
      .from('verification_codes')
      .update({ verified: true }) // 이미 사용된 것으로 처리
      .eq('type', type)
      .eq('verified', false)

    if (email) {
      deactivateQuery.eq('email', email)
    }
    if (normalizedPhoneNumber) {
      deactivateQuery.eq('phone_number', normalizedPhoneNumber)
    }

    const { error: deactivateError } = await deactivateQuery

    if (deactivateError) {
      console.error('기존 인증코드 비활성화 실패:', deactivateError)
    }

    // 새 인증코드 저장 (10분간 유효)
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString()
    const { error: insertError } = await supabase
      .from('verification_codes')
      .insert([{
        email: email || null,
        phone_number: normalizedPhoneNumber || null,
        code: verificationCode,
        type: type,
        verified: false,
        expires_at: expiresAt,
        ip_address: request.ip || request.headers.get('x-forwarded-for') || '127.0.0.1',
        user_agent: request.headers.get('user-agent') || 'Unknown'
      }])

    if (insertError) {
      console.error('인증코드 저장 실패:', insertError)
      return NextResponse.json(
        { 
          success: false, 
          error: '인증코드 저장에 실패했습니다.',
          details: insertError.message,
          code: insertError.code,
          hint: insertError.hint
        },
        { status: 500 }
      )
    }

    console.log('[VERIFICATION] 인증코드 데이터베이스 저장 완료:', { email, phoneNumber: normalizedPhoneNumber, code: verificationCode })
    
    // 인증 방식에 따른 발송
    let sendResult = false
    let sendMethod = ''
    
    if (type === 'email' && email) {
      sendResult = await sendVerificationEmail(email, verificationCode)
      sendMethod = '이메일'
    } else if (type === 'sms' && phoneNumber) {
      // 언어 설정 (국가 코드 기반)
      const language = nationality === 'KR' ? 'ko' : 'es'
      sendResult = await sendVerificationSMS(phoneNumber, verificationCode, language, nationality)
      sendMethod = 'SMS'
    } else if (type === 'whatsapp' && phoneNumber) {
      // 언어 설정 (국가 코드 기반)
      const language = nationality === 'KR' ? 'ko' : 'es'
      sendResult = await sendVerificationWhatsApp(phoneNumber, verificationCode, language)
      sendMethod = 'WhatsApp'
    } else {
      return NextResponse.json(
        { success: false, error: '지원되지 않는 인증 방식입니다.' },
        { status: 400 }
      )
    }
    
    if (sendResult) {
      console.log(`[VERIFICATION] ${sendMethod} 발송 성공`)
      
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
          phoneNumber: phoneNumber,
          type: type,
          nationality: nationality
        }
      }
      
      return NextResponse.json(response)
    } else {
      console.error(`[VERIFICATION] ${sendMethod} 발송 실패`)
      return NextResponse.json(
        { success: false, error: `${sendMethod} 발송에 실패했습니다.` },
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