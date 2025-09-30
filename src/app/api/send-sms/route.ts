import { NextRequest, NextResponse } from 'next/server'
import twilio from 'twilio'

// Twilio 클라이언트 초기화
const accountSid = process.env.TWILIO_ACCOUNT_SID
const authToken = process.env.TWILIO_AUTH_TOKEN
const twilioPhoneNumber = process.env.TWILIO_PHONE_NUMBER

const client = accountSid && authToken ? twilio(accountSid, authToken) : null

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { to, message } = body

    // 입력값 검증
    if (!to || !message) {
      return NextResponse.json(
        { success: false, error: '전화번호(to)와 메시지(message)가 필요합니다.' },
        { status: 400 }
      )
    }

    // Twilio 설정 확인
    if (!client || !twilioPhoneNumber) {
      console.error('Twilio 설정이 완료되지 않았습니다.')
      return NextResponse.json(
        { 
          success: false, 
          error: 'SMS 서비스가 설정되지 않았습니다.',
          debug: {
            hasClient: !!client,
            hasPhoneNumber: !!twilioPhoneNumber,
            accountSidSet: !!accountSid,
            authTokenSet: !!authToken
          }
        },
        { status: 500 }
      )
    }

    // 전화번호 형식 검증 및 정규화
    const normalizedPhone = normalizePhoneNumber(to)
    
    console.log(`[SMS_SEND] 발송 시도: ${normalizedPhone}`)
    console.log(`[SMS_SEND] 메시지: ${message}`)

    // Twilio로 SMS 발송
    const result = await client.messages.create({
      body: message,
      from: twilioPhoneNumber,
      to: normalizedPhone
    })

    console.log(`✅ SMS 발송 성공: ${result.sid}`)
    console.log(`📱 상태: ${result.status}`)

    return NextResponse.json({
      success: true,
      message: 'SMS가 성공적으로 발송되었습니다.',
      data: {
        sid: result.sid,
        status: result.status,
        to: normalizedPhone,
        from: twilioPhoneNumber,
        message: message,
        timestamp: new Date().toISOString()
      }
    })

  } catch (error) {
    console.error('❌ SMS 발송 오류:', error)
    
    // Twilio 오류 상세 정보
    if (error instanceof Error) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'SMS 발송에 실패했습니다.',
          details: error.message,
          timestamp: new Date().toISOString()
        },
        { status: 500 }
      )
    }

    return NextResponse.json(
      { 
        success: false, 
        error: '알 수 없는 오류가 발생했습니다.',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    )
  }
}

// 전화번호 정규화 함수
function normalizePhoneNumber(phone: string): string {
  // 공백과 특수문자 제거
  let cleaned = phone.replace(/[\s\-\(\)]/g, '')
  
  // +로 시작하지 않으면 국가 코드 추가
  if (!cleaned.startsWith('+')) {
    // 한국 번호인 경우 +82 추가
    if (cleaned.startsWith('010') || cleaned.startsWith('011') || cleaned.startsWith('016') || cleaned.startsWith('017') || cleaned.startsWith('018') || cleaned.startsWith('019')) {
      cleaned = '+82' + cleaned.substring(1) // 0 제거하고 +82 추가
    } else {
      // 다른 국가는 +1 (미국)로 가정
      cleaned = '+1' + cleaned
    }
  }
  
  return cleaned
}

// GET 요청으로 설정 상태 확인
export async function GET() {
  return NextResponse.json({
    success: true,
    message: 'SMS 서비스 상태 확인',
    data: {
      twilioConfigured: !!(accountSid && authToken && twilioPhoneNumber),
      accountSidSet: !!accountSid,
      authTokenSet: !!authToken,
      phoneNumberSet: !!twilioPhoneNumber,
      environment: process.env.NODE_ENV
    }
  })
}
