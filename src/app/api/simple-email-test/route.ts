import { NextRequest, NextResponse } from 'next/server'

// 간단한 하이웍스 이메일 발송 테스트
export async function POST(request: NextRequest) {
  try {
    console.log('🧪 [SIMPLE EMAIL TEST] 간단한 이메일 발송 테스트 시작')
    
    const { to = 'admin@helloamiko.com' } = await request.json()
    
    // nodemailer 직접 사용
    const nodemailer = await import('nodemailer')
    
    const transporter = nodemailer.default.createTransport({
      host: 'smtps.hiworks.com',
      port: 465,
      secure: true,
      auth: {
        user: 'info@helloamiko.com',
        pass: 'JXEa1cD3g6vFsoA666Qa'
      }
    })
    
    console.log('📧 [SIMPLE EMAIL TEST] transporter 생성 완료')
    
    // 연결 테스트
    const verifyResult = await transporter.verify()
    console.log('✅ [SIMPLE EMAIL TEST] SMTP 연결 확인:', verifyResult)
    
    // 실제 이메일 발송
    const mailOptions = {
      from: 'Amiko <info@helloamiko.com>',
      to: to,
      subject: '[테스트] 하이웍스 SMTP 이메일 발송 테스트',
      html: `
        <h2>🎉 하이웍스 SMTP 테스트 성공!</h2>
        <p>이 이메일은 하이웍스 SMTP를 통해 성공적으로 발송되었습니다.</p>
        <p><strong>발송 시간:</strong> ${new Date().toLocaleString('ko-KR')}</p>
        <hr>
        <p>Amiko 이메일 서비스가 정상적으로 작동합니다! 🚀</p>
      `,
      text: `
하이웍스 SMTP 테스트 성공!

이 이메일은 하이웍스 SMTP를 통해 성공적으로 발송되었습니다.

발송 시간: ${new Date().toLocaleString('ko-KR')}

Amiko 이메일 서비스가 정상적으로 작동합니다! 🚀
      `
    }
    
    console.log('📤 [SIMPLE EMAIL TEST] 이메일 발송 시도...')
    const sendResult = await transporter.sendMail(mailOptions)
    console.log('✅ [SIMPLE EMAIL TEST] 이메일 발송 성공!', sendResult.messageId)
    
    return NextResponse.json({
      success: true,
      message: '하이웍스 SMTP 이메일 발송 성공!',
      data: {
        messageId: sendResult.messageId,
        to: to,
        timestamp: new Date().toISOString()
      }
    })
    
  } catch (error) {
    console.error('❌ [SIMPLE EMAIL TEST] 이메일 발송 실패:', error)
    
    return NextResponse.json(
      { 
        success: false, 
        error: '이메일 발송 실패',
        details: error instanceof Error ? error.message : '알 수 없는 오류',
        stack: error instanceof Error ? error.stack : undefined
      },
      { status: 500 }
    )
  }
}

export async function GET() {
  return POST(new NextRequest('http://localhost:3000/api/simple-email-test', { method: 'POST' }))
}
