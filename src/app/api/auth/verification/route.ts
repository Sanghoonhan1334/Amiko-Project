import { NextRequest, NextResponse } from 'next/server'
import { sendVerificationEmail } from '@/lib/emailService'
import { sendVerificationSMS, sendVerificationWhatsApp } from '@/lib/smsService'
import { createClient } from '@/lib/supabase/server'
import { formatPhoneNumber } from '@/lib/twilioService'

// Edge 런타임 문제 방지
export const runtime = 'nodejs'

// 유니코드 숫자만 추출 (앞자리 0 유지)
function normalizeDigits(code: string): string {
  if (!code) return ''
  // 모든 유니코드 숫자를 ASCII 숫자로 변환
  return code.replace(/[\u0660-\u0669\u06F0-\u06F9]/g, (c) => 
    String.fromCharCode(c.charCodeAt(0) - (c.charCodeAt(0) >= 0x06F0 ? 0x06F0 : 0x0660) + 48)
  ).replace(/\D/g, '')
}

// E.164 형식으로 전화번호 정규화 (발송/검증 통일)
function toE164(phoneNumber: string, countryCode?: string): string {
  if (!phoneNumber) return ''
  
  // 이미 E.164 형식이면 그대로 반환
  if (phoneNumber.startsWith('+')) {
    return phoneNumber
  }
  
  // formatPhoneNumber 사용
  return formatPhoneNumber(phoneNumber, countryCode)
}

export async function POST(request: NextRequest) {
  let requestBody: any = null
  let normalizedTo: string = ''
  let inputCode: string = ''
  
  try {
    console.log('[VERIFICATION] ========================================')
    console.log('[VERIFICATION] 인증 요청 시작')
    console.log('[VERIFICATION] 환경:', process.env.NODE_ENV)
    console.log('[VERIFICATION] 런타임:', 'nodejs')
    
    requestBody = await request.json()
    const { email, phoneNumber, type, nationality } = requestBody
    
    // 입력값 저장 (로깅용)
    normalizedTo = email || phoneNumber || 'unknown'
    inputCode = 'generating...'
    
    console.log('[VERIFICATION] 요청 데이터:', { email, phoneNumber, type, nationality })
    console.log('[VERIFICATION] 환경변수 확인:', {
      hasSmtpUser: !!process.env.SMTP_USER,
      hasSmtpPass: !!process.env.SMTP_PASS,
      hasTwilioSid: !!process.env.TWILIO_ACCOUNT_SID,
      hasTwilioToken: !!process.env.TWILIO_AUTH_TOKEN,
      hasTwilioPhone: !!process.env.TWILIO_PHONE_NUMBER,
      supabaseUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
      supabaseKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY
    })

    // 전화번호 정규화 (발송/검증 통일된 함수 사용)
    let normalizedPhoneNumber = phoneNumber
    if (phoneNumber && nationality) {
      normalizedPhoneNumber = toE164(phoneNumber, nationality)
      console.log('[VERIFICATION] 전화번호 정규화 (toE164):', { original: phoneNumber, normalized: normalizedPhoneNumber, nationality })
    }

    // 유효성 검사
    if ((!email && !phoneNumber) || !type) {
      return NextResponse.json(
        { success: false, error: '이메일 또는 전화번호와 인증 타입이 필요합니다.' },
        { status: 400 }
      )
    }
    
    // 6자리 인증코드 생성 (normalizeDigits로 정규화)
    const rawCode = Math.floor(100000 + Math.random() * 900000).toString()
    const verificationCode = normalizeDigits(rawCode)
    
    // 입력값 저장 (로깅용)
    inputCode = verificationCode
    
    console.log('[VERIFICATION] 인증코드 생성:', { raw: rawCode, normalized: verificationCode, length: verificationCode.length })
    
    const supabase = createClient()
    
    // 간단한 Insert 방식 (문제 해결을 위해)
    // 테스트용: 짧은 만료 시간 옵션 (EXPIRED 시나리오 테스트)
    const isTestMode = process.env.NODE_ENV === 'development' && requestBody?.testExpired
    const expiryMinutes = isTestMode ? 0.1 : 10 // 테스트 시 6초, 일반 시 10분
    const expiresAt = new Date(Date.now() + expiryMinutes * 60 * 1000).toISOString()
    
    // 전화번호 정규화
    let normalizedPhoneNumber = phoneNumber
    if (phoneNumber && nationality) {
      normalizedPhoneNumber = toE164(phoneNumber, nationality)
      console.log('[VERIFICATION] 전화번호 정규화 (toE164):', { 
        original: phoneNumber, 
        normalized: normalizedPhoneNumber, 
        nationality: nationality || 'auto-detect'
      })
    }
    
    // 기존 코드 비활성화 (REPLACED_OR_USED 시나리오를 위해)
    try {
      console.log('[VERIFICATION] 기존 미인증 코드 처리 시작')
      
      let deactivateQuery = supabase
        .from('verification_codes')
        .update({ 
          verified: true,
          status: 'replaced', // 상태를 replaced로 변경
          updated_at: new Date().toISOString()
        })
        .eq('type', type)
        .eq('verified', false)

      if (email) {
        deactivateQuery = deactivateQuery.eq('email', email)
      }
      if (normalizedPhoneNumber) {
        deactivateQuery = deactivateQuery.eq('phone_number', normalizedPhoneNumber)
      }

      const { error: deactivateError, count } = await deactivateQuery

      if (deactivateError) {
        console.error('[VERIFICATION] 기존 인증코드 비활성화 실패:', deactivateError)
      } else {
        console.log(`[VERIFICATION] 기존 미인증 코드 ${count || 0}건 비활성화 완료`)
      }
    } catch (deactivateErr) {
      console.error('[VERIFICATION] 기존 코드 처리 예외:', deactivateErr)
      // 계속 진행
    }

    // 새 인증코드 저장 (10분간 유효)
    const insertData = {
      email: email || null,
      phone_number: normalizedPhoneNumber || null,
      code: verificationCode,
      type: type,
      verified: false,
      expires_at: expiresAt.toISOString(),
      ip_address: request.headers.get('x-forwarded-for') || '127.0.0.1',
      user_agent: request.headers.get('user-agent') || 'Unknown'
    }
    
    console.log('[VERIFICATION] 데이터베이스 삽입 시도:', insertData)
    
    const { error: insertError } = await supabase
      .from('verification_codes')
      .insert([insertData])

    if (insertError) {
      console.error('[VERIFICATION] ❌ 인증코드 저장 실패:', insertError)
      console.error('[VERIFICATION] 에러 상세:', {
        message: insertError.message,
        code: insertError.code,
        hint: insertError.hint,
        details: insertError.details
      })
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

    console.log('[VERIFICATION] ✅ 인증코드 데이터베이스 저장 완료:', { email, phoneNumber: normalizedPhoneNumber, code: verificationCode })
    
    // 인증 방식에 따른 발송
    let sendResult = false
    let sendMethod = ''
    
    if (type === 'email' && email) {
      // 언어 설정 (국가 코드 기반)
      const language = nationality === 'KR' ? 'ko' : 'es'
      sendResult = await sendVerificationEmail(email, verificationCode, language)
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
      console.error(`[VERIFICATION] 발송 실패 상세:`, {
        type,
        email,
        phoneNumber,
        nationality,
        hasSmtpUser: !!process.env.SMTP_USER,
        hasSmtpPass: !!process.env.SMTP_PASS,
        hasTwilioSid: !!process.env.TWILIO_ACCOUNT_SID,
        hasTwilioToken: !!process.env.TWILIO_AUTH_TOKEN,
        hasTwilioPhone: !!process.env.TWILIO_PHONE_NUMBER
      })
      
      // 개발 환경에서는 발송 실패해도 성공 처리 (인증코드는 DB에 저장됨)
      if (process.env.NODE_ENV === 'development') {
        console.warn(`[VERIFICATION] 개발 환경 - 발송 실패했지만 성공으로 처리`)
        return NextResponse.json({
          success: true,
          message: '인증코드가 생성되었습니다. (개발 환경)',
          timestamp: new Date().toISOString(),
          debug: {
            verificationCode: verificationCode,
            email: email,
            phoneNumber: phoneNumber,
            type: type,
            nationality: nationality,
            warning: '실제 발송은 실패했지만 개발 환경이므로 성공 처리'
          }
        })
      }
      
      return NextResponse.json(
        { success: false, error: `${sendMethod} 발송에 실패했습니다.` },
        { status: 500 }
      )
    }
    
  } catch (error) {
    // 무조건 콘솔 로그 출력
    console.error('[VERIFICATION] ========================================')
    console.error('[VERIFICATION] ❌❌❌ 예외 발생!')
    console.error('[VERIFICATION] 에러 타입:', error?.constructor?.name)
    console.error('[VERIFICATION] 에러 메시지:', error instanceof Error ? error.message : String(error))
    console.error('[VERIFICATION] 에러 스택:', error instanceof Error ? error.stack : 'N/A')
    
    // 입력값 로깅 (마스킹된 코드)
    console.error('[VERIFICATION] 입력값:', {
      to: normalizedTo,
      code: inputCode ? `${inputCode.substring(0, 2)}****` : 'not-generated',
      normalizedTo: normalizedTo,
      inputCodeLength: inputCode.length,
      requestBody: requestBody ? {
        email: requestBody.email,
        phoneNumber: requestBody.phoneNumber,
        type: requestBody.type,
        nationality: requestBody.nationality
      } : 'parsing-failed'
    })
    
    // DB 조회 결과 로깅 (최근 3개)
    try {
      const supabase = createClient()
      const { data: recentCodes } = await supabase
        .from('verification_codes')
        .select('id, code, type, email, phone_number, verified, created_at, expires_at')
        .order('created_at', { ascending: false })
        .limit(3)
      
      console.error('[VERIFICATION] 최근 DB 코드들:', recentCodes?.map(c => ({
        id: c.id,
        status: c.verified ? 'verified' : 'pending',
        created_at: c.created_at,
        expires_at: c.expires_at,
        hasCode: !!c.code,
        type: c.type,
        target: c.email || c.phone_number
      })))
    } catch (dbError) {
      console.error('[VERIFICATION] DB 조회 실패:', dbError)
    }
    
    console.error('[VERIFICATION] ========================================')
    
    const errorMessage = error instanceof Error ? error.message : '알 수 없는 오류'
    const errorName = error instanceof Error ? error.name : 'UnknownError'
    
    // 에러 타입별 reason 매핑
    let reason = 'UNKNOWN_ERROR'
    if (errorMessage.includes('verification_codes_type_check')) {
      reason = 'INVALID_TYPE'
    } else if (errorMessage.includes('duplicate key')) {
      reason = 'DUPLICATE_REQUEST'
    } else if (errorMessage.includes('connection')) {
      reason = 'DB_CONNECTION_ERROR'
    } else if (errorMessage.includes('SMTP') || errorMessage.includes('Twilio')) {
      reason = 'SEND_FAILED'
    }
    
    // 500이 아닌 400 응답으로 변경
    return NextResponse.json(
      { 
        success: false, 
        reason: reason,
        detail: errorMessage,
        errorType: errorName,
        timestamp: new Date().toISOString()
      },
      { status: 400 }
    )
  }
}

// PUT 메서드도 지원 (기존 코드와의 호환성을 위해)
export async function PUT(request: NextRequest) {
  return POST(request)
}