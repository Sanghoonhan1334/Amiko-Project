import { NextRequest, NextResponse } from 'next/server'

// 하이웍스 SMTP 고급 설정 테스트 API
export async function POST(request: NextRequest) {
  try {
    console.log('🔍 [HIWORKS ADVANCED TEST] 고급 설정 테스트 시작')
    
    const testConfigs = [
      {
        name: '설정 1: 기본 + tls 옵션',
        config: {
          host: 'smtp.hiworks.com',
          port: 465,
          secure: true,
          auth: {
            user: 'info@helloamiko.com',
            pass: '1q2w3e4r1!!'
          },
          tls: {
            rejectUnauthorized: false
          }
        }
      },
      {
        name: '설정 2: 포트 587 + TLS + tls 옵션',
        config: {
          host: 'smtp.hiworks.com',
          port: 587,
          secure: false,
          requireTLS: true,
          auth: {
            user: 'info@helloamiko.com',
            pass: '1q2w3e4r1!!'
          },
          tls: {
            rejectUnauthorized: false
          }
        }
      },
      {
        name: '설정 3: 기본 + connectionTimeout',
        config: {
          host: 'smtp.hiworks.com',
          port: 465,
          secure: true,
          auth: {
            user: 'info@helloamiko.com',
            pass: '1q2w3e4r1!!'
          },
          connectionTimeout: 60000,
          greetingTimeout: 30000,
          socketTimeout: 60000
        }
      },
      {
        name: '설정 4: 포트 587 + 모든 타임아웃',
        config: {
          host: 'smtp.hiworks.com',
          port: 587,
          secure: false,
          requireTLS: true,
          auth: {
            user: 'info@helloamiko.com',
            pass: '1q2w3e4r1!!'
          },
          connectionTimeout: 60000,
          greetingTimeout: 30000,
          socketTimeout: 60000,
          tls: {
            rejectUnauthorized: false
          }
        }
      },
      {
        name: '설정 5: 포트 25 + 모든 옵션',
        config: {
          host: 'smtp.hiworks.com',
          port: 25,
          secure: false,
          auth: {
            user: 'info@helloamiko.com',
            pass: '1q2w3e4r1!!'
          },
          connectionTimeout: 60000,
          greetingTimeout: 30000,
          socketTimeout: 60000,
          tls: {
            rejectUnauthorized: false
          }
        }
      }
    ]
    
    const results = []
    
    for (const testConfig of testConfigs) {
      try {
        console.log(`🧪 [HIWORKS ADVANCED TEST] ${testConfig.name} 테스트 중...`)
        
        const nodemailer = await import('nodemailer')
        const transporter = nodemailer.default.createTransport(testConfig.config)
        
        const verifyResult = await transporter.verify()
        
        results.push({
          config: testConfig.name,
          success: true,
          message: '연결 성공',
          details: verifyResult
        })
        
        console.log(`✅ [HIWORKS ADVANCED TEST] ${testConfig.name} 성공`)
        
        // 성공한 설정이 있으면 첫 번째 성공한 설정으로 실제 이메일 발송 테스트
        if (results.length === 1) {
          console.log('📧 [HIWORKS ADVANCED TEST] 성공한 설정으로 실제 이메일 발송 테스트...')
          
          const mailOptions = {
            from: 'Amiko <info@helloamiko.com>',
            to: 'admin@helloamiko.com',
            subject: '[테스트] 하이웍스 SMTP 이메일 발송 테스트',
            html: `
              <h2>🎉 하이웍스 SMTP 테스트 성공!</h2>
              <p>이 이메일은 하이웍스 SMTP를 통해 성공적으로 발송되었습니다.</p>
              <p><strong>사용된 설정:</strong> ${testConfig.name}</p>
              <p><strong>발송 시간:</strong> ${new Date().toLocaleString('ko-KR')}</p>
              <hr>
              <p>Amiko 이메일 서비스가 정상적으로 작동합니다! 🚀</p>
            `,
            text: `
하이웍스 SMTP 테스트 성공!

이 이메일은 하이웍스 SMTP를 통해 성공적으로 발송되었습니다.

사용된 설정: ${testConfig.name}
발송 시간: ${new Date().toLocaleString('ko-KR')}

Amiko 이메일 서비스가 정상적으로 작동합니다! 🚀
            `
          }
          
          const sendResult = await transporter.sendMail(mailOptions)
          console.log('📧 [HIWORKS ADVANCED TEST] 실제 이메일 발송 성공!', sendResult.messageId)
          
          results[results.length - 1].emailSent = true
          results[results.length - 1].messageId = sendResult.messageId
        }
        
      } catch (error) {
        results.push({
          config: testConfig.name,
          success: false,
          message: error instanceof Error ? error.message : '알 수 없는 오류',
          details: testConfig.config
        })
        
        console.log(`❌ [HIWORKS ADVANCED TEST] ${testConfig.name} 실패:`, error instanceof Error ? error.message : '알 수 없는 오류')
      }
    }
    
    return NextResponse.json({
      success: true,
      message: '하이웍스 SMTP 고급 설정 테스트 완료',
      data: {
        results,
        timestamp: new Date().toISOString()
      }
    })
    
  } catch (error) {
    console.error('❌ [HIWORKS ADVANCED TEST] 전체 테스트 실패:', error)
    
    return NextResponse.json(
      { 
        success: false, 
        error: '하이웍스 SMTP 고급 테스트 실패',
        details: error instanceof Error ? error.message : '알 수 없는 오류'
      },
      { status: 500 }
    )
  }
}

export async function GET() {
  return POST(new NextRequest('http://localhost:3000/api/test-hiworks-advanced', { method: 'POST' }))
}
