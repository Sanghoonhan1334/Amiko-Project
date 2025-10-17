import { NextResponse } from 'next/server'
import { sendVerificationEmail } from '@/lib/emailService'

// 이메일 발송 API (하이웍스 SMTP 사용)
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { to, type, data } = body

    console.log('[EMAIL API] 요청 받음:', { to, type, data })

    // 유효성 검사
    if (!to || !type) {
      return NextResponse.json(
        { success: false, error: '수신자 이메일과 알림 타입이 필요합니다.' },
        { status: 400 }
      )
    }

    console.log('[EMAIL API] 하이웍스 SMTP 이메일 발송 시작')
    
    // 간단한 이메일 발송 (하이웍스 SMTP 사용)
    const success = await sendVerificationEmail(to, data?.code || '123456')
    
    if (success) {
      return NextResponse.json({
        success: true,
        message: '이메일이 성공적으로 발송되었습니다.'
      })
    } else {
      return NextResponse.json(
        { success: false, error: '이메일 발송에 실패했습니다.' },
        { status: 500 }
      )
    }

  } catch (error) {
    console.error('이메일 발송 실패:', error)
    return NextResponse.json(
      { success: false, error: '이메일 발송에 실패했습니다.' },
      { status: 500 }
    )
  }
}
