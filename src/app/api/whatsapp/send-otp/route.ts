import { NextRequest, NextResponse } from 'next/server'
import { Twilio } from 'twilio'

// Edge 런타임 문제 방지
export const runtime = 'nodejs'

/**
 * WhatsApp OTP 전송 API
 * 
 * Twilio WhatsApp Authentication Template을 사용하여 OTP 코드를 전송합니다.
 * 
 * 요청 본문:
 * - phoneNumber: E.164 형식 전화번호 (예: +821012345678)
 * - otp: 6자리 인증코드
 * 
 * 환경 변수:
 * - TWILIO_ACCOUNT_SID: Twilio 계정 SID (필수)
 * - TWILIO_AUTH_TOKEN: Twilio 인증 토큰 (필수)
 * - TWILIO_WHATSAPP_FROM: WhatsApp 발신 번호 (필수, 예: whatsapp:+1234567890 또는 +1234567890)
 * - TWILIO_WHATSAPP_TEMPLATE_SID: WhatsApp 템플릿 SID (필수, 템플릿 승인 후 Twilio 콘솔에서 확인)
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { phoneNumber, otp } = body

    // 입력 검증
    if (!phoneNumber) {
      return NextResponse.json(
        { success: false, error: '전화번호가 필요합니다.' },
        { status: 400 }
      )
    }

    if (!otp) {
      return NextResponse.json(
        { success: false, error: 'OTP 코드가 필요합니다.' },
        { status: 400 }
      )
    }

    // OTP 형식 검증 (6자리 숫자)
    if (!/^\d{6}$/.test(otp)) {
      return NextResponse.json(
        { success: false, error: 'OTP 코드는 6자리 숫자여야 합니다.' },
        { status: 400 }
      )
    }

    // Twilio 환경 변수 확인
    const accountSid = process.env.TWILIO_ACCOUNT_SID
    const authToken = process.env.TWILIO_AUTH_TOKEN
    // TWILIO_WHATSAPP_NUMBER 또는 TWILIO_WHATSAPP_FROM 지원 (하위 호환성)
    const whatsappNumber = process.env.TWILIO_WHATSAPP_NUMBER || process.env.TWILIO_WHATSAPP_FROM
    const templateSid = process.env.TWILIO_WHATSAPP_TEMPLATE_SID

    if (!accountSid || !authToken) {
      console.error('[WHATSAPP_OTP] Twilio 계정 정보가 설정되지 않았습니다.')
      return NextResponse.json(
        { 
          success: false, 
          error: 'Twilio 계정이 설정되지 않았습니다.',
          details: 'TWILIO_ACCOUNT_SID와 TWILIO_AUTH_TOKEN을 환경변수에 설정해주세요.'
        },
        { status: 500 }
      )
    }

    if (!whatsappNumber) {
      console.error('[WHATSAPP_OTP] WhatsApp 발신 번호가 설정되지 않았습니다.')
      return NextResponse.json(
        { 
          success: false, 
          error: 'WhatsApp 발신 번호가 설정되지 않았습니다.',
          details: 'TWILIO_WHATSAPP_NUMBER 또는 TWILIO_WHATSAPP_FROM을 환경변수에 설정해주세요.'
        },
        { status: 500 }
      )
    }

    // 전화번호 형식 정규화 (E.164 형식)
    const normalizedPhone = phoneNumber.startsWith('+') 
      ? phoneNumber 
      : `+${phoneNumber.replace(/\D/g, '')}`
    
    // WhatsApp 형식으로 변환
    const whatsappTo = normalizedPhone.startsWith('whatsapp:')
      ? normalizedPhone
      : `whatsapp:${normalizedPhone}`

    // WhatsApp 발신 번호 형식 확인
    const whatsappFrom = whatsappNumber.startsWith('whatsapp:')
      ? whatsappNumber
      : `whatsapp:${whatsappNumber}`

    // Twilio 클라이언트 초기화
    const client = new Twilio(accountSid, authToken)

    console.log('[WHATSAPP_OTP] ========================================')
    console.log('[WHATSAPP_OTP] OTP 전송 시작')
    console.log('[WHATSAPP_OTP] 받는 번호:', whatsappTo)
    console.log('[WHATSAPP_OTP] OTP 코드:', otp)
    console.log('[WHATSAPP_OTP] 발신 번호:', whatsappFrom)
    console.log('[WHATSAPP_OTP] 템플릿 SID:', templateSid || '없음 (일반 메시지 사용)')

    // WhatsApp 메시지 전송 옵션 설정
    let messageOptions: any = {
      from: whatsappFrom,
      to: whatsappTo,
    }

    // 템플릿 SID가 있으면 템플릿 사용, 없으면 일반 메시지 사용
    if (templateSid) {
      // WhatsApp Authentication 템플릿을 사용한 전송
      messageOptions.contentSid = templateSid
      
      // Authentication 템플릿의 경우 OTP 코드를 contentVariables로 전달해야 합니다
      // 변수 이름은 템플릿에 정의된 변수 이름과 일치해야 합니다
      // 일반적으로 Authentication 템플릿은 "1" 또는 "code" 같은 변수 이름을 사용합니다
      messageOptions.contentVariables = JSON.stringify({
        '1': otp  // 첫 번째 변수로 OTP 코드 전달
      })
      
      console.log('[WHATSAPP_OTP] 템플릿 모드 사용 (Authentication 템플릿)')
      console.log('[WHATSAPP_OTP] contentSid:', templateSid)
      console.log('[WHATSAPP_OTP] contentVariables:', messageOptions.contentVariables)
    } else {
      // 템플릿이 승인되기 전 또는 템플릿 SID가 없을 때 일반 메시지 사용
      messageOptions.body = `[Amiko] 인증코드: ${otp}\n이 코드는 10분 후에 만료됩니다.\n타인에게 공유하지 마세요.`
      console.log('[WHATSAPP_OTP] 일반 메시지 모드 사용 (템플릿 SID 없음)')
      console.warn('[WHATSAPP_OTP] 템플릿이 승인되면 TWILIO_WHATSAPP_TEMPLATE_SID를 설정하여 템플릿을 사용하세요.')
    }

    // 전송 전 최종 확인 로그
    console.log('[WHATSAPP_OTP] 전송 요청 파라미터:', {
      from: messageOptions.from,
      to: messageOptions.to,
      contentSid: messageOptions.contentSid || '없음',
      contentVariables: messageOptions.contentVariables || '없음',
      body: messageOptions.body || '없음'
    })

    const result = await client.messages.create(messageOptions)

    console.log('[WHATSAPP_OTP] 전송 성공')
    console.log('[WHATSAPP_OTP] 메시지 SID:', result.sid)
    console.log('[WHATSAPP_OTP] 상태:', result.status)
    console.log('[WHATSAPP_OTP] 에러 코드:', result.errorCode)
    console.log('[WHATSAPP_OTP] 에러 메시지:', result.errorMessage)
    console.log('[WHATSAPP_OTP] 발신 번호:', result.from)
    console.log('[WHATSAPP_OTP] 수신 번호:', result.to)
    console.log('[WHATSAPP_OTP] ========================================')

    // 메시지 상태 확인 (추가 디버깅 정보)
    if (result.errorCode || result.errorMessage) {
      console.warn('[WHATSAPP_OTP] ⚠️  경고: 메시지에 에러 정보가 포함되어 있습니다.')
      console.warn('[WHATSAPP_OTP] 에러 코드:', result.errorCode)
      console.warn('[WHATSAPP_OTP] 에러 메시지:', result.errorMessage)
    }

    return NextResponse.json({
      success: true,
      messageSid: result.sid,
      status: result.status,
      errorCode: result.errorCode || null,
      errorMessage: result.errorMessage || null,
      from: result.from,
      to: result.to,
      // 메시지 상태 확인 URL 제공
      checkStatus: `https://console.twilio.com/us1/monitor/logs/messages/${result.sid}`
    })

  } catch (error: any) {
    console.error('[WHATSAPP_OTP] ========================================')
    console.error('[WHATSAPP_OTP] 전송 실패')
    console.error('[WHATSAPP_OTP] 에러 타입:', error?.constructor?.name)
    console.error('[WHATSAPP_OTP] 에러 코드:', error?.code)
    console.error('[WHATSAPP_OTP] 에러 메시지:', error?.message)
    
    // Twilio 에러 상세 정보
    if (error?.code) {
      console.error('[WHATSAPP_OTP] Twilio 에러 상세:', {
        code: error.code,
        status: error.status,
        moreInfo: error.moreInfo,
        message: error.message
      })

      // 일반적인 에러 코드에 대한 안내
      if (error.code === 21211) {
        console.error('[WHATSAPP_OTP] 잘못된 전화번호 형식입니다.')
      } else if (error.code === 21608) {
        console.error('[WHATSAPP_OTP] WhatsApp 발신 번호가 등록되지 않았습니다.')
      } else if (error.code === 63007) {
        console.error('[WHATSAPP_OTP] WhatsApp 템플릿이 승인되지 않았거나 찾을 수 없습니다.')
      } else if (error.code === 20422) {
        console.error('[WHATSAPP_OTP] 잘못된 파라미터입니다.')
        console.error('[WHATSAPP_OTP] 가능한 원인:')
        console.error('[WHATSAPP_OTP] 1. contentSid가 잘못되었거나 템플릿이 승인되지 않음')
        console.error('[WHATSAPP_OTP] 2. contentVariables 형식이 잘못됨')
        console.error('[WHATSAPP_OTP] 3. 템플릿 변수 이름이 일치하지 않음')
        console.error('[WHATSAPP_OTP] 해결 방법:')
        console.error('[WHATSAPP_OTP] - Twilio 콘솔에서 템플릿 상태 확인')
        console.error('[WHATSAPP_OTP] - 템플릿에 정의된 변수 이름 확인')
        console.error('[WHATSAPP_OTP] - contentVariables 형식 확인')
      }
    }
    
    console.error('[WHATSAPP_OTP] ========================================')

    return NextResponse.json(
      { 
        success: false, 
        error: 'WhatsApp OTP 전송에 실패했습니다.',
        details: error?.message || '알 수 없는 오류가 발생했습니다.',
        code: error?.code
      },
      { status: 500 }
    )
  }
}

