// =====================================================
// Twilio SMS/WhatsApp 발송 서비스
// Description: 실제 SMS/WhatsApp 발송을 위한 Twilio 연동
// Date: 2025-01-17
// =====================================================

import { Twilio } from 'twilio'

// Twilio 클라이언트 초기화
let twilioClient: Twilio | null = null

function getTwilioClient(): Twilio {
  if (!twilioClient) {
    const accountSid = process.env.TWILIO_ACCOUNT_SID
    const authToken = process.env.TWILIO_AUTH_TOKEN
    
    if (!accountSid || !authToken) {
      throw new Error('Twilio 계정 정보가 설정되지 않았습니다. TWILIO_ACCOUNT_SID와 TWILIO_AUTH_TOKEN을 환경변수에 설정해주세요.')
    }
    
    twilioClient = new Twilio(accountSid, authToken)
  }
  
  return twilioClient
}

// SMS 발송
export async function sendTwilioSMS(to: string, message: string): Promise<boolean> {
  try {
    // 실제 SMS 발송 시도
    console.log(`[TWILIO_SMS] 발송 시도 시작: ${to}`)
    console.log(`[TWILIO_SMS] 환경변수 확인:`, {
      accountSid: !!process.env.TWILIO_ACCOUNT_SID,
      authToken: !!process.env.TWILIO_AUTH_TOKEN,
      phoneNumber: !!process.env.TWILIO_PHONE_NUMBER
    })
    
    const client = getTwilioClient()
    const fromNumber = process.env.TWILIO_PHONE_NUMBER
    
    if (!fromNumber) {
      console.log(`[TWILIO_SMS] Twilio 발신번호가 설정되지 않음 - 개발 모드로 처리`)
      console.log(`[TWILIO_SMS] 수신번호: ${to}`)
      console.log(`[TWILIO_SMS] 메시지: ${message}`)
      console.log(`[TWILIO_SMS] 실제 발송하지 않음 (환경변수 미설정)`)
      return true
    }
    
    console.log(`[TWILIO_SMS] 발송 요청:`, {
      from: fromNumber,
      to: to,
      message: message
    })
    
    const result = await client.messages.create({
      body: message,
      from: fromNumber,
      to: to
    })
    
    console.log(`[TWILIO_SMS] 발송 성공: ${result.sid}`)
    console.log(`[TWILIO_SMS] 받는 번호: ${to}`)
    console.log(`[TWILIO_SMS] 메시지: ${message}`)
    console.log(`[TWILIO_SMS] 상태: ${result.status}`)
    
    return true
    
  } catch (error) {
    console.error('[TWILIO_SMS] 발송 실패:', error)
    console.error('[TWILIO_SMS] 에러 상세:', {
      message: error instanceof Error ? error.message : '알 수 없는 오류',
      stack: error instanceof Error ? error.stack : undefined
    })
    return false
  }
}

// WhatsApp 발송
export async function sendTwilioWhatsApp(to: string, message: string): Promise<boolean> {
  try {
    // 개발 환경에서 테스트용 더미 번호는 콘솔에만 출력
    if (process.env.NODE_ENV === 'development' && to.includes('12345678')) {
      console.log(`[TWILIO_WHATSAPP] 개발환경 - 테스트용 더미 번호: ${to}`)
      console.log(`[TWILIO_WHATSAPP] 메시지: ${message}`)
      console.log(`[TWILIO_WHATSAPP] 실제 발송하지 않음`)
      return true
    }

    const client = getTwilioClient()
    const whatsappFrom = process.env.TWILIO_WHATSAPP_FROM || 'whatsapp:+14155238886' // Twilio 샌드박스 번호
    const whatsappTo = to.startsWith('whatsapp:') ? to : `whatsapp:${to}`
    
    const result = await client.messages.create({
      body: message,
      from: whatsappFrom,
      to: whatsappTo
    })
    
    console.log(`[TWILIO_WHATSAPP] 발송 성공: ${result.sid}`)
    console.log(`[TWILIO_WHATSAPP] 받는 번호: ${whatsappTo}`)
    console.log(`[TWILIO_WHATSAPP] 메시지: ${message}`)
    console.log(`[TWILIO_WHATSAPP] 상태: ${result.status}`)
    
    return true
    
  } catch (error) {
    console.error('[TWILIO_WHATSAPP] 발송 실패:', error)
    return false
  }
}

// Twilio 계정 정보 확인
export async function verifyTwilioAccount(): Promise<{
  isValid: boolean
  accountSid?: string
  phoneNumber?: string
  balance?: number
  error?: string
}> {
  try {
    const client = getTwilioClient()
    const account = await client.api.accounts(client.accountSid).fetch()
    const incomingNumbers = await client.incomingPhoneNumbers.list({ limit: 1 })
    
    return {
      isValid: true,
      accountSid: account.sid,
      phoneNumber: incomingNumbers[0]?.phoneNumber,
      balance: parseFloat(account.balance || '0')
    }
    
  } catch (error) {
    return {
      isValid: false,
      error: error instanceof Error ? error.message : '알 수 없는 오류'
    }
  }
}

// 전화번호 형식 검증 및 변환 (국가 코드 포함)
export function formatPhoneNumber(phoneNumber: string, countryCode?: string): string {
  // 숫자만 추출
  const digits = phoneNumber.replace(/\D/g, '')
  
  // 이미 +로 시작하는 경우
  if (phoneNumber.startsWith('+')) {
    return phoneNumber
  }
  
  // 국가 코드가 제공된 경우 해당 국가 코드 사용
  if (countryCode) {
    const { countries } = require('@/constants/countries')
    const country = countries.find((c: any) => c.code === countryCode)
    if (country && country.phoneCode) {
      return `${country.phoneCode}${digits}`
    }
  }
  
  // 한국 번호 처리 (+82)
  if (digits.startsWith('82')) {
    return `+${digits}`
  } else if (digits.startsWith('010')) {
    return `+82${digits.substring(1)}`
  } else if (digits.startsWith('0')) {
    return `+82${digits.substring(1)}`
  }
  
  // 멕시코 번호 처리 (+52)
  if (digits.startsWith('52')) {
    return `+${digits}`
  }
  
  // 이란 번호 처리 (+98) - 명시적으로 처리
  if (digits.startsWith('98')) {
    return `+${digits}`
  }
  
  // 미국/캐나다 번호 처리 (+1)
  if (digits.startsWith('1') && digits.length === 11) {
    return `+${digits}`
  } else if (digits.length === 10) {
    return `+1${digits}`
  }
  
  // 다른 국가 번호 처리
  if (!digits.startsWith('+')) {
    return `+${digits}`
  }
  
  return digits
}

// SMS 발송 비용 계산
export function calculateSMSCost(countryCode: string): number {
  // Twilio 기본 가격 (USD)
  const prices: Record<string, number> = {
    'KR': 0.0075, // 한국
    'US': 0.0075, // 미국
    'BR': 0.0075, // 브라질
    'MX': 0.0075, // 멕시코
    'DEFAULT': 0.0075
  }
  
  return prices[countryCode] || prices.DEFAULT
}
