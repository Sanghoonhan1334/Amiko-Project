import { NextRequest, NextResponse } from 'next/server'

// 하이웍스 SMTP 다양한 설정 테스트 API
export async function POST(request: NextRequest) {
  try {
    console.log('🔍 [HIWORKS SMTP TEST] 다양한 설정 테스트 시작')
    
    const testConfigs = [
      {
        name: '설정 1: 포트 465 + SSL',
        config: {
          host: 'smtp.hiworks.com',
          port: 465,
          secure: true,
          auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS
          }
        }
      },
      {
        name: '설정 2: 포트 587 + TLS',
        config: {
          host: 'smtp.hiworks.com',
          port: 587,
          secure: false,
          requireTLS: true,
          auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS
          }
        }
      },
      {
        name: '설정 3: 포트 25 + 일반',
        config: {
          host: 'smtp.hiworks.com',
          port: 25,
          secure: false,
          auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS
          }
        }
      }
    ]
    
    const results = []
    
    for (const testConfig of testConfigs) {
      try {
        console.log(`🧪 [HIWORKS SMTP TEST] ${testConfig.name} 테스트 중...`)
        
        const nodemailer = await import('nodemailer')
        const transporter = nodemailer.default.createTransport(testConfig.config)
        
        const verifyResult = await transporter.verify()
        
        results.push({
          config: testConfig.name,
          success: true,
          message: '연결 성공',
          details: verifyResult
        })
        
        console.log(`✅ [HIWORKS SMTP TEST] ${testConfig.name} 성공`)
        
      } catch (error) {
        results.push({
          config: testConfig.name,
          success: false,
          message: error instanceof Error ? error.message : '알 수 없는 오류',
          details: testConfig.config
        })
        
        console.log(`❌ [HIWORKS SMTP TEST] ${testConfig.name} 실패:`, error instanceof Error ? error.message : '알 수 없는 오류')
      }
    }
    
    return NextResponse.json({
      success: true,
      message: '하이웍스 SMTP 설정 테스트 완료',
      data: {
        results,
        timestamp: new Date().toISOString()
      }
    })
    
  } catch (error) {
    console.error('❌ [HIWORKS SMTP TEST] 전체 테스트 실패:', error)
    
    return NextResponse.json(
      { 
        success: false, 
        error: '하이웍스 SMTP 테스트 실패',
        details: error instanceof Error ? error.message : '알 수 없는 오류'
      },
      { status: 500 }
    )
  }
}

export async function GET() {
  return POST(new NextRequest('http://localhost:3000/api/test-hiworks-smtp', { method: 'POST' }))
}
