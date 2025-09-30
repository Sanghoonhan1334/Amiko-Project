import { NextRequest, NextResponse } from 'next/server'
import { sendVerificationEmail, getEmailServiceStatus } from '@/lib/emailService'

// 이메일 전송 테스트 API (디버깅용)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, testType = 'verification' } = body

    console.log('🧪 [EMAIL TEST] 이메일 테스트 시작:', { email, testType })

    // 입력 검증
    if (!email) {
      return NextResponse.json(
        { success: false, error: '이메일 주소가 필요합니다.' },
        { status: 400 }
      )
    }

    // 이메일 형식 검증
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { success: false, error: '올바른 이메일 형식이 아닙니다.' },
        { status: 400 }
      )
    }

    // 테스트용 인증코드 생성
    const testCode = Math.floor(100000 + Math.random() * 900000).toString()
    
    // 이메일 서비스 상태 확인
    const serviceStatus = getEmailServiceStatus()
    console.log('📧 [EMAIL TEST] 이메일 서비스 상태:', serviceStatus)

    // 환경 변수 직접 확인
    console.log('🔍 [EMAIL TEST] 환경 변수 직접 확인:')
    console.log('  NODE_ENV:', process.env.NODE_ENV)
    console.log('  SMTP_HOST:', process.env.SMTP_HOST)
    console.log('  SMTP_PORT:', process.env.SMTP_PORT)
    console.log('  SMTP_USER:', process.env.SMTP_USER)
    console.log('  SMTP_PASS:', process.env.SMTP_PASS ? '설정됨' : '미설정')
    console.log('  SMTP_FROM:', process.env.SMTP_FROM)

    // 이메일 전송
    console.log('📤 [EMAIL TEST] 이메일 전송 시도...')
    const sendResult = await sendVerificationEmail(email, testCode)
    
    console.log('📤 [EMAIL TEST] 이메일 전송 결과:', sendResult)

    if (sendResult) {
      return NextResponse.json({
        success: true,
        message: '이메일 테스트가 성공적으로 완료되었습니다.',
        data: {
          email,
          testCode,
          serviceStatus,
          environment: process.env.NODE_ENV,
          timestamp: new Date().toISOString()
        }
      })
    } else {
      return NextResponse.json(
        { 
          success: false, 
          error: '이메일 전송에 실패했습니다.',
          serviceStatus,
          debug: {
            smtpHost: process.env.SMTP_HOST,
            smtpPort: process.env.SMTP_PORT,
            smtpUser: process.env.SMTP_USER,
            smtpPassSet: !!process.env.SMTP_PASS,
            smtpFrom: process.env.SMTP_FROM
          }
        },
        { status: 500 }
      )
    }

  } catch (error) {
    console.error('❌ [EMAIL TEST] 이메일 테스트 오류:', error)
    
    return NextResponse.json(
      { 
        success: false, 
        error: '이메일 테스트 중 오류가 발생했습니다.',
        details: error instanceof Error ? error.message : '알 수 없는 오류',
        stack: error instanceof Error ? error.stack : undefined
      },
      { status: 500 }
    )
  }
}

// GET 메서드로 이메일 서비스 상태 확인
export async function GET() {
  try {
    const serviceStatus = getEmailServiceStatus()
    
    return NextResponse.json({
      success: true,
      message: '이메일 서비스 상태 확인',
      data: {
        ...serviceStatus,
        environment: process.env.NODE_ENV,
        timestamp: new Date().toISOString(),
        smtpConfig: {
          host: process.env.SMTP_HOST ? '설정됨' : '미설정',
          port: process.env.SMTP_PORT ? '설정됨' : '미설정',
          user: process.env.SMTP_USER ? '설정됨' : '미설정',
          from: process.env.SMTP_FROM ? '설정됨' : '미설정'
        }
      }
    })
    
  } catch (error) {
    console.error('❌ [EMAIL TEST] 서비스 상태 확인 오류:', error)
    
    return NextResponse.json(
      { 
        success: false, 
        error: '서비스 상태 확인 중 오류가 발생했습니다.',
        details: error instanceof Error ? error.message : '알 수 없는 오류'
      },
      { status: 500 }
    )
  }
}