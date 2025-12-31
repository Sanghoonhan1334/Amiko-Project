// 모듈 로딩 시점 로그 (가장 먼저 실행)
if (typeof console !== 'undefined') {
  console.log('[VERIFY_START] 🔥 모듈 로드 완료 - TOP LEVEL')
}

import { NextRequest, NextResponse } from 'next/server'

export const runtime = 'nodejs'

// OTP 전송 시작 API - 단계적 테스트 버전
export async function POST(request: NextRequest) {
  // 즉시 로그 출력 (함수 진입 확인용)
  if (typeof console !== 'undefined') {
    console.log('[VERIFY_START] ========================================')
    console.log('[VERIFY_START] STEP 1: 함수 진입 성공!')
    console.log('[VERIFY_START] Request URL:', request.url)
    console.log('[VERIFY_START] Request Method:', request.method)
    console.log('[VERIFY_START] ========================================')
  }

  try {
    // STEP 2: 요청 본문 파싱 (안전하게)
    if (typeof console !== 'undefined') {
      console.log('[VERIFY_START] STEP 2: 요청 본문 파싱 시작')
    }
    
    let body: any
    try {
      const text = await request.text()
      if (typeof console !== 'undefined') {
        console.log('[VERIFY_START] STEP 2: 요청 본문 텍스트 받음:', text?.substring(0, 100))
      }
      
      if (!text || text.trim() === '') {
        if (typeof console !== 'undefined') {
          console.error('[VERIFY_START] STEP 2 에러: 요청 본문이 비어있음')
        }
        return NextResponse.json(
          { ok: false, error: 'EMPTY_REQUEST_BODY', message: '요청 본문이 비어있습니다.' },
          { status: 400 }
        )
      }
      
      body = JSON.parse(text)
      if (typeof console !== 'undefined') {
        console.log('[VERIFY_START] STEP 2 완료:', { channel: body?.channel, target: body?.target?.substring(0, 5) + '...' })
      }
    } catch (jsonError) {
      if (typeof console !== 'undefined') {
        console.error('[VERIFY_START] STEP 2 에러: JSON 파싱 실패!', jsonError)
      }
      return NextResponse.json(
        { ok: false, error: 'INVALID_JSON', message: '요청 본문 형식이 올바르지 않습니다.', detail: jsonError instanceof Error ? jsonError.message : String(jsonError) },
        { status: 400 }
      )
    }

    let { channel, target, nationality } = body

    // STEP 3: 입력 유효성 검사
    if (!channel || !target) {
      if (typeof console !== 'undefined') {
        console.error('[VERIFY_START] STEP 3 에러: 필수 필드 누락!', { channel, target })
      }
      return NextResponse.json(
        { ok: false, error: 'MISSING_REQUIRED_FIELDS', message: '채널과 대상이 필요합니다.' },
        { status: 400 }
      )
    }

    // 채널 정규화 (wa -> whatsapp)
    if (channel === 'wa') {
      channel = 'whatsapp'
      if (typeof console !== 'undefined') {
        console.log('[VERIFY_START] STEP 3: 채널 정규화 (wa -> whatsapp)')
      }
    }

    if (channel !== 'whatsapp') {
      if (typeof console !== 'undefined') {
        console.error('[VERIFY_START] STEP 3 에러: 지원하지 않는 채널!', { channel })
      }
      return NextResponse.json(
        { ok: false, error: 'ONLY_WHATSAPP_SUPPORTED', message: '현재 WhatsApp만 테스트 중입니다.' },
        { status: 400 }
      )
    }

    if (typeof console !== 'undefined') {
      console.log('[VERIFY_START] STEP 3 완료: 입력 유효성 검사 통과', { channel, target: target?.substring(0, 10) + '...' })
    }

    // STEP 4: 전화번호 정규화 (간단 버전)
    if (typeof console !== 'undefined') {
      console.log('[VERIFY_START] STEP 4: 전화번호 정규화 시작')
    }
    let normalizedTarget = target
    try {
      const { toE164 } = await import('@/lib/phoneUtils')
      normalizedTarget = toE164(target, nationality)
      if (!normalizedTarget.startsWith('+')) {
        return NextResponse.json(
          { ok: false, error: 'INVALID_PHONE_NUMBER_FORMAT', message: '유효하지 않은 전화번호 형식입니다.' },
          { status: 400 }
        )
      }
      if (typeof console !== 'undefined') {
        console.log('[VERIFY_START] STEP 4 완료:', { original: target, normalized: normalizedTarget })
      }
    } catch (phoneError) {
      if (typeof console !== 'undefined') {
        console.error('[VERIFY_START] STEP 4 에러:', phoneError)
      }
      return NextResponse.json(
        { ok: false, error: 'PHONE_NUMBER_NORMALIZATION_FAILED', message: '전화번호 정규화에 실패했습니다.' },
        { status: 400 }
      )
    }

    // STEP 5: 인증코드 생성
    if (typeof console !== 'undefined') {
      console.log('[VERIFY_START] STEP 5: 인증코드 생성')
    }
    const verificationCode = Math.floor(100000 + Math.random() * 900000).toString()
    if (typeof console !== 'undefined') {
      console.log('[VERIFY_START] STEP 5 완료:', { code: verificationCode })
    }

    // STEP 6: WhatsApp 발송 (Twilio 호출만 테스트)
    if (typeof console !== 'undefined') {
      console.log('[VERIFY_START] STEP 6: WhatsApp 발송 시작')
      console.log('[VERIFY_START] 동적 import 시작...')
    }
    
    let sendSuccess = false
    try {
      const { sendVerificationWhatsApp } = await import('@/lib/smsService')
      if (typeof console !== 'undefined') {
        console.log('[VERIFY_START] sendVerificationWhatsApp import 성공')
      }
      
      const language = normalizedTarget.startsWith('+82') ? 'ko' : 'es'
      if (typeof console !== 'undefined') {
        console.log('[VERIFY_START] WhatsApp 발송 호출:', { to: normalizedTarget, code: verificationCode, language })
      }
      
      sendSuccess = await sendVerificationWhatsApp(normalizedTarget, verificationCode, language)
      if (typeof console !== 'undefined') {
        console.log('[VERIFY_START] WhatsApp 발송 결과:', sendSuccess)
      }
    } catch (sendError) {
      if (typeof console !== 'undefined') {
        console.error('[VERIFY_START] STEP 6 에러: WhatsApp 발송 중 예외 발생!', sendError)
      }
      return NextResponse.json(
        { 
          ok: false, 
          error: 'WHATSAPP_SEND_EXCEPTION', 
          message: 'WhatsApp 발송 중 오류가 발생했습니다.',
          detail: sendError instanceof Error ? sendError.message : String(sendError),
          stack: sendError instanceof Error ? sendError.stack : 'N/A'
        },
        { status: 500 }
      )
    }

    if (!sendSuccess) {
      if (typeof console !== 'undefined') {
        console.error('[VERIFY_START] STEP 6 에러: WhatsApp 발송 실패!')
      }
      return NextResponse.json(
        { ok: false, error: 'WHATSAPP_SEND_FAILED', message: 'WhatsApp 발송에 실패했습니다.' },
        { status: 500 }
      )
    }

    if (typeof console !== 'undefined') {
      console.log('[VERIFY_START] STEP 6 완료: WhatsApp 발송 성공')
    }

    // STEP 7: 성공 응답
    if (typeof console !== 'undefined') {
      console.log('[VERIFY_START] STEP 7: 성공 응답 반환')
    }
    return NextResponse.json({ 
      ok: true, 
      message: '인증코드가 성공적으로 발송되었습니다.',
      code: verificationCode // 테스트용 (나중에 제거)
    }, { status: 200 })

  } catch (error) {
    if (typeof console !== 'undefined') {
      console.error('========================================')
      console.error('[VERIFY_START] ❌ 최상위 catch 블록: 예외 발생!')
      console.error('========================================')
      console.error('[VERIFY_START] 에러 타입:', error?.constructor?.name)
      console.error('[VERIFY_START] 에러 메시지:', error instanceof Error ? error.message : String(error))
      console.error('[VERIFY_START] 에러 스택:', error instanceof Error ? error.stack : 'N/A')
    }

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
