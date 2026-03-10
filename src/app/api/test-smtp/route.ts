import { NextRequest, NextResponse } from 'next/server'

// SMTP 연결 테스트 API
export async function POST(request: NextRequest) {
  // 프로덕션에서 완전 차단 (테스트/디버그 엔드포인트)
  if (process.env.NODE_ENV !== 'development') {
    return new (require('next/server').NextResponse)(null, { status: 404 })
  }


  try {
    console.log('🔍 [SMTP TEST] SMTP 연결 테스트 시작')
    
    // 환경 변수 확인
    const smtpConfig = {
      host: process.env.SMTP_HOST || 'smtp.hiworks.com',
      port: parseInt(process.env.SMTP_PORT || '465'),
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      }
    }
    
    console.log('📧 [SMTP TEST] SMTP 설정:', {
      host: smtpConfig.host,
      port: smtpConfig.port,
      secure: smtpConfig.secure,
      user: smtpConfig.auth.user,
      passSet: !!smtpConfig.auth.pass
    })
    
    // nodemailer 동적 import
    const nodemailer = await import('nodemailer')
    console.log('✅ [SMTP TEST] nodemailer 모듈 로드 성공')
    
    // transporter 생성
    const transporter = nodemailer.default.createTransport(smtpConfig)
    console.log('✅ [SMTP TEST] transporter 생성 성공')
    
    // 연결 테스트
    console.log('🔗 [SMTP TEST] SMTP 서버 연결 테스트...')
    const verifyResult = await transporter.verify()
    console.log('✅ [SMTP TEST] SMTP 서버 연결 성공:', verifyResult)
    
    return NextResponse.json({
      success: true,
      message: 'SMTP 연결 테스트 성공',
      data: {
        smtpConfig: {
          host: smtpConfig.host,
          port: smtpConfig.port,
          secure: smtpConfig.secure,
          user: smtpConfig.auth.user
        },
        verifyResult,
        timestamp: new Date().toISOString()
      }
    })
    
  } catch (error) {
    console.error('❌ [SMTP TEST] SMTP 연결 테스트 실패:', error)
    
    return NextResponse.json(
      { 
        success: false, 
        error: 'SMTP 연결 테스트 실패',
        details: error instanceof Error ? error.message : '알 수 없는 오류',
        stack: error instanceof Error ? error.stack : undefined
      },
      { status: 500 }
    )
  }
}

export async function GET() {
  return POST(new NextRequest('http://localhost:3000/api/test-smtp', { method: 'POST' }))
}
