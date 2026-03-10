import { NextRequest, NextResponse } from 'next/server'
import { verifyTwilioAccount, calculateSMSCost } from '@/lib/twilioService'

export async function GET() {
  // 프로덕션에서 완전 차단 (테스트/디버그 엔드포인트)
  if (process.env.NODE_ENV !== 'development') {
    return new (require('next/server').NextResponse)(null, { status: 404 })
  }


  try {
    // Twilio 계정 정보 확인
    const accountInfo = await verifyTwilioAccount()
    
    if (!accountInfo.isValid) {
      return NextResponse.json({
        success: false,
        error: 'Twilio 계정 설정이 필요합니다.',
        details: accountInfo.error,
        setupGuide: {
          step1: 'Twilio 계정 생성: https://console.twilio.com/',
          step2: '계정에서 Account SID와 Auth Token 확인',
          step3: '.env.local에 TWILIO_ACCOUNT_SID와 TWILIO_AUTH_TOKEN 설정',
          step4: '발신번호 구매 후 TWILIO_PHONE_NUMBER 설정',
          pricing: 'SMS: $0.0075/건, WhatsApp: $0.005/건'
        }
      }, { status: 400 })
    }

    return NextResponse.json({
      success: true,
      message: 'Twilio 계정이 올바르게 설정되었습니다.',
      data: {
        accountSid: accountInfo.accountSid,
        phoneNumber: accountInfo.phoneNumber,
        phoneNumbers: accountInfo.phoneNumbers || [], // 등록된 모든 번호 목록
        balance: accountInfo.balance,
        pricing: {
          sms: calculateSMSCost('KR'),
          whatsapp: 0.005
        },
        note: accountInfo.phoneNumbers && accountInfo.phoneNumbers.length > 0 
          ? `계정에 ${accountInfo.phoneNumbers.length}개의 번호가 등록되어 있습니다.`
          : '계정에 등록된 번호가 없습니다.'
      }
    })

  } catch (error) {
    console.error('[TWILIO_TEST] 오류:', error)
    return NextResponse.json({
      success: false,
      error: 'Twilio 계정 확인 중 오류가 발생했습니다.',
      details: error instanceof Error ? error.message : '알 수 없는 오류'
    }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { phoneNumber, method = 'sms' } = body

    if (!phoneNumber) {
      return NextResponse.json(
        { error: '전화번호가 필요합니다.' },
        { status: 400 }
      )
    }

    // Twilio 계정 확인
    const accountInfo = await verifyTwilioAccount()
    if (!accountInfo.isValid) {
      return NextResponse.json({
        error: 'Twilio 계정이 설정되지 않았습니다.',
        setupRequired: true
      }, { status: 400 })
    }

    // 6자리 인증코드 생성
    const verificationCode = Math.floor(100000 + Math.random() * 900000).toString()
    
    console.log(`\n🧪 [TWILIO_TEST] ${method.toUpperCase()} 테스트 시작`)
    console.log(`📱 전화번호: ${phoneNumber}`)
    console.log(`🔢 인증코드: ${verificationCode}`)

    // 실제 Twilio 발송
    let success = false
    if (method === 'whatsapp') {
      const { sendTwilioWhatsApp, formatPhoneNumber } = await import('@/lib/twilioService')
      const formattedNumber = formatPhoneNumber(phoneNumber)
      success = await sendTwilioWhatsApp(formattedNumber, `[AMIKO] 인증코드: ${verificationCode}\n이 코드는 5분 후에 만료됩니다.`)
    } else {
      const { sendTwilioSMS, formatPhoneNumber } = await import('@/lib/twilioService')
      const formattedNumber = formatPhoneNumber(phoneNumber)
      success = await sendTwilioSMS(formattedNumber, `[AMIKO] 인증코드: ${verificationCode}\n이 코드는 5분 후에 만료됩니다.`)
    }

    if (!success) {
      return NextResponse.json(
        { error: `Twilio ${method.toUpperCase()} 발송에 실패했습니다.` },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: `Twilio ${method.toUpperCase()} 테스트 발송 완료`,
      data: {
        phoneNumber,
        verificationCode,
        method,
        accountInfo,
        timestamp: new Date().toISOString()
      }
    })

  } catch (error) {
    console.error('[TWILIO_TEST] 오류:', error)
    return NextResponse.json(
      { error: 'Twilio 테스트 중 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}
