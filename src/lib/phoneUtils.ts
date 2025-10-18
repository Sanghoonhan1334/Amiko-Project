import { parsePhoneNumber, isValidPhoneNumber } from 'libphonenumber-js'

/**
 * 통일된 전화번호 정규화 함수
 * 보내기/검증 모두에서 동일한 E.164 형식 사용
 */
export function toE164(phoneNumber: string, countryCode?: string): string {
  if (!phoneNumber) return ''
  
  // 이미 E.164 형식이면 그대로 반환
  if (phoneNumber.startsWith('+')) {
    return phoneNumber
  }
  
  try {
    // 국가 코드가 있으면 사용, 없으면 자동 감지
    const parsed = countryCode 
      ? parsePhoneNumber(phoneNumber, countryCode as any)
      : parsePhoneNumber(phoneNumber)
    
    if (parsed && isValidPhoneNumber(parsed.number)) {
      return parsed.number
    }
  } catch (error) {
    console.warn('[PHONE_UTILS] 전화번호 파싱 실패:', phoneNumber, error)
  }
  
  // 파싱 실패 시 원본 반환 (fallback)
  return phoneNumber
}

/**
 * 유니코드 숫자만 추출 (앞자리 0 유지)
 * parseInt/Number 사용 금지, 항상 문자열 유지
 */
export function normalizeDigits(code: string): string {
  if (!code) return ''
  
  // 모든 유니코드 숫자를 ASCII 숫자로 변환
  const normalized = code.replace(/[\u0660-\u0669\u06F0-\u06F9]/g, (c) => 
    String.fromCharCode(c.charCodeAt(0) - (c.charCodeAt(0) >= 0x06F0 ? 0x06F0 : 0x0660) + 48)
  ).replace(/\D/g, '')
  
  // 길이 6 확인
  if (normalized.length !== 6) {
    console.warn('[PHONE_UTILS] 코드 길이 이상:', { original: code, normalized, length: normalized.length })
  }
  
  return normalized
}

/**
 * 안전한 문자열 비교 (timingSafeEqual 대체)
 * 길이가 다르면 false 반환 (예외 던지지 않음)
 */
export async function safeCompare(a: string, b: string): Promise<boolean> {
  if (a.length !== b.length) {
    console.warn('[PHONE_UTILS] 비교 실패 - 길이 불일치:', { aLength: a.length, bLength: b.length })
    return false
  }
  
  try {
    // crypto 모듈 동적 import (Edge Runtime 호환)
    const crypto = await import('crypto')
    return crypto.timingSafeEqual(Buffer.from(a), Buffer.from(b))
  } catch (error) {
    console.warn('[PHONE_UTILS] timingSafeEqual 실패, 일반 비교 사용:', error)
    return a === b // Fallback
  }
}
