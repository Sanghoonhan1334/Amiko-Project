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
    const [hour, minute] = kstTime.split(':').map(Number)
    
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
    const [hour, minute] = userTime.split(':').map(Number)
    
    // 사용자 타임존의 시간을 로컬 Date 객체로 생성
    const userDateObj = new Date(year, month - 1, day, hour, minute)
    
    // 사용자 타임존의 시간을 UTC로 변환
    // 사용자 타임존에서 UTC로 변환하려면 타임존 offset을 빼야 함
    const userOffsetMs = getTimezoneOffsetMs(userTimezone)
    const utcTime = userDateObj.getTime() - userOffsetMs
    
    // UTC를 KST로 변환 (UTC+9)
    const kstTime = utcTime + (9 * 60 * 60 * 1000)
    const kstDateObj = new Date(kstTime)

    // KST 시간을 추출 (로컬 시간으로 해석)
    const kstYear = kstDateObj.getFullYear()
    const kstMonth = String(kstDateObj.getMonth() + 1).padStart(2, '0')
    const kstDay = String(kstDateObj.getDate()).padStart(2, '0')
    const kstHour = String(kstDateObj.getHours()).padStart(2, '0')
    const kstMinute = String(kstDateObj.getMinutes()).padStart(2, '0')

    return {
      date: `${kstYear}-${kstMonth}-${kstDay}`,
      time: `${kstHour}:${kstMinute}`
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

