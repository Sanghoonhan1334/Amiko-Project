/**
 * 시간대 관련 유틸리티 함수들
 */

// 사용자의 시간대 설정 (기본값: 한국)
let userTimezone = 'Asia/Seoul'

// 사용자 시간대 설정
export const setUserTimezone = (timezone: string) => {
  userTimezone = timezone
}

// 사용자 시간대 가져오기
export const getUserTimezone = () => userTimezone

/**
 * UTC 시간을 사용자 시간대로 변환
 * @param utcTime UTC 시간 문자열 또는 Date 객체
 * @param targetTimezone 대상 시간대 (기본값: 사용자 설정)
 * @returns 변환된 시간 문자열
 */
export const convertToUserTimezone = (
  utcTime: string | Date,
  targetTimezone?: string
): string => {
  try {
    const date = new Date(utcTime)
    const timezone = targetTimezone || userTimezone
    
    return date.toLocaleString('ko-KR', {
      timeZone: timezone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    })
  } catch (error) {
    console.error('시간대 변환 실패:', error)
    return '시간 정보 없음'
  }
}

/**
 * 시간만 표시 (시간대 변환)
 * @param utcTime UTC 시간
 * @param targetTimezone 대상 시간대
 * @returns 시간 문자열 (HH:MM)
 */
export const formatTimeOnly = (
  utcTime: string | Date,
  targetTimezone?: string
): string => {
  try {
    const date = new Date(utcTime)
    const timezone = targetTimezone || userTimezone
    
    return date.toLocaleTimeString('ko-KR', {
      timeZone: timezone,
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    })
  } catch (error) {
    console.error('시간 표시 실패:', error)
    return '--:--'
  }
}

/**
 * 날짜만 표시 (시간대 변환)
 * @param utcTime UTC 시간
 * @param targetTimezone 대상 시간대
 * @returns 날짜 문자열 (YYYY-MM-DD)
 */
export const formatDateOnly = (
  utcTime: string | Date,
  targetTimezone?: string
): string => {
  try {
    const date = new Date(utcTime)
    const timezone = targetTimezone || userTimezone
    
    return date.toLocaleDateString('ko-KR', {
      timeZone: timezone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    })
  } catch (error) {
    console.error('날짜 표시 실패:', error)
    return '----/--/--'
  }
}

/**
 * 상대적 시간 표시 (예: 2시간 전, 3일 전)
 * @param utcTime UTC 시간
 * @param targetTimezone 대상 시간대
 * @returns 상대적 시간 문자열
 */
export const formatRelativeTime = (
  utcTime: string | Date,
  targetTimezone?: string
): string => {
  try {
    const date = new Date(utcTime)
    const timezone = targetTimezone || userTimezone
    
    // 사용자 시간대로 변환된 현재 시간
    const now = new Date()
    const userNow = new Date(now.toLocaleString('en-US', { timeZone: timezone }))
    const userDate = new Date(date.toLocaleString('en-US', { timeZone: timezone }))
    
    const diffMs = userNow.getTime() - userDate.getTime()
    const diffSeconds = Math.floor(diffMs / 1000)
    const diffMinutes = Math.floor(diffSeconds / 60)
    const diffHours = Math.floor(diffMinutes / 60)
    const diffDays = Math.floor(diffHours / 24)
    
    if (diffDays > 0) {
      return `${diffDays}일 전`
    } else if (diffHours > 0) {
      return `${diffHours}시간 전`
    } else if (diffMinutes > 0) {
      return `${diffMinutes}분 전`
    } else {
      return '방금 전'
    }
  } catch {
    console.error('상대적 시간 표시 실패')
    return '시간 정보 없음'
  }
}

/**
 * 시간대별 현재 시간 비교
 * @param timezones 시간대 배열
 * @returns 각 시간대별 현재 시간
 */
export const getCurrentTimes = (timezones: string[]) => {
  return timezones.map(timezone => ({
    timezone,
    currentTime: new Date().toLocaleTimeString('ko-KR', {
      timeZone: timezone,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false
    }),
    offset: getTimezoneOffset(timezone)
  }))
}

/**
 * 시간대 오프셋 가져오기
 * @param timezone 시간대
 * @returns UTC 오프셋 (예: +09:00, -05:00)
 */
export const getTimezoneOffset = (timezone: string): string => {
  try {
    const date = new Date()
    const utc = date.getTime() + (date.getTimezoneOffset() * 60000)
    
    // 시간대별 현재 시간을 Date 객체로 변환
    const targetDate = new Date()
    const targetTimeString = targetDate.toLocaleString('en-US', { timeZone: timezone })
    const target = new Date(targetTimeString)
    
    const offset = (target.getTime() - utc) / (1000 * 60 * 60)
    
    const sign = offset >= 0 ? '+' : '-'
    const hours = Math.abs(Math.floor(offset))
    const minutes = Math.abs(Math.floor((offset % 1) * 60))
    
    return `${sign}${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`
  } catch {
    return '+00:00'
  }
}

/**
 * 예약 가능 시간대 확인 (업무 시간 체크)
 * @param timezone 사용자 시간대
 * @param time 예약 시간
 * @returns 업무 시간 내 여부
 */
export const isBusinessHours = (
  timezone: string,
  time: string | Date
): boolean => {
  try {
    const date = new Date(time)
    const userTime = new Date(date.toLocaleString('en-US', { timeZone: timezone }))
    const hour = userTime.getHours()
    
    // 일반적인 업무 시간: 오전 9시 ~ 오후 6시
    return hour >= 9 && hour < 18
  } catch {
    return false
  }
}

/**
 * 시간대별 업무 시간 표시
 * @param timezone 시간대
 * @returns 업무 시간 문자열
 */
export const getBusinessHours = (timezone: string): string => {
  try {
    const now = new Date()
    const userNow = new Date(now.toLocaleString('en-US', { timeZone: timezone }))
    const hour = userNow.getHours()
    
    if (hour >= 9 && hour < 18) {
      return '업무 시간'
    } else if (hour < 9) {
      return `업무 시작까지 ${9 - hour}시간`
    } else {
      return `업무 종료 후 ${hour - 18}시간`
    }
  } catch {
    return '업무 시간 정보 없음'
  }
}
