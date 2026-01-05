import { NextRequest, NextResponse } from 'next/server'
import { sendVerificationEmail } from '@/lib/emailService'
import { sendVerificationSMS, sendVerificationWhatsApp } from '@/lib/smsService'
import { createClient } from '@/lib/supabase/server'
import { toE164 } from '@/lib/phoneUtils'

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

export async function POST(request: NextRequest) {
  let requestBody: any = null
  let normalizedTo: string = ''
  let inputCode: string = ''
  
  try {
    if (process.env.NODE_ENV === 'development') {
      console.log('[VERIFICATION] Verification request started')
      console.log('[VERIFICATION] Environment:', process.env.NODE_ENV)
    }
    
    requestBody = await request.json()
    const { email, phoneNumber, type, nationality } = requestBody
    
    // 입력값 저장 (로깅용)
    normalizedTo = email || phoneNumber || 'unknown'
    inputCode = 'generating...'
    
    if (process.env.NODE_ENV === 'development') {
      console.log('[VERIFICATION] Request data:', { type, nationality })
      console.log('[VERIFICATION] Environment variables check:', {
        hasSmtpUser: !!process.env.SMTP_USER,
        hasSmtpPass: !!process.env.SMTP_PASS,
        hasTwilioSid: !!process.env.TWILIO_ACCOUNT_SID,
        hasTwilioToken: !!process.env.TWILIO_AUTH_TOKEN,
        hasTwilioPhone: !!process.env.TWILIO_PHONE_NUMBER,
        supabaseUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
        supabaseKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY
      })
    }

    // 전화번호 정규화 (발송/검증 통일된 함수 사용)
    let normalizedPhoneNumber = phoneNumber
    if (phoneNumber && nationality) {
      normalizedPhoneNumber = toE164(phoneNumber, nationality)
      if (process.env.NODE_ENV === 'development') {
        console.log('[VERIFICATION] Phone number normalization (toE164):', { nationality })
      }
      
      // 정규화 실패 시 에러 (E.164 형식이 아님)
      if (!normalizedPhoneNumber.startsWith('+')) {
        if (process.env.NODE_ENV === 'development') {
          console.error('[VERIFICATION] Phone number normalization failed - not E.164 format:', { nationality })
        }
        return NextResponse.json(
          { success: false, error: 'Invalid phone number format' },
          { status: 400 }
        )
      }
    }

    // 유효성 검사
    if ((!email && !phoneNumber) || !type) {
      return NextResponse.json(
        { success: false, error: 'Email or phone number and verification type are required' },
        { status: 400 }
      )
    }
    
    // 6자리 인증코드 생성 (normalizeDigits로 정규화)
    const rawCode = Math.floor(100000 + Math.random() * 900000).toString()
    const verificationCode = normalizeDigits(rawCode)
    
    // 입력값 저장 (로깅용)
    inputCode = verificationCode
    
    if (process.env.NODE_ENV === 'development') {
      console.log('[VERIFICATION] Verification code generated:', { length: verificationCode.length })
    }
    
    const supabase = createClient()
    
    // 간단한 Insert 방식 (문제 해결을 위해)
    // 테스트용: 짧은 만료 시간 옵션 (EXPIRED 시나리오 테스트)
    const isTestMode = process.env.NODE_ENV === 'development' && requestBody?.testExpired
    const expiryMinutes = isTestMode ? 0.1 : 10 // 테스트 시 6초, 일반 시 10분
    const expiresAt = new Date(Date.now() + expiryMinutes * 60 * 1000).toISOString()
    
    // whatsapp는 데이터베이스에서 sms로 저장 (스키마 제약 조건)
    const dbType = type === 'whatsapp' ? 'sms' : type
    
    // 기존 코드 비활성화 (REPLACED_OR_USED 시나리오를 위해)
    try {
      if (process.env.NODE_ENV === 'development') {
        console.log('[VERIFICATION] Processing existing unverified codes')
      }
      
      let deactivateQuery = supabase
        .from('verification_codes')
        .update({ 
          verified: true,
          updated_at: new Date().toISOString()
        })
        .eq('type', dbType)
        .eq('verified', false)

      if (email) {
        deactivateQuery = deactivateQuery.eq('email', email)
      }
      if (normalizedPhoneNumber) {
        deactivateQuery = deactivateQuery.eq('phone_number', normalizedPhoneNumber)
      }

      const { error: deactivateError, count } = await deactivateQuery

      if (deactivateError) {
        if (process.env.NODE_ENV === 'development') {
          console.error('[VERIFICATION] Failed to deactivate existing codes:', deactivateError)
        }
      } else {
        if (process.env.NODE_ENV === 'development') {
          console.log(`[VERIFICATION] Deactivated ${count || 0} existing unverified codes`)
        }
      }
    } catch (deactivateErr) {
      if (process.env.NODE_ENV === 'development') {
        console.error('[VERIFICATION] Exception while processing existing codes:', deactivateErr)
      }
      // 계속 진행
    }

    // 새 인증코드 저장 (10분간 유효)
    const insertData = {
      email: email || null,
      phone_number: normalizedPhoneNumber || null,
      code: verificationCode,
      type: dbType,
      verified: false,
      expires_at: expiresAt,
      ip_address: request.headers.get('x-forwarded-for') || '127.0.0.1',
      user_agent: request.headers.get('user-agent') || 'Unknown'
    }
    
    if (process.env.NODE_ENV === 'development') {
      console.log('[VERIFICATION] Attempting database insert')
    }
    
    const { error: insertError } = await supabase
      .from('verification_codes')
      .insert([insertData])

    if (insertError) {
      if (process.env.NODE_ENV === 'development') {
        console.error('[VERIFICATION] Failed to save verification code:', {
          message: insertError.message,
          code: insertError.code,
          hint: insertError.hint
        })
      }
      return NextResponse.json(
        { 
          success: false, 
          error: 'Failed to save verification code',
          details: insertError.message,
          code: insertError.code,
          hint: insertError.hint
        },
        { status: 500 }
      )
    }

    if (process.env.NODE_ENV === 'development') {
      console.log('[VERIFICATION] Verification code saved to database')
    }
    
    // 인증 방식에 따른 발송
    let sendResult = false
    let sendMethod = ''
    
    try {
    if (type === 'email' && email) {
      // 언어 설정 (전화번호 국가코드 우선, 없으면 국적 기준)
      // 전화번호가 있으면 전화번호 기준으로 언어 결정 (멕시코 국적 + 한국 전화번호 지원)
      let language = 'es' // 기본값: 스페인어
      if (phoneNumber) {
        language = phoneNumber.startsWith('+82') ? 'ko' : 'es'
      } else {
        language = nationality === 'KR' ? 'ko' : 'es'
      }
        if (process.env.NODE_ENV === 'development') {
          console.log('[VERIFICATION] Attempting email send:', { language, phoneNumber, nationality })
        }
      sendResult = await sendVerificationEmail(email, verificationCode, language)
      sendMethod = '이메일'
    } else if (type === 'sms' && phoneNumber) {
      // 언어 설정 (전화번호 국가코드 기준, 국적과 독립적)
      // 멕시코 국적 + 한국 전화번호 조합 허용
      const language = phoneNumber.startsWith('+82') ? 'ko' : 'es'
        if (process.env.NODE_ENV === 'development') {
          console.log('[VERIFICATION] Attempting SMS send:', { language, nationality })
        }
        // 정규화된 번호 사용
        sendResult = await sendVerificationSMS(normalizedPhoneNumber, verificationCode, language, nationality)
      sendMethod = 'SMS'
        if (process.env.NODE_ENV === 'development') {
          console.log('[VERIFICATION] SMS send result:', sendResult)
        }
    } else if (type === 'whatsapp' && phoneNumber) {
      // 언어 설정 (전화번호 국가코드 기준, 국적과 독립적)
      // 멕시코 국적 + 한국 전화번호 조합 허용
      const language = normalizedPhoneNumber.startsWith('+82') ? 'ko' : 'es'
        console.log('[VERIFICATION] ========================================')
        console.log('[VERIFICATION] WhatsApp 발송 시도')
        console.log('[VERIFICATION] 전화번호:', normalizedPhoneNumber)
        console.log('[VERIFICATION] 언어:', language)
        console.log('[VERIFICATION] 인증코드:', verificationCode)
        console.log('[VERIFICATION] 환경 변수 확인:', {
          TWILIO_ACCOUNT_SID: process.env.TWILIO_ACCOUNT_SID ? '설정됨' : '없음',
          TWILIO_AUTH_TOKEN: process.env.TWILIO_AUTH_TOKEN ? '설정됨' : '없음',
          TWILIO_WHATSAPP_NUMBER: process.env.TWILIO_WHATSAPP_NUMBER || '없음',
          TWILIO_WHATSAPP_FROM: process.env.TWILIO_WHATSAPP_FROM || '없음',
          TWILIO_WHATSAPP_TEMPLATE_SID: process.env.TWILIO_WHATSAPP_TEMPLATE_SID || '없음'
        })
        // 정규화된 번호 사용
        sendResult = await sendVerificationWhatsApp(normalizedPhoneNumber, verificationCode, language)
        console.log('[VERIFICATION] WhatsApp 발송 결과:', sendResult)
        console.log('[VERIFICATION] ========================================')
      sendMethod = 'WhatsApp'
    } else {
      return NextResponse.json(
        { success: false, error: 'Unsupported verification method' },
        { status: 400 }
      )
      }
    } catch (sendError) {
      if (process.env.NODE_ENV === 'development') {
        console.error('[VERIFICATION] Exception during send:', {
          message: sendError instanceof Error ? sendError.message : String(sendError),
          type: type,
          nationality: nationality
        })
      }
      
      // 발송 실패로 처리
      sendResult = false
    }
    
    if (sendResult) {
      if (process.env.NODE_ENV === 'development') {
        console.log(`[VERIFICATION] ${sendMethod} send successful`)
      }
      
      // 개발 환경에서만 디버그 정보 포함
      const response: any = {
        success: true,
        message: 'Verification code has been sent',
        timestamp: new Date().toISOString()
      }
      
      // 개발 환경에서만 인증코드 반환
      if (process.env.NODE_ENV === 'development') {
        response.debug = {
          verificationCode: verificationCode,
          email: email,
          phoneNumber: phoneNumber,
          normalizedPhoneNumber: normalizedPhoneNumber,
          type: type,
          nationality: nationality
        }
      }
      
      return NextResponse.json(response)
    } else {
      if (process.env.NODE_ENV === 'development') {
        console.error(`[VERIFICATION] ${sendMethod} send failed`)
        console.error(`[VERIFICATION] Send failure details:`, {
          type,
          nationality,
          hasSmtpUser: !!process.env.SMTP_USER,
          hasSmtpPass: !!process.env.SMTP_PASS,
          hasTwilioSid: !!process.env.TWILIO_ACCOUNT_SID,
          hasTwilioToken: !!process.env.TWILIO_AUTH_TOKEN,
          hasTwilioPhone: !!process.env.TWILIO_PHONE_NUMBER
        })
        console.warn(`[VERIFICATION] Development environment - send failed`)
        console.warn(`[VERIFICATION] Verification code saved to DB but actual SMS was not sent`)
      }
      
      // 개발 환경에서는 발송 실패해도 인증코드는 DB에 저장되지만, 사용자에게는 실패를 명확히 알림
      if (process.env.NODE_ENV === 'development') {
        // 더 명확한 에러 메시지 제공 (SMS/WhatsApp 구분)
        const isWhatsApp = type === 'whatsapp'
        const phoneNumberVar = isWhatsApp ? 'TWILIO_WHATSAPP_FROM' : 'TWILIO_PHONE_NUMBER'
        const errorMessage = isWhatsApp
          ? 'WhatsApp send failed. Twilio WhatsApp phone number is not registered in the account. (Development environment)\n\nSolution:\n1. Check WhatsApp phone numbers in Twilio console (https://console.twilio.com/)\n2. Update TWILIO_WHATSAPP_FROM in .env.local to a registered WhatsApp number\n3. Or purchase/register a WhatsApp phone number in Twilio console'
          : 'SMS send failed. Twilio phone number is not registered in the account. (Development environment)\n\nSolution:\n1. Check phone numbers in Twilio console (https://console.twilio.com/)\n2. Update TWILIO_PHONE_NUMBER in .env.local to a registered number\n3. Or purchase/register a phone number in Twilio console'
        
        return NextResponse.json({
          success: false,
          error: errorMessage,
          debug: {
            verificationCode: verificationCode, // 개발 환경에서만 인증코드 반환
            message: `Actual ${isWhatsApp ? 'WhatsApp' : 'SMS'} was not sent. In development environment, check the verification code and enter it manually.`,
            troubleshooting: {
              issue: `Twilio ${isWhatsApp ? 'WhatsApp' : 'SMS'} phone number and account mismatch (error code 21660)`,
              solution: `Check registered ${isWhatsApp ? 'WhatsApp' : 'SMS'} phone numbers in Twilio console and update ${phoneNumberVar} in .env.local`
            }
          },
          timestamp: new Date().toISOString()
        })
      }
      
      return NextResponse.json(
        { success: false, error: `Failed to send ${sendMethod}` },
        { status: 500 }
      )
    }
    
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.error('[VERIFICATION] ========================================')
      console.error('[VERIFICATION] Exception occurred!')
      console.error('[VERIFICATION] Error type:', error?.constructor?.name)
      console.error('[VERIFICATION] Error message:', error instanceof Error ? error.message : String(error))
      console.error('[VERIFICATION] Error stack:', error instanceof Error ? error.stack : 'N/A')
      
      // 입력값 로깅 (마스킹된 코드)
      console.error('[VERIFICATION] Input values:', {
        to: normalizedTo ? '***' : 'not-provided',
        codeLength: inputCode.length,
        requestBody: requestBody ? {
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
        
        console.error('[VERIFICATION] Recent DB codes:', recentCodes?.map(c => ({
          id: c.id,
          status: c.verified ? 'verified' : 'pending',
          created_at: c.created_at,
          expires_at: c.expires_at,
          hasCode: !!c.code,
          type: c.type
        })))
      } catch (dbError) {
        console.error('[VERIFICATION] DB query failed:', dbError)
      }
      
      console.error('[VERIFICATION] ========================================')
    }
    
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
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
        error: 'Internal server error',
        reason: reason,
        errorType: errorName,
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    )
  }
}

// PUT 메서드도 지원 (기존 코드와의 호환성을 위해)
export async function PUT(request: NextRequest) {
  return POST(request)
}