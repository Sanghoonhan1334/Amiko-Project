import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'

export async function POST(request: NextRequest) {
  try {
    console.log('[TEST_EMAIL] 직접 이메일 테스트 시작')
    
    // Resend API 키 확인
    const resendApiKey = process.env.RESEND_API_KEY
    console.log('[TEST_EMAIL] RESEND_API_KEY 존재 여부:', !!resendApiKey)
    
    if (!resendApiKey) {
      console.error('[TEST_EMAIL] RESEND_API_KEY가 설정되지 않았습니다')
      return NextResponse.json(
        { error: 'Resend API 키가 설정되지 않았습니다' },
        { status: 500 }
      )
    }
    
    // Resend 클라이언트 초기화
    const resend = new Resend(resendApiKey)
    console.log('[TEST_EMAIL] Resend 클라이언트 초기화 완료')
    
    // 테스트 이메일 발송
    const { data, error } = await resend.emails.send({
      from: 'Amiko <noreply@helloamiko.com>',
      to: ['test@example.com'], // 실제 이메일 주소로 변경
      subject: '테스트 이메일',
      html: '<h1>이메일 발송 테스트</h1><p>이 메시지가 도착했다면 이메일 발송이 정상 작동합니다.</p>'
    })
    
    if (error) {
      console.error('[TEST_EMAIL] 이메일 발송 실패:', error)
      return NextResponse.json(
        { error: '이메일 발송 실패', details: error },
        { status: 500 }
      )
    }
    
    console.log('[TEST_EMAIL] 이메일 발송 성공:', data)
    return NextResponse.json({
      success: true,
      message: '이메일 발송 성공',
      emailId: data?.id
    })
    
  } catch (error) {
    console.error('[TEST_EMAIL] 에러 발생:', error)
    return NextResponse.json(
      { error: '서버 오류', details: error.message },
      { status: 500 }
    )
  }
}
