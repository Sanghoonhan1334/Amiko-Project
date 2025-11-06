import { parsePhoneNumber, isValidPhoneNumber } from 'libphonenumber-js'

/**
 * 통일된 전화번호 정규화 함수
 * 보내기/검증 모두에서 동일한 E.164 형식 사용
 */
export function toE164(phoneNumber: string, countryCode?: string): string {
  if (!phoneNumber) return ''
  
  console.log('[PHONE_UTILS] toE164 호출:', { phoneNumber, countryCode })
  
  // 이미 E.164 형식이면 그대로 반환
  if (phoneNumber.startsWith('+')) {
    console.log('[PHONE_UTILS] 이미 E.164 형식:', phoneNumber)
    return phoneNumber
  }
  
  try {
    // 국가 코드가 있으면 사용, 없으면 자동 감지
    const parsed = countryCode 
      ? parsePhoneNumber(phoneNumber, countryCode as any)
      : parsePhoneNumber(phoneNumber)
    
    console.log('[PHONE_UTILS] parsePhoneNumber 결과:', { parsed: parsed?.number, isValid: parsed ? isValidPhoneNumber(parsed.number) : false })
    
    if (parsed && isValidPhoneNumber(parsed.number)) {
      console.log('[PHONE_UTILS] ✅ 파싱 성공:', parsed.number)
      return parsed.number
    }
  } catch (error) {
    console.error('[PHONE_UTILS] ❌ 전화번호 파싱 실패:', { phoneNumber, countryCode, error })
  }
  
  // 파싱 실패 시 수동으로 국가 코드 추가 (fallback)
  console.log('[PHONE_UTILS] 📋 libphonenumber-js 파싱 실패, 수동 포맷팅 시도')
  if (countryCode) {
    const { countries } = require('@/constants/countries')
    const country = countries.find((c: any) => c.code === countryCode)
    console.log('[PHONE_UTILS] 국가 정보:', { countryCode, found: !!country, phoneCode: country?.phoneCode })
    
    if (country && country.phoneCode) {
      const digits = phoneNumber.replace(/\D/g, '')
      const phoneCodeDigits = country.phoneCode.replace(/\D/g, '')
      
      console.log('[PHONE_UTILS] 전화번호 분석:', { 
        원본: phoneNumber, 
        숫자만: digits, 
        국가코드: country.phoneCode,
        국가코드숫자: phoneCodeDigits 
      })
      
      // 이미 국가 코드가 포함되어 있는지 확인
      if (digits.startsWith(phoneCodeDigits)) {
        const result = `+${digits}`
        console.log('[PHONE_UTILS] ✅ Fallback 성공 (국가코드 포함):', result)
        return result
      } else {
        // 한국의 경우 앞자리 0 제거
        if (countryCode === 'KR' && digits.startsWith('0')) {
          const result = `${country.phoneCode}${digits.substring(1)}`
          console.log('[PHONE_UTILS] ✅ Fallback 성공 (한국, 0 제거):', result)
          return result
        }
        const result = `${country.phoneCode}${digits}`
        console.log('[PHONE_UTILS] ✅ Fallback 성공 (국가코드 추가):', result)
        return result
      }
    }
  }
  
  // 국가 코드도 없으면 원본 반환
  console.warn('[PHONE_UTILS] ⚠️ Fallback 실패, 원본 반환:', phoneNumber)
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
