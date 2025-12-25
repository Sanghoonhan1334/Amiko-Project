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
    
    // 디버깅: 환경 변수 확인 (민감 정보 마스킹)
    console.log('[TWILIO_CLIENT] Twilio 클라이언트 생성:', {
      accountSid: accountSid ? `${accountSid.substring(0, 4)}...${accountSid.substring(accountSid.length - 4)}` : '없음',
      authToken: authToken ? `${authToken.substring(0, 4)}...${authToken.substring(authToken.length - 4)}` : '없음',
      accountSidLength: accountSid?.length || 0,
      authTokenLength: authToken?.length || 0
    })
    
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
    
    const client = getTwilioClient()
    
    // 계정에 등록된 전화번호 자동 조회 (계정과 번호 불일치 방지)
    let fromNumber = process.env.TWILIO_PHONE_NUMBER // 기본값
    let accountInfo: any = null
    
    try {
      // 먼저 계정에 등록된 번호 목록 조회
      accountInfo = await verifyTwilioAccount()
      if (accountInfo.isValid && accountInfo.phoneNumbers && accountInfo.phoneNumbers.length > 0) {
        console.log(`[TWILIO_SMS] 계정에 등록된 번호 목록: ${accountInfo.phoneNumbers.join(', ')}`)
        
        // 환경 변수에 설정된 번호가 계정에 등록되어 있는지 확인
        if (fromNumber && accountInfo.phoneNumbers.includes(fromNumber)) {
          console.log(`[TWILIO_SMS] ✅ 환경변수 번호(${fromNumber})가 계정에 등록되어 있음`)
        } else {
          // 환경변수 번호가 계정에 없으면, 계정에 등록된 첫 번째 번호 사용
          fromNumber = accountInfo.phoneNumbers[0]
          console.log(`[TWILIO_SMS] ⚠️  환경변수 번호가 계정에 없어서 계정의 첫 번째 번호 사용: ${fromNumber}`)
        }
      } else {
        // 계정에 등록된 번호가 없을 때
        if (fromNumber) {
          console.error(`[TWILIO_SMS] ❌ 계정에 등록된 번호가 없지만 환경변수 번호(${fromNumber})가 설정되어 있습니다.`)
          console.error(`[TWILIO_SMS] 이 번호는 현재 계정에 등록되어 있지 않아 발송이 실패할 수 있습니다.`)
          console.error(`[TWILIO_SMS] 해결 방법:`)
          console.error(`[TWILIO_SMS] 1. Twilio 콘솔에서 전화번호를 구매/등록하세요: https://console.twilio.com/`)
          console.error(`[TWILIO_SMS] 2. 또는 .env.local의 TWILIO_PHONE_NUMBER를 계정에 등록된 번호로 변경하세요.`)
        } else {
          console.error(`[TWILIO_SMS] ❌ 계정에 등록된 번호가 없고 환경변수 번호도 설정되지 않았습니다.`)
          console.error(`[TWILIO_SMS] Twilio 콘솔에서 전화번호를 구매/등록하거나 .env.local에 TWILIO_PHONE_NUMBER를 설정하세요.`)
        }
      }
    } catch (accountError) {
      console.warn(`[TWILIO_SMS] 계정 정보 조회 실패, 환경변수 번호 사용: ${fromNumber}`, accountError)
    }
    
    // 계정에 등록된 번호가 없고, 환경변수 번호가 계정에 등록되어 있지 않을 가능성이 높을 때 경고
    if (fromNumber && accountInfo && accountInfo.isValid && accountInfo.phoneNumbers && accountInfo.phoneNumbers.length > 0) {
      if (!accountInfo.phoneNumbers.includes(fromNumber)) {
        console.error(`[TWILIO_SMS] ⚠️  경고: 환경변수 번호(${fromNumber})가 계정에 등록되어 있지 않습니다.`)
        console.error(`[TWILIO_SMS] 등록된 번호: ${accountInfo.phoneNumbers.join(', ')}`)
        console.error(`[TWILIO_SMS] 발송 시도는 하겠지만, Twilio API에서 에러가 발생할 수 있습니다.`)
      }
    }
    
    // 국가별 발신 번호 선택 (계정에 등록된 번호가 있을 때만)
    // 칠레 번호가 있고, 받는 사람이 칠레면 칠레 번호 사용
    if (to.startsWith('+56') && process.env.TWILIO_PHONE_NUMBER_CL) {
      // 환경변수의 칠레 번호가 계정에 등록되어 있는지 확인
      try {
        const accountInfo = await verifyTwilioAccount()
        if (accountInfo.phoneNumbers?.includes(process.env.TWILIO_PHONE_NUMBER_CL)) {
          fromNumber = process.env.TWILIO_PHONE_NUMBER_CL
          console.log(`[TWILIO_SMS] ✅ 칠레 → 칠레 로컬 번호 사용: ${fromNumber}`)
        }
      } catch (e) {
        // 무시하고 기본 번호 사용
      }
    }
    // 멕시코 번호가 있고, 받는 사람이 멕시코면 멕시코 번호 사용
    else if (to.startsWith('+52') && process.env.TWILIO_PHONE_NUMBER_MX) {
      try {
        const accountInfo = await verifyTwilioAccount()
        if (accountInfo.phoneNumbers?.includes(process.env.TWILIO_PHONE_NUMBER_MX)) {
          fromNumber = process.env.TWILIO_PHONE_NUMBER_MX
          console.log(`[TWILIO_SMS] ✅ 멕시코 → 멕시코 로컬 번호 사용: ${fromNumber}`)
        }
      } catch (e) {
        // 무시하고 기본 번호 사용
      }
    }
    // 페루 번호가 있고, 받는 사람이 페루면 페루 번호 사용
    else if (to.startsWith('+51') && process.env.TWILIO_PHONE_NUMBER_PE) {
      try {
        const accountInfo = await verifyTwilioAccount()
        if (accountInfo.phoneNumbers?.includes(process.env.TWILIO_PHONE_NUMBER_PE)) {
          fromNumber = process.env.TWILIO_PHONE_NUMBER_PE
          console.log(`[TWILIO_SMS] ✅ 페루 → 페루 로컬 번호 사용: ${fromNumber}`)
        }
      } catch (e) {
        // 무시하고 기본 번호 사용
      }
    }
    
    console.log(`[TWILIO_SMS] 환경변수 확인:`, {
      accountSid: !!process.env.TWILIO_ACCOUNT_SID,
      authToken: !!process.env.TWILIO_AUTH_TOKEN,
      defaultNumber: !!process.env.TWILIO_PHONE_NUMBER,
      chileNumber: !!process.env.TWILIO_PHONE_NUMBER_CL,
      mexicoNumber: !!process.env.TWILIO_PHONE_NUMBER_MX,
      peruNumber: !!process.env.TWILIO_PHONE_NUMBER_PE,
      selectedFrom: fromNumber
    })
    
    if (!fromNumber) {
      console.warn(`[TWILIO_SMS] ⚠️  Twilio 발신번호가 설정되지 않음 - 발송 불가`)
      console.warn(`[TWILIO_SMS] 수신번호: ${to}`)
      console.warn(`[TWILIO_SMS] 메시지: ${message}`)
      console.warn(`[TWILIO_SMS] 실제 발송하지 않음 (환경변수 미설정)`)
      return false // 발송 실패로 처리
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
    
    // 특정 에러 코드에 대한 명확한 안내
    if (error?.code === 21660) {
      console.error('[TWILIO_SMS] ⚠️  에러 21660: 발신번호와 계정이 일치하지 않습니다.')
      console.error('[TWILIO_SMS] 해결 방법:')
      console.error('[TWILIO_SMS] 1. Twilio 콘솔(https://console.twilio.com/)에서 현재 계정의 전화번호를 확인하세요.')
      console.error('[TWILIO_SMS] 2. .env.local의 TWILIO_PHONE_NUMBER를 계정에 등록된 번호로 변경하세요.')
      console.error('[TWILIO_SMS] 3. 또는 Twilio 콘솔에서 전화번호를 구매/등록하세요.')
    }
    
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

    console.log(`[TWILIO_WHATSAPP] ========================================`)
    console.log(`[TWILIO_WHATSAPP] 🚀 WhatsApp 발송 시도 시작`)
    console.log(`[TWILIO_WHATSAPP] 받는번호: ${to}`)
    console.log(`[TWILIO_WHATSAPP] 메시지: ${message}`)
    
    const client = getTwilioClient()
    
    // 환경 변수에서 WhatsApp 번호 가져오기
    const whatsappFromEnv = process.env.TWILIO_WHATSAPP_FROM || process.env.TWILIO_WHATSAPP_NUMBER
    console.log(`[TWILIO_WHATSAPP] 환경변수 확인:`, {
      TWILIO_WHATSAPP_FROM: process.env.TWILIO_WHATSAPP_FROM ? `설정됨 (${process.env.TWILIO_WHATSAPP_FROM})` : '없음',
      TWILIO_WHATSAPP_NUMBER: process.env.TWILIO_WHATSAPP_NUMBER ? `설정됨 (${process.env.TWILIO_WHATSAPP_NUMBER})` : '없음',
      사용할_값: whatsappFromEnv || '없음'
    })
    
    // 디버깅: 실제 환경 변수 값 확인
    console.log(`[TWILIO_WHATSAPP] 디버깅 - 환경 변수 원본 값:`, {
      'process.env.TWILIO_WHATSAPP_FROM': process.env.TWILIO_WHATSAPP_FROM,
      'process.env.TWILIO_WHATSAPP_NUMBER': process.env.TWILIO_WHATSAPP_NUMBER
    })
    
    let whatsappFrom: string
    
    // 환경 변수 번호가 있으면 그대로 사용 (WhatsApp Sender는 별도로 등록되므로 직접 사용)
    if (whatsappFromEnv) {
      // whatsapp: 접두사 확인 및 추가
      if (whatsappFromEnv.startsWith('whatsapp:')) {
        whatsappFrom = whatsappFromEnv
        console.log(`[TWILIO_WHATSAPP] ✅ 환경변수 번호 사용 (whatsapp: 접두사 포함): ${whatsappFrom}`)
      } else {
        whatsappFrom = `whatsapp:${whatsappFromEnv}`
        console.log(`[TWILIO_WHATSAPP] ✅ 환경변수 번호 사용 (whatsapp: 접두사 추가): ${whatsappFrom}`)
      }
    } else {
      // 환경변수 번호가 없으면 샌드박스 번호 사용 (테스트용)
      whatsappFrom = 'whatsapp:+14155238886'
      console.warn(`[TWILIO_WHATSAPP] ⚠️  환경변수 번호가 없어 샌드박스 번호 사용: ${whatsappFrom}`)
      console.warn(`[TWILIO_WHATSAPP] 샌드박스 번호는 테스트용이며, 실제 발송을 위해서는 .env.local에 TWILIO_WHATSAPP_NUMBER를 설정하세요.`)
    }
    
    const whatsappTo = to.startsWith('whatsapp:') ? to : `whatsapp:${to}`
    
    console.log(`[TWILIO_WHATSAPP] 발송 요청:`, {
      from: whatsappFrom,
      to: whatsappTo,
      message: message
    })
    
    const result = await client.messages.create({
      body: message,
      from: whatsappFrom,
      to: whatsappTo
    })
    
    console.log(`[TWILIO_WHATSAPP] 발송 성공: ${result.sid}`)
    console.log(`[TWILIO_WHATSAPP] 받는 번호: ${whatsappTo}`)
    console.log(`[TWILIO_WHATSAPP] 메시지: ${message}`)
    console.log(`[TWILIO_WHATSAPP] 상태: ${result.status}`)
    console.log(`[TWILIO_WHATSAPP] 에러 코드: ${result.errorCode || '없음'}`)
    console.log(`[TWILIO_WHATSAPP] 에러 메시지: ${result.errorMessage || '없음'}`)
    console.log(`[TWILIO_WHATSAPP] 메시지 상세 확인: https://console.twilio.com/us1/monitor/logs/messages/${result.sid}`)
    
    // 상태가 queued인 경우 경고
    if (result.status === 'queued') {
      console.warn(`[TWILIO_WHATSAPP] ⚠️  메시지가 큐에 들어갔습니다. 실제 전송 여부는 Twilio 콘솔에서 확인하세요.`)
      console.warn(`[TWILIO_WHATSAPP] ⚠️  Sandbox 모드인 경우 수신 번호가 Sandbox에 등록되어 있어야 합니다.`)
      console.warn(`[TWILIO_WHATSAPP] ⚠️  Sandbox 등록: https://console.twilio.com/us1/develop/sms/sandbox`)
    }
    
    // 에러 코드가 있는 경우 경고
    if (result.errorCode) {
      console.error(`[TWILIO_WHATSAPP] ❌ 에러 코드: ${result.errorCode}`)
      console.error(`[TWILIO_WHATSAPP] ❌ 에러 메시지: ${result.errorMessage}`)
      
      // 에러 코드별 안내
      if (result.errorCode === 63007) {
        console.error(`[TWILIO_WHATSAPP] ❌ 에러 63007: 수신 번호가 Sandbox에 등록되지 않았습니다.`)
        console.error(`[TWILIO_WHATSAPP] 해결 방법:`)
        console.error(`[TWILIO_WHATSAPP] 1. Twilio 콘솔에서 Sandbox 설정 확인: https://console.twilio.com/us1/develop/sms/sandbox`)
        console.error(`[TWILIO_WHATSAPP] 2. 수신 번호 ${whatsappTo.replace('whatsapp:', '')}를 Sandbox에 등록하세요.`)
        console.error(`[TWILIO_WHATSAPP] 3. 또는 프로덕션 WhatsApp Business API로 전환하세요.`)
      } else if (result.errorCode === 63016) {
        console.error(`[TWILIO_WHATSAPP] ❌ 에러 63016: 24시간 이내에 사용자가 메시지를 보내지 않았습니다.`)
        console.error(`[TWILIO_WHATSAPP] 해결 방법:`)
        console.error(`[TWILIO_WHATSAPP] 1. 사용자가 먼저 WhatsApp으로 메시지를 보내야 합니다.`)
        console.error(`[TWILIO_WHATSAPP] 2. 또는 프로덕션 WhatsApp Business API로 전환하세요.`)
      }
    }
    
    console.log(`[TWILIO_WHATSAPP] ========================================`)
    
    // 에러 코드가 있으면 false 반환
    if (result.errorCode) {
      return false
    }
    
    return true
    
  } catch (error: any) {
    console.error('[TWILIO_WHATSAPP] ========================================')
    console.error('[TWILIO_WHATSAPP] ❌ 발송 실패!')
    console.error('[TWILIO_WHATSAPP] 받는번호:', to)
    console.error('[TWILIO_WHATSAPP] 에러 타입:', error?.constructor?.name)
    console.error('[TWILIO_WHATSAPP] TwilioError 상세:', {
      status: error?.status,
      code: error?.code,
      moreInfo: error?.moreInfo,
      message: error?.message
    })
    
    // 특정 에러 코드에 대한 명확한 안내
    if (error?.code === 20003) {
      console.error('[TWILIO_WHATSAPP] ⚠️  에러 20003: Twilio 인증 실패!')
      console.error('[TWILIO_WHATSAPP] Account SID 또는 Auth Token이 잘못되었거나 만료되었습니다.')
      console.error('[TWILIO_WHATSAPP] 해결 방법:')
      console.error('[TWILIO_WHATSAPP] 1. Twilio 콘솔(https://console.twilio.com/)에서 Account SID와 Auth Token을 확인하세요.')
      console.error('[TWILIO_WHATSAPP] 2. .env.local 파일의 TWILIO_ACCOUNT_SID와 TWILIO_AUTH_TOKEN을 업데이트하세요.')
      console.error('[TWILIO_WHATSAPP] 3. Auth Token이 만료되었을 수 있으니 새로 생성하세요.')
      console.error('[TWILIO_WHATSAPP] 4. 개발 서버를 재시작하세요.')
    } else if (error?.code === 21660) {
      console.error('[TWILIO_WHATSAPP] ⚠️  에러 21660: 발신번호와 계정이 일치하지 않습니다.')
      console.error('[TWILIO_WHATSAPP] 해결 방법:')
      console.error('[TWILIO_WHATSAPP] 1. Twilio 콘솔(https://console.twilio.com/)에서 현재 계정의 WhatsApp 전화번호를 확인하세요.')
      console.error('[TWILIO_WHATSAPP] 2. .env.local의 TWILIO_WHATSAPP_FROM을 계정에 등록된 번호로 변경하세요.')
      console.error('[TWILIO_WHATSAPP] 3. 또는 Twilio 콘솔에서 WhatsApp 전화번호를 구매/등록하세요.')
    }
    
    console.error('[TWILIO_WHATSAPP] 에러 상세:', {
      message: error instanceof Error ? error.message : '알 수 없는 오류',
      stack: error instanceof Error ? error.stack : undefined
    })
    console.error('[TWILIO_WHATSAPP] ========================================')
    return false
  }
}

// Twilio 계정 정보 확인
export async function verifyTwilioAccount(): Promise<{
  isValid: boolean
  accountSid?: string
  phoneNumber?: string
  phoneNumbers?: string[]
  balance?: number
  error?: string
}> {
  try {
    const client = getTwilioClient()
    const account = await client.api.accounts(client.accountSid).fetch()
    const incomingNumbers = await client.incomingPhoneNumbers.list()
    
    const phoneNumbers = incomingNumbers.map(num => num.phoneNumber)
    
    return {
      isValid: true,
      accountSid: account.sid,
      phoneNumber: incomingNumbers[0]?.phoneNumber,
      phoneNumbers: phoneNumbers,
      balance: parseFloat(account.balance || '0')
    }
    
  } catch (error) {
    return {
      isValid: false,
      error: error instanceof Error ? error.message : '알 수 없는 오류'
    }
  }
}

// 계정에 등록된 전화번호 중 사용 가능한 번호 찾기
async function getAvailablePhoneNumber(to: string): Promise<string | null> {
  try {
    const accountInfo = await verifyTwilioAccount()
    if (!accountInfo.isValid || !accountInfo.phoneNumbers || accountInfo.phoneNumbers.length === 0) {
      console.warn('[TWILIO_SMS] 계정에 등록된 전화번호가 없습니다.')
      return null
    }
    
    // 받는 번호의 국가 코드 확인
    const toCountry = getCountryFromPhoneNumber(to)
    
    // 국가별로 매칭되는 번호 찾기
    for (const phoneNumber of accountInfo.phoneNumbers) {
      const fromCountry = getCountryFromPhoneNumber(phoneNumber)
      
      // 같은 국가면 우선 사용
      if (fromCountry === toCountry) {
        console.log(`[TWILIO_SMS] 같은 국가 매칭: ${phoneNumber} (${fromCountry})`)
        return phoneNumber
      }
    }
    
    // 같은 국가가 없으면 첫 번째 번호 사용
    console.log(`[TWILIO_SMS] 기본 번호 사용: ${accountInfo.phoneNumbers[0]}`)
    return accountInfo.phoneNumbers[0]
    
  } catch (error) {
    console.error('[TWILIO_SMS] 번호 조회 오류:', error)
    return null
  }
}

// 전화번호에서 국가 코드 추출
function getCountryFromPhoneNumber(phoneNumber: string): string {
  if (phoneNumber.startsWith('+82')) return 'KR'
  if (phoneNumber.startsWith('+56')) return 'CL'
  if (phoneNumber.startsWith('+52')) return 'MX'
  if (phoneNumber.startsWith('+51')) return 'PE'
  if (phoneNumber.startsWith('+1')) return 'US'
  return 'UNKNOWN'
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
