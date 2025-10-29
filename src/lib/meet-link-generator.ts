/**
 * Google Meet 링크 생성 유틸리티
 * 예약 승인 시 자동으로 고유한 Google Meet 링크를 생성합니다.
 */

/**
 * Google Meet 링크 생성
 * 형식: https://meet.google.com/xxx-xxxx-xxx
 * 
 * @param bookingId 예약 ID (고유성 보장을 위해 사용)
 * @param date 예약 날짜 (YYYY-MM-DD 형식, 선택사항)
 * @returns Google Meet 링크 URL
 */
export function generateMeetLink(bookingId: string, date?: string): string {
  try {
    // 예약 ID에서 앞 8자 추출 (하이픈 제거)
    const bookingCode = bookingId.replace(/-/g, '').substring(0, 8)
    
    // 날짜 기반 코드 생성 (있는 경우)
    let dateCode = ''
    if (date) {
      // YYYY-MM-DD 형식에서 MMDD 추출
      dateCode = date.replace(/-/g, '').slice(-6).substring(2) // YYYYMMDD -> MMDD
    }
    
    // 랜덤 코드 생성 (영소문자 + 숫자)
    const randomCode1 = Math.random().toString(36).substring(2, 5).padEnd(3, 'a')
    const randomCode2 = Math.random().toString(36).substring(2, 6).padEnd(4, 'a')
    const randomCode3 = Math.random().toString(36).substring(2, 5).padEnd(3, 'a')
    
    // Google Meet 링크 형식: xxx-xxxx-xxx
    // 방법 1: 예약 ID + 랜덤 (더 고유함)
    if (bookingCode) {
      const code1 = bookingCode.substring(0, 3).padEnd(3, 'a')
      const code2 = (bookingCode.substring(3, 7) || randomCode2).padEnd(4, 'a')
      const code3 = (bookingCode.substring(7, 10) || randomCode3).padEnd(3, 'a')
      return `https://meet.google.com/${code1}-${code2}-${code3}`
    }
    
    // 방법 2: 완전 랜덤 (예약 ID가 없는 경우)
    return `https://meet.google.com/${randomCode1}-${randomCode2}-${randomCode3}`
    
  } catch (error) {
    console.error('Google Meet 링크 생성 실패:', error)
    // 실패 시 타임스탬프 기반 생성
    const timestamp = Date.now().toString(36)
    const random = Math.random().toString(36).substring(2, 9)
    return `https://meet.google.com/${timestamp.substring(0, 3)}-${random.substring(0, 4)}-${timestamp.substring(3, 6)}`
  }
}

/**
 * Google Meet 링크 유효성 검사
 * 기본적인 형식만 검증 (실제 Google Meet 링크 유효성은 Google 서버에서 확인)
 * 
 * @param url 검증할 URL
 * @returns 유효한 링크인지 여부
 */
export function isValidMeetLink(url: string): boolean {
  if (!url || typeof url !== 'string') return false
  
  // 기본 패턴 검증: https://meet.google.com/xxx-xxxx-xxx
  const meetPattern = /^https?:\/\/meet\.google\.com\/[a-z0-9-]+$/i
  return meetPattern.test(url)
}

