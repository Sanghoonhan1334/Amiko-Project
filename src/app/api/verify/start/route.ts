// 모듈 로딩 시점 로그 (가장 먼저 실행)
console.log('[VERIFY_START] 🔥 모듈 로드 완료 - TOP LEVEL')

import { NextRequest, NextResponse } from 'next/server'

export const runtime = 'nodejs'

// OTP 전송 시작 API
export async function POST(request: NextRequest) {
  console.log('[VERIFY_START] ========================================')
  console.log('[VERIFY_START] STEP 1: 함수 진입')
  console.log('[VERIFY_START] Request method:', request.method)
  console.log('[VERIFY_START] Request URL:', request.url)
  console.log('[VERIFY_START] ========================================')

  try {
    // STEP 2: 요청 본문 파싱
    console.log('[VERIFY_START] STEP 2: 요청 본문 파싱 시작')
    let body: any
    try {
      body = await request.json()
      console.log('[VERIFY_START] STEP 2: req body', body)
    } catch (jsonError) {
      console.error('[VERIFY_START] STEP 2 에러: 요청 본문 JSON 파싱 실패!', jsonError)
      return NextResponse.json(
        { ok: false, error: 'INVALID_JSON', message: '요청 본문 형식이 올바르지 않습니다.' },
        { status: 400 }
      )
    }

    if (!body) {
      console.error('[VERIFY_START] STEP 2 에러: body가 null 또는 undefined')
      return NextResponse.json(
        { ok: false, error: 'MISSING_REQUEST_BODY', message: '요청 본문이 없습니다.' },
        { status: 400 }
      )
    }

    const { channel, target, purpose = 'signup', nationality } = body
    console.log('[VERIFY_START] STEP 2 완료:', { channel, target: target?.substring(0, 5) + '...', purpose, nationality })

    // STEP 3: 입력 유효성 검사
    console.log('[VERIFY_START] STEP 3: 입력 유효성 검사 시작')
    if (!channel || !target) {
      console.error('[VERIFY_START] STEP 3 에러: 필수 필드 누락!', { channel, target })
      return NextResponse.json(
        { ok: false, error: 'MISSING_REQUIRED_FIELDS', message: '채널과 대상이 필요합니다.' },
        { status: 400 }
      )
    }

    const validChannels = ['email', 'sms', 'whatsapp']
    if (!validChannels.includes(channel)) {
      console.error('[VERIFY_START] STEP 3 에러: 유효하지 않은 채널!', { channel })
      return NextResponse.json(
        { ok: false, error: 'INVALID_CHANNEL', message: '유효하지 않은 채널입니다.' },
        { status: 400 }
      )
    }
    console.log('[VERIFY_START] STEP 3 완료: 입력 유효성 검사 통과')

    // STEP 4: 동적 import 및 대상 정규화
    console.log('[VERIFY_START] STEP 4: 모듈 import 및 대상 정규화 시작')
    let normalizedTarget = target
    
    // 동적 import
    const { createAdminClient } = await import('@/lib/supabase/admin')
    const { toE164 } = await import('@/lib/phoneUtils')
    
    if (channel !== 'email') {
      try {
        normalizedTarget = toE164(target, nationality)
        if (!normalizedTarget.startsWith('+')) {
          console.error('[VERIFY_START] STEP 4 에러: 전화번호 정규화 실패 - E.164 형식이 아님!', { target, nationality, normalizedTarget })
          return NextResponse.json(
            { ok: false, error: 'INVALID_PHONE_NUMBER_FORMAT', message: '유효하지 않은 전화번호 형식입니다.' },
            { status: 400 }
          )
        }
        console.log('[VERIFY_START] STEP 4 완료: 전화번호 정규화 성공', { original: target, normalized: normalizedTarget })
      } catch (phoneError) {
        console.error('[VERIFY_START] STEP 4 에러: 전화번호 정규화 중 예외 발생!', { target, nationality, phoneError })
        return NextResponse.json(
          { ok: false, error: 'PHONE_NUMBER_NORMALIZATION_FAILED', message: '전화번호 정규화에 실패했습니다.' },
          { status: 400 }
        )
      }
    } else {
      normalizedTarget = target.toLowerCase() // 이메일은 소문자로 통일
      console.log('[VERIFY_START] STEP 4 완료: 이메일 정규화', { original: target, normalized: normalizedTarget })
    }

    // STEP 5: Rate Limit 확인
    console.log('[VERIFY_START] STEP 5: Rate Limit 확인 시작', { identifier: normalizedTarget, auth_type: channel })
    const supabaseAdmin = createAdminClient() // Admin 클라이언트 사용
    const { data: rateLimitCheck, error: rateLimitError } = await supabaseAdmin.rpc('check_auth_rate_limit', {
      p_identifier: normalizedTarget,
      p_auth_type: channel === 'whatsapp' ? 'sms' : channel, // whatsapp도 sms 타입으로 관리
    })

    if (rateLimitError) {
      console.error('[VERIFY_START] STEP 5 에러: Rate Limit RPC 호출 실패!', { rateLimitError })
      return NextResponse.json(
        { ok: false, error: 'RATE_LIMIT_CHECK_FAILED', message: '인증 시도 제한 확인에 실패했습니다.', detail: rateLimitError },
        { status: 500 }
      )
    }

    if (!rateLimitCheck) {
      console.warn('[VERIFY_START] STEP 5 경고: Rate Limit 초과!', { identifier: normalizedTarget, auth_type: channel })
      return NextResponse.json(
        { ok: false, error: 'TOO_MANY_REQUESTS', message: '너무 많은 요청을 보냈습니다. 잠시 후 다시 시도해주세요.' },
        { status: 429 }
      )
    }
    console.log('[VERIFY_START] STEP 5 완료: Rate Limit 확인 통과')

    // STEP 6: 인증코드 생성
    console.log('[VERIFY_START] STEP 6: 인증코드 생성 시작')
    const verificationCode = Math.floor(100000 + Math.random() * 900000).toString()
    const expiryMinutes = 5 // 5분으로 변경
    const expiresAt = new Date(Date.now() + expiryMinutes * 60 * 1000).toISOString()
    console.log('[VERIFY_START] STEP 6 완료: 인증코드 생성', { code: verificationCode, expiresAt })

    // STEP 7: 기존 인증코드 비활성화
    console.log('[VERIFY_START] STEP 7: 기존 인증코드 비활성화 시작')
    try {
      const { data: deactivateData, error: deactivateError } = await supabaseAdmin
        .from('verification_codes')
        .update({ verified: true }) // 이미 사용된 것으로 처리
        .eq(channel === 'email' ? 'email' : 'phone_number', normalizedTarget)
        .eq('type', channel === 'whatsapp' ? 'sms' : channel) // whatsapp도 sms 타입으로 관리
        .eq('verified', false)

      if (deactivateError) {
        console.error('[VERIFY_START] STEP 7 에러: 기존 인증코드 비활성화 실패!', { deactivateError })
        // 에러가 발생해도 계속 진행 (치명적이지 않다고 판단)
      } else {
        console.log('[VERIFY_START] STEP 7 완료: 기존 인증코드 비활성화 완료', { deactivateData })
      }
    } catch (deactivateException) {
      console.error('[VERIFY_START] STEP 7 예외: 기존 인증코드 비활성화 중 예외 발생!', { deactivateException })
    }

    // STEP 8: 새 인증코드 저장
    console.log('[VERIFY_START] STEP 8: 새 인증코드 저장 시작')
    let verificationData: any
    try {
      const { data, error: insertError } = await supabaseAdmin
        .from('verification_codes')
        .insert([{
          email: channel === 'email' ? normalizedTarget : null,
          phone_number: channel !== 'email' ? normalizedTarget : null,
          code: verificationCode,
          type: channel === 'whatsapp' ? 'sms' : channel, // whatsapp도 sms 타입으로 관리
          verified: false,
          expires_at: expiresAt,
          ip_address: request.ip || request.headers.get('x-forwarded-for') || '127.0.0.1',
          user_agent: request.headers.get('user-agent') || 'Unknown'
        }])
        .select()
        .single()

      if (insertError || !data) {
        const errorInfo = {
          error: insertError,
          message: insertError?.message,
          code: insertError?.code,
          details: insertError?.details,
          hint: insertError?.hint,
          channel,
          normalizedTarget
        }
        console.error('[VERIFY_START] STEP 8 에러: 인증코드 저장 실패!', errorInfo)
        return NextResponse.json(
          { ok: false, error: 'CODE_STORAGE_FAILED', message: '인증코드 저장에 실패했습니다.', detail: errorInfo },
          { status: 500 }
        )
      }
      verificationData = data
      console.log('[VERIFY_START] STEP 8 완료: 새 인증코드 저장 성공', { verificationId: verificationData.id })
    } catch (insertException) {
      const exceptionInfo = {
        type: insertException?.constructor?.name,
        message: insertException instanceof Error ? insertException.message : String(insertException),
        stack: insertException instanceof Error ? insertException.stack : 'N/A'
      }
      console.error('[VERIFY_START] STEP 8 예외: 인증코드 저장 중 예외 발생!', exceptionInfo)
      return NextResponse.json(
        { ok: false, error: 'CODE_STORAGE_EXCEPTION', message: '인증코드 저장 중 오류가 발생했습니다.', detail: exceptionInfo },
        { status: 500 }
      )
    }

    // STEP 9: 인증코드 발송
    console.log('[VERIFY_START] STEP 9: 인증코드 발송 시작', { channel })
    let sendSuccess = false
    let sendError: any = null

    // 동적 import for sending functions
    const { sendVerificationEmail } = await import('@/lib/emailService')
    const { sendVerificationSMS, sendVerificationWhatsApp } = await import('@/lib/smsService')

    if (channel === 'email') {
      console.log('[VERIFY_START] STEP 9: 이메일 발송 시도', { to: normalizedTarget })
      const emailSubject = purpose === 'passwordReset' ? '비밀번호 재설정 코드' : '인증 코드'
      const emailBody = `귀하의 Amiko 인증 코드는 ${verificationCode} 입니다. 5분 이내에 입력해주세요.`
      sendSuccess = await sendVerificationEmail(normalizedTarget, verificationCode, emailSubject, emailBody)
      if (!sendSuccess) {
        sendError = 'EMAIL_SEND_FAILED'
        console.error('[VERIFY_START] STEP 9 에러: 이메일 발송 실패!')
      } else {
        console.log('[VERIFY_START] STEP 9 완료: 이메일 발송 성공')
      }
    } else if (channel === 'sms') {
      console.log('[VERIFY_START] STEP 9: SMS 발송 시도', { to: normalizedTarget, nationality })
      const smsBody = `[Amiko] 인증코드: ${verificationCode}. 5분 이내에 입력해주세요.`
      sendSuccess = await sendVerificationSMS(normalizedTarget, verificationCode, nationality, smsBody)
      if (!sendSuccess) {
        sendError = 'SMS_SEND_FAILED'
        console.error('[VERIFY_START] STEP 9 에러: SMS 발송 실패!')
      } else {
        console.log('[VERIFY_START] STEP 9 완료: SMS 발송 성공')
      }
    } else if (channel === 'whatsapp') {
      console.log('[VERIFY_START] STEP 9: WhatsApp 발송 시도', { to: normalizedTarget, nationality })
      const language = normalizedTarget.startsWith('+82') ? 'ko' : 'es'
      console.log('[VERIFY_START] STEP 9: WhatsApp 언어 설정', { language, phoneNumber: normalizedTarget })
      sendSuccess = await sendVerificationWhatsApp(normalizedTarget, verificationCode, language)
      if (!sendSuccess) {
        sendError = 'WHATSAPP_SEND_FAILED'
        console.error('[VERIFY_START] STEP 9 에러: WhatsApp 발송 실패!')
      } else {
        console.log('[VERIFY_START] STEP 9 완료: WhatsApp 발송 성공')
      }
    }

    if (!sendSuccess) {
      console.error('[VERIFY_START] STEP 9 에러: 인증코드 발송 실패 (최종)!', { sendError })
      return NextResponse.json(
        { ok: false, error: sendError, message: '인증코드 발송에 실패했습니다.' },
        { status: 500 }
      )
    }
    console.log('[VERIFY_START] STEP 9 완료: 인증코드 발송 성공 (최종)')

    // STEP 10: 성공 응답
    console.log('[VERIFY_START] STEP 10: 성공 응답 반환')
    return NextResponse.json({ ok: true, message: '인증코드가 성공적으로 발송되었습니다.' }, { status: 200 })

  } catch (error) {
    // 최상위 catch - 모든 예외를 잡아야 함
    console.error('========================================')
    console.error('[VERIFY_START] ❌ 최상위 catch 블록: 예외 발생!')
    console.error('========================================')
    console.error('[VERIFY_START] 에러 타입:', error?.constructor?.name)
    console.error('[VERIFY_START] 에러 메시지:', error instanceof Error ? error.message : String(error))
    console.error('[VERIFY_START] 에러 스택:', error instanceof Error ? error.stack : 'N/A')
    console.error('[VERIFY_START] 에러 전체:', JSON.stringify(error, Object.getOwnPropertyNames(error), 2))

    return NextResponse.json(
      {
        ok: false,
        error: 'INTERNAL_SERVER_ERROR',
        message: '서버 오류가 발생했습니다.',
        detail: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : 'N/A'
      },
      { status: 500 }
    )
  }
}
