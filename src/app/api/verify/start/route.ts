// 모듈 로딩 시점 로그 (가장 먼저 실행)
console.log('[VERIFY_START] 🔥 모듈 로드 완료 - TOP LEVEL')

import { NextRequest, NextResponse } from 'next/server'

export const runtime = 'nodejs'

// OTP 전송 시작 API - 단계적 테스트 버전
export async function POST(request: NextRequest) {
  console.log('[VERIFY_START] ========================================')
  console.log('[VERIFY_START] STEP 1: 함수 진입')
  console.log('[VERIFY_START] ========================================')

  try {
    // STEP 2: 요청 본문 파싱
    console.log('[VERIFY_START] STEP 2: 요청 본문 파싱 시작')
    const body = await request.json()
    console.log('[VERIFY_START] STEP 2 완료:', { channel: body.channel, target: body.target?.substring(0, 5) + '...' })

    const { channel, target, nationality } = body

    // STEP 3: 입력 유효성 검사
    if (!channel || !target) {
      return NextResponse.json(
        { ok: false, error: 'MISSING_REQUIRED_FIELDS', message: '채널과 대상이 필요합니다.' },
        { status: 400 }
      )
    }

    if (channel !== 'whatsapp') {
      return NextResponse.json(
        { ok: false, error: 'ONLY_WHATSAPP_SUPPORTED', message: '현재 WhatsApp만 테스트 중입니다.' },
        { status: 400 }
      )
    }

    // STEP 4: 전화번호 정규화 (간단 버전)
    console.log('[VERIFY_START] STEP 4: 전화번호 정규화 시작')
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
      console.log('[VERIFY_START] STEP 4 완료:', { original: target, normalized: normalizedTarget })
    } catch (phoneError) {
      console.error('[VERIFY_START] STEP 4 에러:', phoneError)
      return NextResponse.json(
        { ok: false, error: 'PHONE_NUMBER_NORMALIZATION_FAILED', message: '전화번호 정규화에 실패했습니다.' },
        { status: 400 }
      )
    }

    // STEP 5: 인증코드 생성
    console.log('[VERIFY_START] STEP 5: 인증코드 생성')
    const verificationCode = Math.floor(100000 + Math.random() * 900000).toString()
    console.log('[VERIFY_START] STEP 5 완료:', { code: verificationCode })

    // STEP 6: WhatsApp 발송 (Twilio 호출만 테스트)
    console.log('[VERIFY_START] STEP 6: WhatsApp 발송 시작')
    console.log('[VERIFY_START] 동적 import 시작...')
    
    let sendSuccess = false
    try {
      const { sendVerificationWhatsApp } = await import('@/lib/smsService')
      console.log('[VERIFY_START] sendVerificationWhatsApp import 성공')
      
      const language = normalizedTarget.startsWith('+82') ? 'ko' : 'es'
      console.log('[VERIFY_START] WhatsApp 발송 호출:', { to: normalizedTarget, code: verificationCode, language })
      
      sendSuccess = await sendVerificationWhatsApp(normalizedTarget, verificationCode, language)
      console.log('[VERIFY_START] WhatsApp 발송 결과:', sendSuccess)
    } catch (sendError) {
      console.error('[VERIFY_START] STEP 6 에러: WhatsApp 발송 중 예외 발생!', sendError)
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
      console.error('[VERIFY_START] STEP 6 에러: WhatsApp 발송 실패!')
      return NextResponse.json(
        { ok: false, error: 'WHATSAPP_SEND_FAILED', message: 'WhatsApp 발송에 실패했습니다.' },
        { status: 500 }
      )
    }

    console.log('[VERIFY_START] STEP 6 완료: WhatsApp 발송 성공')

    // STEP 7: 성공 응답
    console.log('[VERIFY_START] STEP 7: 성공 응답 반환')
    return NextResponse.json({ 
      ok: true, 
      message: '인증코드가 성공적으로 발송되었습니다.',
      code: verificationCode // 테스트용 (나중에 제거)
    }, { status: 200 })

  } catch (error) {
    console.error('========================================')
    console.error('[VERIFY_START] ❌ 최상위 catch 블록: 예외 발생!')
    console.error('========================================')
    console.error('[VERIFY_START] 에러 타입:', error?.constructor?.name)
    console.error('[VERIFY_START] 에러 메시지:', error instanceof Error ? error.message : String(error))
    console.error('[VERIFY_START] 에러 스택:', error instanceof Error ? error.stack : 'N/A')

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
