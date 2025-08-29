import { NextResponse } from 'next/server'
import { emailService } from '@/lib/email-service'

// 이메일 발송 API
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

    // 환경 변수 확인
    if (!process.env.RESEND_API_KEY) {
      console.error('[EMAIL API] RESEND_API_KEY가 설정되지 않음')
      return NextResponse.json(
        { success: false, error: 'RESEND_API_KEY가 설정되지 않았습니다.' },
        { status: 500 }
      )
    }

    console.log('[EMAIL API] 이메일 서비스 호출 시작')
    // 이메일 발송
    const result = await emailService.sendNotificationEmail(to, type, data)
    console.log('[EMAIL API] 이메일 서비스 결과:', result)

    if (result.success) {
      return NextResponse.json({
        success: true,
        messageId: result.messageId,
        message: '이메일이 성공적으로 발송되었습니다.'
      })
    } else {
      return NextResponse.json(
        { success: false, error: result.error },
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
