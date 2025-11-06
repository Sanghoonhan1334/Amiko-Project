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
    console.log(`[TWILIO_SMS] ========================================`)
    console.log(`[TWILIO_SMS] 🚀 발송 시도 시작`)
    console.log(`[TWILIO_SMS] 받는번호: ${to}`)
    console.log(`[TWILIO_SMS] 메시지: ${message}`)
    console.log(`[TWILIO_SMS] 국가코드 분석: ${to.substring(0, 4)}`)
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
    
  } catch (error: any) {
    console.error('[TWILIO_SMS] ========================================')
    console.error('[TWILIO_SMS] ❌ 발송 실패!')
    console.error('[TWILIO_SMS] 받는번호:', to)
    console.error('[TWILIO_SMS] 에러 타입:', error?.constructor?.name)
    console.error('[TWILIO_SMS] TwilioError 상세:', {
      status: error?.status,
      code: error?.code,
      moreInfo: error?.moreInfo,
      message: error?.message
    })
    console.error('[TWILIO_SMS] 에러 상세:', {
      message: error instanceof Error ? error.message : '알 수 없는 오류',
      stack: error instanceof Error ? error.stack : undefined
    })
    console.error('[TWILIO_SMS] ========================================')
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
  // 이미 +로 시작하는 경우 (E.164 형식)
  if (phoneNumber.startsWith('+')) {
    return phoneNumber
  }
  
  // 숫자만 추출
  const digits = phoneNumber.replace(/\D/g, '')
  
  // 국가 코드가 제공된 경우 countries.ts에서 phoneCode 가져오기
  if (countryCode) {
    const { countries } = require('@/constants/countries')
    const country = countries.find((c: any) => c.code === countryCode)
    if (country && country.phoneCode) {
      // 이미 국가 코드가 포함되어 있는지 확인
      const phoneCodeDigits = country.phoneCode.replace(/\D/g, '')
      if (digits.startsWith(phoneCodeDigits)) {
        // 이미 국가 코드 포함 → 그대로 사용
        return `+${digits}`
      } else {
        // 국가 코드 없음 → 추가
        // 한국의 경우 앞자리 0 제거 처리
        if (country.code === 'KR' && digits.startsWith('0')) {
          return `${country.phoneCode}${digits.substring(1)}`
        }
        return `${country.phoneCode}${digits}`
      }
    }
  }
  
  // countryCode가 없는 경우 기존 로직 사용 (하위 호환성)
  
  // 한국 번호 처리 (+82)
  if (digits.startsWith('82') && digits.length >= 11) {
    return `+${digits}`
  } else if (digits.startsWith('010') || digits.startsWith('011') || digits.startsWith('016') || digits.startsWith('017') || digits.startsWith('018') || digits.startsWith('019')) {
    return `+82${digits.substring(1)}`
  } else if (digits.startsWith('0') && digits.length >= 10) {
    return `+82${digits.substring(1)}`
  }
  
  // 미국/캐나다 번호 처리 (+1) - 길이로 판단
  if (digits.startsWith('1') && digits.length === 11) {
    return `+${digits}`
  } else if (digits.length === 10) {
    return `+1${digits}`
  }
  
  // 이란 번호 처리 (+98)
  if (digits.startsWith('98') && digits.length >= 12) {
    return `+${digits}`
  }
  
  // 3자리 국가 코드 처리 (에콰도르 +593, 파라과이 +595, 우루과이 +598, 볼리비아 +591 등)
  if (digits.length >= 13) {
    const threeDigitCode = digits.substring(0, 3)
    if (['593', '595', '598', '591', '502', '504', '505', '507', '506', '503'].includes(threeDigitCode)) {
      return `+${digits}`
    }
  }
  
  // 2자리 국가 코드 처리 (정확한 길이 체크)
  if (digits.length >= 11) {
    const twoDigitCode = digits.substring(0, 2)
    // 멕시코 +52, 페루 +51, 칠레 +56, 콜롬비아 +57, 아르헨티나 +54, 베네수엘라 +58, 브라질 +55, 쿠바 +53
    if (['52', '51', '56', '57', '54', '58', '55', '53', '81', '86'].includes(twoDigitCode)) {
      return `+${digits}`
    }
  }
  
  // 기타 국가 번호 처리 (이미 국가 코드가 포함된 것으로 간주)
  return `+${digits}`
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
