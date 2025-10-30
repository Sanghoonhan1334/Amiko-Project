/**
 * 예약 시스템용 타임존 변환 유틸리티
 * 한국인 파트너는 KST 기준으로 등록하고
 * 현지인들은 자신의 타임존으로 시간을 조회
 */

/**
 * KST 기준 시간을 다른 타임존의 동일한 절대 시간으로 변환
 * 예: 한국 2024-01-15 14:00 → 콜롬비아 2024-01-14 23:00 (UTC 기준으로 동일한 시점)
 * 
 * @param kstDate YYYY-MM-DD 형식의 날짜 (KST 기준)
 * @param kstTime HH:MM 형식의 시간 (KST 기준)
 * @param targetTimezone 변환할 타임존 (예: 'America/Bogota')
 * @returns 변환된 날짜와 시간 { date: 'YYYY-MM-DD', time: 'HH:MM' }
 */
export function convertKSTToUserTimezone(
  kstDate: string,
  kstTime: string,
  targetTimezone: string = 'Asia/Seoul'
): { date: string; time: string } {
  try {
    // KST 날짜와 시간을 UTC로 변환
    // KST는 UTC+9이므로 UTC로 변환하려면 9시간 빼야 함
    const [year, month, day] = kstDate.split('-').map(Number)
    // 시간 파싱: "05:10:00" 또는 "05:10" 형식 모두 처리
    const timeParts = kstTime.split(':')
    const [hour, minute] = [parseInt(timeParts[0], 10), parseInt(timeParts[1], 10)]
    
    // KST 시간을 ISO 문자열로 생성 (KST는 UTC+9)
    const kstISOString = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}T${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}:00+09:00`
    const kstDateObj = new Date(kstISOString)
    
    // kstDateObj는 이미 UTC 기준으로 저장되어 있음
    const utcDateObj = new Date(kstDateObj.getTime())

    // UTC 시간을 타임존으로 변환
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone: targetTimezone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    })

    const parts = formatter.formatToParts(utcDateObj)
    
    const yearStr = parts.find(p => p.type === 'year')?.value || ''
    const monthStr = parts.find(p => p.type === 'month')?.value || ''
    const dayStr = parts.find(p => p.type === 'day')?.value || ''
    const hourStr = parts.find(p => p.type === 'hour')?.value || ''
    const minuteStr = parts.find(p => p.type === 'minute')?.value || ''

    return {
      date: `${yearStr}-${monthStr}-${dayStr}`,
      time: `${hourStr.padStart(2, '0')}:${minuteStr.padStart(2, '0')}`
    }
  } catch (error) {
    console.error('타임존 변환 실패:', error)
    // 실패 시 원본 반환
    return {
      date: kstDate,
      time: kstTime
    }
  }
}

/**
 * 사용자 타임존의 시간을 KST 기준으로 변환 (역변환)
 * 예약 요청 시 사용자 타임존의 시간을 KST로 변환하여 저장
 * 
 * @param userDate YYYY-MM-DD 형식의 날짜 (사용자 타임존 기준)
 * @param userTime HH:MM 형식의 시간 (사용자 타임존 기준)
 * @param userTimezone 사용자의 타임존
 * @returns KST 기준 날짜와 시간 { date: 'YYYY-MM-DD', time: 'HH:MM' }
 */
export function convertUserTimezoneToKST(
  userDate: string,
  userTime: string,
  userTimezone: string
): { date: string; time: string } {
  try {
    // 사용자 타임존의 날짜와 시간을 파싱
    const [year, month, day] = userDate.split('-').map(Number)
    let [hour, minute] = userTime.split(':').map(Number)
    
    // 24:00은 유효하지 않으므로 다음날 00:00으로 처리
    if (hour === 24) {
      hour = 0
      // 날짜는 호출하는 쪽에서 처리하므로 여기서는 시간만 수정
      console.warn(`[convertUserTimezoneToKST] 24:00 시간 감지, 00:00으로 변환: ${userDate} ${userTime}`)
    }
    
    // 간단하고 정확한 방법: 지정한 시점의 타임존 오프셋을 이용해 UTC 타임스탬프 계산
    // 1) 사용자가 선택한 로컬(사용자 타임존) 시각의 "기준 UTC" 타임스탬프 생성
    const baseUtcMs = Date.UTC(year, month - 1, day, hour, minute, 0)

    // 2) 해당 시점에서 사용자 타임존의 UTC 오프셋(밀리초) 계산
    const getOffsetMsAt = (instantMs: number, tz: string): number => {
      const instDate = new Date(instantMs)
      const fmt = new Intl.DateTimeFormat('en-US', { timeZone: tz, timeZoneName: 'shortOffset' })
      const parts = fmt.formatToParts(instDate)
      let raw = parts.find(p => p.type === 'timeZoneName')?.value || '+00:00'
      // 표기 정규화: 'UTC-5', 'GMT-5', 'GMT-05:00', 'UTC−05:00' 등 지원
      raw = raw.replace(/^(UTC|GMT)\s*/i, '')
      raw = raw.replace('−', '-') // 유니코드 마이너스
      // 가능한 패턴: +HH:MM, -HH:MM, +HHMM, -HHMM, +H, -H
      const m = raw.match(/^([+-]?)(\d{1,2})(?::?(\d{2}))?$/)
      if (!m) {
        // 실패 시 안전하게 현재 시점 오프셋으로 대체 (근사치)
        const now = new Date()
        const utcNow = new Date(now.toLocaleString('en-US', { timeZone: 'UTC' })).getTime()
        const tzNow = new Date(now.toLocaleString('en-US', { timeZone: tz })).getTime()
        return tzNow - utcNow
      }
      const signChar = m[1] || '+'
      const hh = parseInt(m[2] || '0', 10)
      const mm = parseInt(m[3] || '0', 10)
      const sign = signChar === '-' ? -1 : 1
      return sign * (hh * 60 + mm) * 60 * 1000
    }

    const userOffsetMsAtInstant = getOffsetMsAt(baseUtcMs, userTimezone)

    // 3) 사용자 로컬(벽시계) 시간을 실제 UTC로 변환: 로컬 = UTC + offset → UTC = baseUtcMs - offset
    const exactUtcMs = baseUtcMs - userOffsetMsAtInstant

    // 4) KST로 포맷
    const kstFormatter = new Intl.DateTimeFormat('en-US', {
      timeZone: 'Asia/Seoul',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    })
    
    const kstParts = kstFormatter.formatToParts(new Date(exactUtcMs))
    const kstYear = kstParts.find(p => p.type === 'year')?.value || ''
    const kstMonth = kstParts.find(p => p.type === 'month')?.value || ''
    const kstDay = kstParts.find(p => p.type === 'day')?.value || ''
    const kstHour = kstParts.find(p => p.type === 'hour')?.value || ''
    const kstMinute = kstParts.find(p => p.type === 'minute')?.value || ''

    console.log(`[convertUserTimezoneToKST] ${userDate} ${userTime} (${userTimezone}) → KST ${kstYear}-${kstMonth}-${kstDay} ${kstHour}:${kstMinute}`)

    return {
      date: `${kstYear}-${kstMonth}-${kstDay}`,
      time: `${kstHour.padStart(2, '0')}:${kstMinute.padStart(2, '0')}`
    }
  } catch (error) {
    console.error('역변환 실패:', error)
    return {
      date: userDate,
      time: userTime
    }
  }
}

/**
 * 타임존의 UTC 오프셋 가져오기 (밀리초)
 */
function getTimezoneOffsetMs(timezone: string): number {
  try {
    const now = new Date()
    const utcTime = now.getTime() + (now.getTimezoneOffset() * 60000)
    
    // 타임존의 현재 시간을 가져와서 UTC와의 차이 계산
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone: timezone,
      timeZoneName: 'shortOffset'
    })
    
    const parts = formatter.formatToParts(now)
    const offsetString = parts.find(p => p.type === 'timeZoneName')?.value || '+00:00'
    
    // +09:00 형식을 파싱
    const match = offsetString.match(/([+-])(\d{2}):(\d{2})/)
    if (!match) return 0
    
    const sign = match[1] === '+' ? 1 : -1
    const hours = parseInt(match[2], 10)
    const minutes = parseInt(match[3], 10)
    
    return sign * (hours * 60 + minutes) * 60 * 1000
  } catch {
    // 실패 시 간단한 방법 사용
    const now = new Date()
    const utcDate = new Date(now.toLocaleString('en-US', { timeZone: 'UTC' }))
    const tzDate = new Date(now.toLocaleString('en-US', { timeZone: timezone }))
    return tzDate.getTime() - utcDate.getTime()
  }
}

/**
 * 타임존의 UTC 오프셋 가져오기 (시간 단위)
 */
function getTimezoneOffset(timezone: string): number {
  try {
    const now = new Date()
    const utcTime = now.getTime() + (now.getTimezoneOffset() * 60000)
    const localeTimeString = now.toLocaleString('en-US', { timeZone: timezone })
    const localeTime = new Date(localeTimeString)
    
    return (localeTime.getTime() - utcTime) / (1000 * 60 * 60)
  } catch {
    return 0
  }
}

/**
 * 타임존 이름을 표시 이름으로 변환
 */
export function getTimezoneDisplayName(timezone: string): string {
  const timezoneNames: Record<string, string> = {
    'Asia/Seoul': '한국 시간 (KST)',
    'America/Bogota': '콜롬비아 시간 (COT)',
    'America/Mexico_City': '멕시코 시간 (CST)',
    'America/Lima': '페루 시간 (PET)',
    'America/Santiago': '칠레 시간 (CLT)',
    'America/Buenos_Aires': '아르헨티나 시간 (ART)',
    'America/Sao_Paulo': '브라질 시간 (BRT)',
    'America/New_York': '미국 동부 시간 (EST)',
    'America/Los_Angeles': '미국 서부 시간 (PST)',
    'Europe/London': '영국 시간 (GMT)',
    'Europe/Madrid': '스페인 시간 (CET)'
  }
  
  return timezoneNames[timezone] || timezone
}

/**
 * 전화번호에서 국가번호 추출
 * E.164 형식 (+821012345678) 또는 다른 형식 지원
 * 
 * @param phoneNumber 전화번호 (예: +821012345678, +51 987654321, 010-1234-5678)
 * @returns 국가번호 (예: '82', '51', '57') 또는 null
 */
export function extractCountryCodeFromPhone(phoneNumber: string | null | undefined): string | null {
  if (!phoneNumber) {
    return null
  }
  
  // 숫자와 +, 공백만 추출
  const cleaned = phoneNumber.replace(/\D/g, '')
  
  if (cleaned.length === 0) {
    return null
  }
  
  // +로 시작하는 경우 (+ 제거하고 첫 숫자부터)
  // 전화번호는 보통 +로 시작하거나 국가번호로 시작
  
  // 주요 국가번호 매핑 (2-3자리)
  // +1 (미국, 캐나다) - 1자리
  // +82 (한국) - 2자리
  // +51 (페루) - 2자리
  // +57 (콜롬비아) - 2자리
  // +52 (멕시코) - 2자리
  // +56 (칠레) - 2자리
  // +54 (아르헨티나) - 2자리
  // +55 (브라질) - 2자리
  // +34 (스페인) - 2자리
  // +86 (중국) - 2자리
  // +81 (일본) - 2자리
  // +33 (프랑스) - 2자리
  // +49 (독일) - 2자리
  // +44 (영국) - 2자리
  // +39 (이탈리아) - 2자리
  // +7 (러시아, 카자흐스탄) - 1자리
  
  // 먼저 2자리 코드 확인
  const twoDigitCodes: Record<string, string> = {
    '82': '82', // 한국
    '51': '51', // 페루
    '57': '57', // 콜롬비아
    '52': '52', // 멕시코
    '56': '56', // 칠레
    '54': '54', // 아르헨티나
    '55': '55', // 브라질
    '34': '34', // 스페인
    '86': '86', // 중국
    '81': '81', // 일본
    '33': '33', // 프랑스
    '49': '49', // 독일
    '44': '44', // 영국
    '39': '39', // 이탈리아
    '46': '46', // 스웨덴
    '47': '47', // 노르웨이
    '45': '45', // 덴마크
    '31': '31', // 네덜란드
    '32': '32', // 벨기에
    '41': '41', // 스위스
    '43': '43', // 오스트리아
    '61': '61', // 호주
    '64': '64', // 뉴질랜드
    '27': '27', // 남아공
    '91': '91', // 인도
    '62': '62', // 인도네시아
    '60': '60', // 말레이시아
    '65': '65', // 싱가포르
    '66': '66', // 태국
    '84': '84', // 베트남
    '63': '63', // 필리핀
  }
  
  // 1자리 코드 (미국, 캐나다, 러시아 등)
  if (cleaned.startsWith('1') && cleaned.length >= 10) {
    return '1'
  }
  
  // 2자리 코드 확인
  const firstTwo = cleaned.substring(0, 2)
  if (twoDigitCodes[firstTwo]) {
    return firstTwo
  }
  
  // 한국 전화번호 특수 처리 (010-1234-5678 형식)
  if (cleaned.startsWith('010')) {
    return '82'
  }
  
  // 매핑되지 않은 경우 null 반환
  return null
}

/**
 * 회원가입 시 선택한 국가 코드를 타임존으로 변환
 * 회원가입 시 사용자가 직접 선택한 국가 코드를 최우선으로 사용하고,
 * 없을 경우 전화번호에서 국가번호를 추출하여 사용
 * 모든 타임존 결정 로직에서 이 함수만 사용하도록 통일
 * 
 * @param phoneNumber 회원가입 시 입력한 전화번호 (user_metadata.phone) - fallback용
 * @param countryCode 회원가입 시 선택한 국가 코드 (user_metadata.country) - 최우선 사용
 * @returns 타임존 문자열 (예: 'Asia/Seoul', 'America/Lima')
 */
export function getTimezoneFromPhoneNumber(
  phoneNumber: string | null | undefined,
  countryCode?: string | null | undefined
): string {
  let phoneCountryCode: string | null = null
  
  // 1. 최우선: 회원가입 시 선택한 국가 코드 사용
  // 회원가입 페이지에서 사용자가 국가 코드 드롭다운에서 직접 선택한 값
  if (countryCode) {
    // 국가 코드를 국가번호로 변환하는 매핑
    const countryToPhoneCode: Record<string, string> = {
      'KR': '82',
      'KOREA': '82',
      '대한민국': '82',
      'PE': '51',
      'PERU': '51',
      '페루': '51',
      'CO': '57',
      'COLOMBIA': '57',
      '콜롬비아': '57',
      'MX': '52',
      'MEXICO': '52',
      '멕시코': '52',
      'CL': '56',
      'CHILE': '56',
      '칠레': '56',
      'AR': '54',
      'ARGENTINA': '54',
      '아르헨티나': '54',
      'BR': '55',
      'BRAZIL': '55',
      '브라질': '55',
      'US': '1',
      'USA': '1',
      'CA': '1',
      'CANADA': '1',
      '캐나다': '1',
      'ES': '34',
      'SPAIN': '34',
      '스페인': '34',
      'VE': '58',
      'VENEZUELA': '58',
      '베네수엘라': '58',
      'EC': '593',
      'ECUADOR': '593',
      '에콰도르': '593',
      'GT': '502',
      'GUATEMALA': '502',
      '과테말라': '502',
      'HN': '504',
      'HONDURAS': '504',
      '온두라스': '504',
      'NI': '505',
      'NICARAGUA': '505',
      '니카라과': '505',
      'PA': '507',
      'PANAMA': '507',
      '파나마': '507',
      'PY': '595',
      'PARAGUAY': '595',
      '파라과이': '595',
      'UY': '598',
      'URUGUAY': '598',
      '우루과이': '598',
      'BO': '591',
      'BOLIVIA': '591',
      '볼리비아': '591',
      'CR': '506',
      'COSTA_RICA': '506',
      '코스타리카': '506',
      'DO': '1',
      'DOMINICAN_REPUBLIC': '1',
      '도미니카공화국': '1',
      'SV': '503',
      'EL_SALVADOR': '503',
      '엘살바도르': '503',
      'CU': '53',
      'CUBA': '53',
      '쿠바': '53',
      'PR': '1',
      'PUERTO_RICO': '1',
      '푸에르토리코': '1',
      'JP': '81',
      'JAPAN': '81',
      '일본': '81',
      'CN': '86',
      'CHINA': '86',
      '중국': '86',
    }
    
    const upperCountry = countryCode.toUpperCase()
    phoneCountryCode = countryToPhoneCode[upperCountry] || null
    console.log(`[getTimezoneFromPhoneNumber] 국가 코드 우선 사용: ${countryCode} → ${phoneCountryCode || '없음'}`)
  }
  
  // 2. Fallback: 전화번호에서 국가번호 추출 시도 (countryCode로 타임존을 찾지 못한 경우만)
  if (!phoneCountryCode) {
    phoneCountryCode = extractCountryCodeFromPhone(phoneNumber)
    if (phoneCountryCode) {
      console.log(`[getTimezoneFromPhoneNumber] 전화번호에서 국가번호 추출: ${phoneNumber} → ${phoneCountryCode}`)
    }
  }
  
  // 여전히 국가번호를 찾지 못했다면 기본값 반환
  if (!phoneCountryCode) {
    console.log(`[getTimezoneFromPhoneNumber] 국가번호를 찾지 못함, 기본값 사용: America/Lima`)
    // 기본값: 페루 (대부분의 현지 사용자)
    return 'America/Lima'
  }
  
  // 국가번호 → 타임존 매핑 (phoneCountryCode 사용)
  const countryCodeTimezoneMap: Record<string, string> = {
    '1': 'America/New_York', // 미국, 캐나다, 도미니카공화국, 푸에르토리코 (기본값: 동부 시간)
    '82': 'Asia/Seoul', // 한국
    '51': 'America/Lima', // 페루
    '57': 'America/Bogota', // 콜롬비아
    '52': 'America/Mexico_City', // 멕시코
    '56': 'America/Santiago', // 칠레
    '54': 'America/Buenos_Aires', // 아르헨티나
    '55': 'America/Sao_Paulo', // 브라질
    '58': 'America/Caracas', // 베네수엘라
    '593': 'America/Guayaquil', // 에콰도르
    '502': 'America/Guatemala', // 과테말라
    '504': 'America/Tegucigalpa', // 온두라스
    '505': 'America/Managua', // 니카라과
    '507': 'America/Panama', // 파나마
    '595': 'America/Asuncion', // 파라과이
    '598': 'America/Montevideo', // 우루과이
    '591': 'America/La_Paz', // 볼리비아
    '506': 'America/Costa_Rica', // 코스타리카
    '503': 'America/El_Salvador', // 엘살바도르
    '53': 'America/Havana', // 쿠바
    '34': 'Europe/Madrid', // 스페인
    '86': 'Asia/Shanghai', // 중국
    '81': 'Asia/Tokyo', // 일본
    '33': 'Europe/Paris', // 프랑스
    '49': 'Europe/Berlin', // 독일
    '44': 'Europe/London', // 영국
    '39': 'Europe/Rome', // 이탈리아
    '46': 'Europe/Stockholm', // 스웨덴
    '47': 'Europe/Oslo', // 노르웨이
    '45': 'Europe/Copenhagen', // 덴마크
    '31': 'Europe/Amsterdam', // 네덜란드
    '32': 'Europe/Brussels', // 벨기에
    '41': 'Europe/Zurich', // 스위스
    '43': 'Europe/Vienna', // 오스트리아
    '61': 'Australia/Sydney', // 호주
    '64': 'Pacific/Auckland', // 뉴질랜드
    '27': 'Africa/Johannesburg', // 남아공
    '91': 'Asia/Kolkata', // 인도
    '62': 'Asia/Jakarta', // 인도네시아
    '60': 'Asia/Kuala_Lumpur', // 말레이시아
    '65': 'Asia/Singapore', // 싱가포르
    '66': 'Asia/Bangkok', // 태국
    '84': 'Asia/Ho_Chi_Minh', // 베트남
    '63': 'Asia/Manila', // 필리핀
  }
  
  // 매핑된 타임존이 있으면 반환
  if (countryCodeTimezoneMap[phoneCountryCode]) {
    return countryCodeTimezoneMap[phoneCountryCode]
  }
  
  // 매핑되지 않은 경우 기본값: 페루
  return 'America/Lima'
}

/**
 * @deprecated 회원가입 시 선택한 국적 코드 대신 전화번호를 사용하세요.
 * getTimezoneFromPhoneNumber를 사용하세요.
 */
export function getTimezoneFromCountryCode(countryCode: string | null | undefined): string {
  if (!countryCode) {
    return 'America/Lima'
  }
  
  const code = countryCode.toUpperCase()
  const countryTimezoneMap: Record<string, string> = {
    'KR': 'Asia/Seoul',
    '대한민국': 'Asia/Seoul',
    'SOUTH KOREA': 'Asia/Seoul',
    'KOREA': 'Asia/Seoul',
    'KOR': 'Asia/Seoul',
    'PE': 'America/Lima',
    'PERU': 'America/Lima',
    '페루': 'America/Lima',
    'CO': 'America/Bogota',
    'COLOMBIA': 'America/Bogota',
    '콜롬비아': 'America/Bogota',
    'MX': 'America/Mexico_City',
    'MEXICO': 'America/Mexico_City',
    '멕시코': 'America/Mexico_City',
    'CL': 'America/Santiago',
    'CHILE': 'America/Santiago',
    '칠레': 'America/Santiago',
    'AR': 'America/Buenos_Aires',
    'ARGENTINA': 'America/Buenos_Aires',
    '아르헨티나': 'America/Buenos_Aires',
    'BR': 'America/Sao_Paulo',
    'BRAZIL': 'America/Sao_Paulo',
    '브라질': 'America/Sao_Paulo',
    'US': 'America/New_York',
    'USA': 'America/New_York',
    'UNITED STATES': 'America/New_York',
    'ES': 'Europe/Madrid',
    'SPAIN': 'Europe/Madrid',
    '스페인': 'Europe/Madrid'
  }
  
  if (countryTimezoneMap[code]) {
    return countryTimezoneMap[code]
  }
  
  return 'America/Lima'
}

