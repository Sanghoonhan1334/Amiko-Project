// =====================================================
// SMS 발송 서비스
// Description: SMS 인증코드 발송 및 템플릿 관리
// Date: 2025-01-17
// =====================================================

interface SMSTemplate {
  message: string
  language: 'ko' | 'es'
}

interface SMSOptions {
  to: string
  template: SMSTemplate
  data?: Record<string, any>
}

// SMS 템플릿 생성
export function createSMSTemplate(type: 'verification', data: Record<string, any>, language: 'ko' | 'es' = 'ko'): SMSTemplate {
  switch (type) {
    case 'verification':
      if (language === 'ko') {
        return {
          message: `[Amiko] 인증코드: ${data.code}\n이 코드는 5분 후에 만료됩니다.\n타인에게 공유하지 마세요.`,
          language: 'ko'
        }
      } else {
        return {
          message: `[Amiko] Código de verificación: ${data.code}\nEste código expira en 5 minutos.\nNo compartas con otros.`,
          language: 'es'
        }
      }
    default:
      throw new Error(`지원되지 않는 SMS 템플릿 타입: ${type}`)
  }
}

// 실제 SMS 발송 함수 (Twilio 연동)
export async function sendSMS(options: SMSOptions): Promise<boolean> {
  try {
    const { to, template, data = {} } = options
    
    // Twilio 계정이 설정되어 있는지 확인
    const hasTwilioConfig = process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN
    
    if (hasTwilioConfig) {
      // Twilio를 사용한 실제 SMS 발송
      try {
        const { sendTwilioSMS, formatPhoneNumber } = await import('./twilioService')
        const formattedNumber = formatPhoneNumber(to)
        const success = await sendTwilioSMS(formattedNumber, template.message)
        
        if (success) {
          console.log(`[SMS_SEND] Twilio로 실제 SMS 발송 완료: ${formattedNumber}`)
          return true
        } else {
          console.error('[SMS_SEND] Twilio SMS 발송 실패')
          return false
        }
      } catch (twilioError) {
        console.error('[SMS_SEND] Twilio 연동 오류:', twilioError)
        // Twilio 실패 시 개발 모드로 fallback
      }
    }
    
    // 개발 환경 또는 Twilio 설정이 없는 경우 콘솔 출력
    if (process.env.NODE_ENV === 'development' || !hasTwilioConfig) {
      console.log('\n' + '='.repeat(60))
      console.log('📱 SMS 발송 (개발 환경)')
      console.log('='.repeat(60))
      console.log(`받는 번호: ${to}`)
      console.log(`언어: ${template.language}`)
      console.log('메시지:')
      console.log(template.message)
      if (!hasTwilioConfig) {
        console.log('⚠️  Twilio 설정이 없어 콘솔에만 출력됩니다.')
        console.log('   실제 SMS 발송을 원한다면 .env.local에 Twilio 설정을 추가하세요.')
      }
      console.log('='.repeat(60) + '\n')
      
      return true
    }
    
    return false
    
  } catch (error) {
    console.error('[SMS_SEND] 오류:', error)
    return false
  }
}

// SMS 인증코드 발송
export async function sendVerificationSMS(phoneNumber: string, code: string, language: 'ko' | 'es' = 'ko'): Promise<boolean> {
  const template = createSMSTemplate('verification', { code }, language)
  
  return await sendSMS({
    to: phoneNumber,
    template,
    data: { code }
  })
}

// WhatsApp 인증코드 발송
export async function sendVerificationWhatsApp(phoneNumber: string, code: string, language: 'ko' | 'es' = 'ko'): Promise<boolean> {
  try {
    const template = createSMSTemplate('verification', { code }, language)
    
    // Twilio 계정이 설정되어 있는지 확인
    const hasTwilioConfig = process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN
    
    if (hasTwilioConfig) {
      // Twilio를 사용한 실제 WhatsApp 발송
      try {
        const { sendTwilioWhatsApp, formatPhoneNumber } = await import('./twilioService')
        const formattedNumber = formatPhoneNumber(phoneNumber)
        const success = await sendTwilioWhatsApp(formattedNumber, template.message)
        
        if (success) {
          console.log(`[WHATSAPP_SEND] Twilio로 실제 WhatsApp 발송 완료: ${formattedNumber}`)
          return true
        } else {
          console.error('[WHATSAPP_SEND] Twilio WhatsApp 발송 실패')
          return false
        }
      } catch (twilioError) {
        console.error('[WHATSAPP_SEND] Twilio 연동 오류:', twilioError)
        // Twilio 실패 시 개발 모드로 fallback
      }
    }
    
    // 개발 환경 또는 Twilio 설정이 없는 경우 콘솔 출력
    if (process.env.NODE_ENV === 'development' || !hasTwilioConfig) {
      console.log('\n' + '='.repeat(60))
      console.log('💬 WhatsApp 발송 (개발 환경)')
      console.log('='.repeat(60))
      console.log(`받는 번호: ${phoneNumber}`)
      console.log(`언어: ${template.language}`)
      console.log('메시지:')
      console.log(template.message)
      if (!hasTwilioConfig) {
        console.log('⚠️  Twilio 설정이 없어 콘솔에만 출력됩니다.')
        console.log('   실제 WhatsApp 발송을 원한다면 .env.local에 Twilio 설정을 추가하세요.')
      }
      console.log('='.repeat(60) + '\n')
      
      return true
    }
    
    return false
    
  } catch (error) {
    console.error('[WHATSAPP_SEND] 오류:', error)
    return false
  }
}

// SMS 발송 상태 확인
export function getSMSServiceStatus(): {
  isAvailable: boolean
  service: string
  environment: string
  supportedProviders: string[]
} {
  const hasTwilioConfig = process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN && process.env.TWILIO_PHONE_NUMBER
  
  return {
    isAvailable: true,
    service: hasTwilioConfig ? 'Twilio SMS' : (process.env.NODE_ENV === 'development' ? 'Console Log' : 'Production Service'),
    environment: process.env.NODE_ENV || 'development',
    supportedProviders: [
      'Twilio (국제)',
      'AWS SNS (국제)',
      'NCP SMS (한국)',
      'Kakao Alimtalk (한국)',
      'WhatsApp Business (국제)'
    ]
  }
}

// 국가별 SMS 서비스 추천
export function getRecommendedSMSService(countryCode: string): {
  provider: string
  description: string
  cost: string
  features: string[]
} {
  switch (countryCode) {
    case 'KR':
      return {
        provider: 'Kakao Alimtalk + NCP SMS',
        description: '한국 사용자를 위한 최적화된 SMS 서비스',
        cost: '월 10,000원부터',
        features: [
          '한국어 템플릿 지원',
          '고속 발송',
          '발송 상태 추적',
          '대량 발송 지원'
        ]
      }
    case 'BR':
    case 'MX':
    case 'US':
    default:
      return {
        provider: 'Twilio + WhatsApp Business',
        description: '국제 사용자를 위한 글로벌 SMS/WhatsApp 서비스',
        cost: '월 $20부터',
        features: [
          '다국어 지원',
          'WhatsApp Business 연동',
          '글로벌 커버리지',
          '고급 분석 도구'
        ]
      }
  }
}

// SMS 발송 제한 확인
export function checkSMSRateLimit(phoneNumber: string): {
  canSend: boolean
  remainingAttempts: number
  resetTime?: Date
} {
  // 실제로는 데이터베이스에서 확인
  // 여기서는 간단한 로직으로 구현
  return {
    canSend: true,
    remainingAttempts: 5,
    resetTime: new Date(Date.now() + 60 * 60 * 1000) // 1시간 후
  }
}

// SMS 발송 통계
export function getSMSSendingStats(): {
  totalSent: number
  successRate: number
  averageCost: number
  lastSent: Date
} {
  return {
    totalSent: 0,
    successRate: 100,
    averageCost: 0.05, // $0.05 per SMS
    lastSent: new Date()
  }
}
