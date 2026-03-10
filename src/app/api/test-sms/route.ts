import { NextRequest, NextResponse } from 'next/server'
import { sendVerificationSMS, getSMSServiceStatus } from '@/lib/smsService'

export async function POST(request: NextRequest) {
  // 프로덕션에서 완전 차단 (테스트/디버그 엔드포인트)
  if (process.env.NODE_ENV !== 'development') {
    return new (require('next/server').NextResponse)(null, { status: 404 })
  }


  try {
    const body = await request.json()
    const { phoneNumber, method = 'sms' } = body

    if (!phoneNumber) {
      return NextResponse.json(
        { error: '전화번호가 필요합니다.' },
        { status: 400 }
      )
    }

    // 6자리 인증코드 생성
    const verificationCode = Math.floor(100000 + Math.random() * 900000).toString()
    
    console.log(`\n🧪 [SMS_TEST] ${method.toUpperCase()} 테스트 시작`)
    console.log(`📱 전화번호: ${phoneNumber}`)
    console.log(`🔢 인증코드: ${verificationCode}`)

    // SMS 발송 테스트
    const smsSent = await sendVerificationSMS(phoneNumber, verificationCode, 'ko')
    
    if (!smsSent) {
      return NextResponse.json(
        { error: `${method === 'whatsapp' ? 'WhatsApp' : 'SMS'} 발송에 실패했습니다.` },
        { status: 500 }
      )
    }

    const serviceStatus = getSMSServiceStatus()

    return NextResponse.json({
      success: true,
      message: `${method === 'whatsapp' ? 'WhatsApp' : 'SMS'} 테스트 발송 완료`,
      data: {
        phoneNumber,
        verificationCode,
        method,
        serviceStatus,
        timestamp: new Date().toISOString()
      }
    })

  } catch (error) {
    console.error('[SMS_TEST] 오류:', error)
    return NextResponse.json(
      { error: 'SMS 테스트 중 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}

export async function GET() {
  const serviceStatus = getSMSServiceStatus()
  
  return NextResponse.json({
    success: true,
    data: serviceStatus
  })
}
