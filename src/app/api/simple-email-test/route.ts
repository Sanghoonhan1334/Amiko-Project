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
      from: 'info@helloamiko.com',
      to: to,
      subject: '[테스트] 하이웍스 SMTP 이메일 발송 테스트',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
            <h2 style="color: #28a745; margin: 0;">✅ 이메일 서비스 테스트</h2>
          </div>
          
          <p>안녕하세요!</p>
          <p>이 이메일은 Amiko 서비스의 이메일 발송 기능을 테스트하기 위해 발송되었습니다.</p>
          
          <div style="background: #e9ecef; padding: 15px; border-radius: 5px; margin: 20px 0;">
            <p style="margin: 0;"><strong>발송 시간:</strong> ${new Date().toLocaleString('ko-KR')}</p>
            <p style="margin: 5px 0 0 0;"><strong>발송 서비스:</strong> 하이웍스 SMTP</p>
          </div>
          
          <p>이 이메일이 정상적으로 도착했다면 Amiko 이메일 서비스가 올바르게 작동하고 있습니다.</p>
          
          <hr style="margin: 30px 0; border: none; border-top: 1px solid #dee2e6;">
          
          <p style="color: #6c757d; font-size: 14px;">
            이 이메일은 테스트 목적으로 발송되었습니다.<br>
            문의사항이 있으시면 고객센터로 연락해주세요.
          </p>
        </div>
      `,
      text: `
이메일 서비스 테스트

안녕하세요!

이 이메일은 Amiko 서비스의 이메일 발송 기능을 테스트하기 위해 발송되었습니다.

발송 시간: ${new Date().toLocaleString('ko-KR')}
발송 서비스: 하이웍스 SMTP

이 이메일이 정상적으로 도착했다면 Amiko 이메일 서비스가 올바르게 작동하고 있습니다.

---

이 이메일은 테스트 목적으로 발송되었습니다.
문의사항이 있으시면 고객센터로 연락해주세요.

Amiko 서비스팀
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
