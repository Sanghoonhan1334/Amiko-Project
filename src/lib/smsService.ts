// =====================================================
// SMS 발송 서비스
// Description: SMS 인증코드 발송 및 템플릿 관리
// Date: 2025-01-17
// Updated: 2025-01-25 - 국가별 프로바이더 선택 로직 추가
// =====================================================

import { Twilio } from 'twilio'

// SMS 프로바이더 타입
type SMSProvider = 'twilio' | 'bird'

// 국가별 프로바이더 매핑
// 기본값: twilio
// 특정 국가만 bird 사용 (예: CL)
const COUNTRY_PROVIDER_MAP: Record<string, SMSProvider> = {
  'CL': 'bird', // Chile는 Bird 사용
  // 향후 추가 가능:
  // 'SA': 'bird', // 사우디아라비아
  // 'AE': 'bird', // UAE
}

/**
 * 전화번호에서 국가 코드 추출 (fallback용)
 * @param phoneNumber E.164 형식 전화번호 (예: +56912345678)
 * @returns 국가 코드 (예: 'CL') 또는 null
 */
function extractCountryCodeFromPhone(phoneNumber: string): string | null {
  try {
    // libphonenumber-js 사용
    const { parsePhoneNumber } = require('libphonenumber-js')
    const parsed = parsePhoneNumber(phoneNumber)
    
    if (parsed && parsed.country) {
      return parsed.country
    }
  } catch (error) {
    // 파싱 실패 시 전화번호 패턴으로 추정
    if (phoneNumber.startsWith('+56')) {
      return 'CL' // 칠레
    }
    // 다른 국가 코드는 필요시 추가
  }
  
  return null
}

/**
 * 국가 코드에 따라 SMS 프로바이더 선택
 * @param countryCode 국가 코드 (예: 'CL', 'KR', 'MX')
 * @param phoneNumber 전화번호 (countryCode가 없을 때 fallback용)
 * @returns 선택된 프로바이더
 */
function selectSMSProvider(countryCode?: string, phoneNumber?: string): SMSProvider {
  let finalCountryCode = countryCode

  // countryCode가 없으면 전화번호에서 추출 시도
  if (!finalCountryCode && phoneNumber) {
    finalCountryCode = extractCountryCodeFromPhone(phoneNumber) || undefined
    if (finalCountryCode) {
      console.log(`[SMS_PROVIDER] 전화번호에서 국가 코드 추출: ${phoneNumber} → ${finalCountryCode}`)
    }
  }

  if (!finalCountryCode) {
    console.log(`[SMS_PROVIDER] 국가 코드 없음 → 기본값 twilio 선택`)
    return 'twilio' // 기본값
  }

  // 국가 코드를 대문자로 변환
  const upperCountryCode = finalCountryCode.toUpperCase()
  
  // 매핑에서 찾기
  const provider = COUNTRY_PROVIDER_MAP[upperCountryCode]
  
  if (provider) {
    console.log(`[SMS_PROVIDER] 국가 코드 ${upperCountryCode} → ${provider} 선택`)
    return provider
  }

  // 매핑에 없으면 기본값 (twilio)
  console.log(`[SMS_PROVIDER] 국가 코드 ${upperCountryCode} → 기본값 twilio 선택`)
  return 'twilio'
}

interface SMSTemplate {
  message: string
  language: 'ko' | 'es'
}

interface SMSOptions {
  to: string
  template: SMSTemplate
  data?: Record<string, any>
  countryCode?: string
}

// SMS 템플릿 생성
export function createSMSTemplate(type: 'verification', data: Record<string, any>, language: 'ko' | 'es' = 'ko'): SMSTemplate {
  switch (type) {
    case 'verification':
      if (language === 'ko') {
        return {
          message: `[Amiko] 인증코드: ${data.code}\n이 코드는 2분 후에 만료됩니다.\n타인에게 공유하지 마세요.`,
          language: 'ko'
        }
      } else {
        return {
          message: `[Amiko] Código de verificación: ${data.code}\nEste código expira en 2 minutos.\nNo compartas con otros.`,
          language: 'es'
        }
      }
    default:
      throw new Error(`지원되지 않는 SMS 템플릿 타입: ${type}`)
  }
}

// 실제 SMS 발송 함수 (프로바이더 자동 선택)
export async function sendSMS(options: SMSOptions): Promise<boolean> {
  try {
    const { to, template, data = {}, countryCode } = options
    
    // 국가 코드 기반 프로바이더 선택 (countryCode가 없으면 전화번호에서 추출)
    const provider = selectSMSProvider(countryCode, to)
    
    console.log(`[SMS_SEND] SMS 발송 시작:`, {
      to,
      countryCode,
      provider,
      language: template.language
    })

    // 프로바이더별 발송 로직
    if (provider === 'bird') {
      // Bird API 사용
      const hasBirdConfig = process.env.BIRD_API_KEY && process.env.BIRD_SENDER_ID
      
      if (hasBirdConfig) {
        try {
          const { sendBirdSMS } = await import('./birdService')
          const { formatPhoneNumber } = await import('./twilioService')
          const formattedNumber = formatPhoneNumber(to, countryCode)
          const success = await sendBirdSMS(formattedNumber, template.message)
          
          if (success) {
            console.log(`[SMS_SEND] Bird로 실제 SMS 발송 완료: ${formattedNumber}`)
            return true
          } else {
            console.error('[SMS_SEND] Bird SMS 발송 실패')
            // Bird 실패 시 Twilio로 fallback 시도
            console.log('[SMS_SEND] Bird 실패 → Twilio로 fallback 시도')
            return await fallbackToTwilio(to, template.message, countryCode)
          }
        } catch (birdError) {
          console.error('[SMS_SEND] Bird 연동 오류:', birdError)
          // Bird 실패 시 Twilio로 fallback 시도
          console.log('[SMS_SEND] Bird 오류 → Twilio로 fallback 시도')
          return await fallbackToTwilio(to, template.message, countryCode)
        }
      } else {
        console.warn('[SMS_SEND] Bird 설정이 없음 → Twilio로 fallback 시도')
        return await fallbackToTwilio(to, template.message, countryCode)
      }
    } else {
      // Twilio 사용 (기본값)
      return await fallbackToTwilio(to, template.message, countryCode)
    }
    
  } catch (error) {
    console.error('[SMS_SEND] 오류:', error)
    return false
  }
}

/**
 * Twilio로 SMS 발송 (fallback 및 기본 프로바이더)
 */
async function fallbackToTwilio(to: string, message: string, countryCode?: string): Promise<boolean> {
  try {
    // Twilio 계정이 설정되어 있는지 확인
    const hasTwilioConfig = process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN
    
    if (hasTwilioConfig) {
      // Twilio를 사용한 실제 SMS 발송
      try {
        const { sendTwilioSMS, formatPhoneNumber } = await import('./twilioService')
        const formattedNumber = formatPhoneNumber(to, countryCode)
        const success = await sendTwilioSMS(formattedNumber, message)
        
        if (success) {
          console.log(`[SMS_SEND] Twilio로 실제 SMS 발송 완료: ${formattedNumber}`)
          return true
        } else {
          console.error('[SMS_SEND] Twilio SMS 발송 실패')
          // 발송 실패 (logToConsole은 false 반환)
          logToConsole(to, message)
          return false
        }
      } catch (twilioError) {
        console.error('[SMS_SEND] Twilio 연동 오류:', twilioError)
        // 발송 실패 (logToConsole은 false 반환)
        logToConsole(to, message)
        return false
      }
    } else {
      // Twilio 설정이 없으면 발송 실패
      console.warn('[SMS_SEND] Twilio 설정이 없어 SMS 발송 불가')
      logToConsole(to, message)
      return false
    }
  } catch (error) {
    console.error('[SMS_SEND] Twilio fallback 오류:', error)
    logToConsole(to, message)
    return false
  }
}

/**
 * 개발 환경용 콘솔 로그 출력 (실제 발송 실패)
 */
function logToConsole(to: string, message: string): boolean {
  console.warn('\n' + '='.repeat(60))
  console.warn('⚠️  SMS 발송 실패 (개발 환경 - 실제 발송 불가)')
  console.warn('='.repeat(60))
  console.warn(`받는 번호: ${to}`)
  console.warn('메시지:')
  console.warn(message)
  console.warn('⚠️  실제 SMS는 발송되지 않았습니다.')
  console.warn('='.repeat(60) + '\n')
  return false // 발송 실패로 처리
}

// SMS 인증코드 발송
export async function sendVerificationSMS(phoneNumber: string, code: string, language: 'ko' | 'es' = 'ko', countryCode?: string): Promise<boolean> {
  console.log('[SMS_VERIFICATION] SMS 발송 시작:', { phoneNumber, code, language, countryCode })
  
  // 개발 환경에서도 실제 SMS 발송 시도 (Twilio 설정이 있으면)
  const hasTwilioConfig = process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN && process.env.TWILIO_PHONE_NUMBER
  
  // 개발 환경에서 Twilio 설정이 없으면 실제 발송하지 않음
  if (process.env.NODE_ENV === 'development' && !hasTwilioConfig) {
    console.warn('\n' + '='.repeat(60))
    console.warn('⚠️  SMS 인증코드 발송 실패 (개발 환경 - Twilio 미설정)')
    console.warn('='.repeat(60))
    console.warn(`받는 번호: ${phoneNumber}`)
    console.warn(`국가 코드: ${countryCode}`)
    console.warn(`언어: ${language}`)
    console.warn(`인증코드: ${code}`)
    console.warn('⚠️  실제 SMS는 발송되지 않습니다. Twilio 설정이 필요합니다.')
    console.warn('='.repeat(60) + '\n')
    return false // 실패로 반환하여 사용자에게 알림
  }
  
  try {
    const template = createSMSTemplate('verification', { code }, language)
    console.log('[SMS_VERIFICATION] 템플릿 생성 완료:', template)
    
    const result = await sendSMS({
      to: phoneNumber,
      template,
      data: { code },
      countryCode
    })
    
    console.log('[SMS_VERIFICATION] SMS 발송 결과:', result)
    return result
  } catch (error) {
    console.error('[SMS_VERIFICATION] SMS 발송 오류:', error)
    return false
  }
}

// WhatsApp 인증코드 발송 (템플릿 사용)
export async function sendVerificationWhatsApp(phoneNumber: string, code: string, language: 'ko' | 'es' = 'ko'): Promise<boolean> {
  try {
    console.log('[WHATSAPP_VERIFICATION] WhatsApp 인증코드 발송 시작:', { phoneNumber, code, language })
    
    // Twilio 계정이 설정되어 있는지 확인
    const hasTwilioConfig = process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN
    const hasTemplateSid = process.env.TWILIO_WHATSAPP_TEMPLATE_SID
    
    if (hasTwilioConfig && hasTemplateSid) {
      // 템플릿을 사용한 WhatsApp 발송 (직접 Twilio API 호출)
      try {
        // 정적 import로 이미 가져온 Twilio 사용
        const accountSid = process.env.TWILIO_ACCOUNT_SID!
        const authToken = process.env.TWILIO_AUTH_TOKEN!
        const client = new Twilio(accountSid, authToken)
        
        const whatsappNumber = process.env.TWILIO_WHATSAPP_NUMBER || process.env.TWILIO_WHATSAPP_FROM!
        const templateSid = process.env.TWILIO_WHATSAPP_TEMPLATE_SID!
        
        // 전화번호 형식 정규화
        const normalizedPhone = phoneNumber.startsWith('+') 
          ? phoneNumber 
          : `+${phoneNumber.replace(/\D/g, '')}`
        
        const whatsappTo = normalizedPhone.startsWith('whatsapp:')
          ? normalizedPhone
          : `whatsapp:${normalizedPhone}`
        
        const whatsappFrom = whatsappNumber.startsWith('whatsapp:')
          ? whatsappNumber
          : `whatsapp:${whatsappNumber}`
        
        // WhatsApp Authentication 템플릿 사용
        const result = await client.messages.create({
          from: whatsappFrom,
          to: whatsappTo,
          contentSid: templateSid,
          contentVariables: JSON.stringify({
            '1': code
          })
        })
        
        console.log(`[WHATSAPP_VERIFICATION] 템플릿을 사용한 WhatsApp 발송 완료: ${phoneNumber}`)
        console.log(`[WHATSAPP_VERIFICATION] 메시지 SID: ${result.sid}`)
        console.log(`[WHATSAPP_VERIFICATION] 상태: ${result.status}`)
        return true
        
      } catch (twilioError: any) {
        console.error('[WHATSAPP_VERIFICATION] 템플릿 발송 오류:', twilioError)
        console.error('[WHATSAPP_VERIFICATION] 에러 코드:', twilioError?.code)
        console.error('[WHATSAPP_VERIFICATION] 에러 메시지:', twilioError?.message)
        // 템플릿 발송 실패 시 기존 방식으로 fallback
        return await fallbackToOldWhatsAppMethod(phoneNumber, code, language)
      }
    } else {
      // 템플릿 SID가 없으면 기존 방식 사용
      console.warn('[WHATSAPP_VERIFICATION] 템플릿 SID가 없어 기존 방식 사용')
      return await fallbackToOldWhatsAppMethod(phoneNumber, code, language)
    }
    
  } catch (error) {
    console.error('[WHATSAPP_VERIFICATION] 오류:', error)
    return false
  }
}

// 기존 WhatsApp 발송 방식 (fallback)
async function fallbackToOldWhatsAppMethod(phoneNumber: string, code: string, language: 'ko' | 'es'): Promise<boolean> {
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
  countryProviderMap: Record<string, SMSProvider>
} {
  const hasTwilioConfig = process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN && process.env.TWILIO_PHONE_NUMBER
  const hasBirdConfig = process.env.BIRD_API_KEY && process.env.BIRD_SENDER_ID
  
  let service = 'Console Log'
  if (hasTwilioConfig && hasBirdConfig) {
    service = 'Twilio + Bird (국가별 자동 선택)'
  } else if (hasTwilioConfig) {
    service = 'Twilio SMS'
  } else if (hasBirdConfig) {
    service = 'Bird SMS'
  } else if (process.env.NODE_ENV === 'production') {
    service = 'Production Service (설정 필요)'
  }
  
  return {
    isAvailable: true,
    service,
    environment: process.env.NODE_ENV || 'development',
    supportedProviders: [
      'Twilio (국제 - 기본)',
      'Bird (Chile 등 특정 국가)',
      'AWS SNS (국제)',
      'NCP SMS (한국)',
      'Kakao Alimtalk (한국)',
      'WhatsApp Business (국제)'
    ],
    countryProviderMap: { ...COUNTRY_PROVIDER_MAP }
  }
}

// 국가별 SMS 서비스 추천
export function getRecommendedSMSService(countryCode: string): {
  provider: string
  description: string
  cost: string
  features: string[]
  actualProvider?: SMSProvider
} {
  const actualProvider = selectSMSProvider(countryCode)
  
  switch (countryCode) {
    case 'CL':
      return {
        provider: 'Bird (MessageBird)',
        description: 'Chile 사용자를 위한 Bird SMS 서비스',
        cost: '사용량 기반',
        features: [
          'Chile 지역 최적화',
          '빠른 발송',
          '발송 상태 추적',
          '안정적인 전달률'
        ],
        actualProvider: 'bird'
      }
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
        ],
        actualProvider: 'twilio' // 현재는 Twilio 사용
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
        ],
        actualProvider: 'twilio'
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
