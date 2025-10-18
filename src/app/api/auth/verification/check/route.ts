import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { formatPhoneNumber } from '@/lib/twilioService'

// Edge 런타임 문제 방지
export const runtime = 'nodejs'

// crypto는 dynamic import로 사용
let crypto: typeof import('crypto') | null = null
async function getCrypto() {
  if (!crypto) {
    crypto = await import('crypto')
  }
  return crypto
}

// 유니코드 숫자만 추출 (앞자리 0 유지)
function normalizeDigits(code: string): string {
  if (!code) return ''
  // 모든 유니코드 숫자를 ASCII 숫자로 변환
  return code.replace(/[\u0660-\u0669\u06F0-\u06F9]/g, (c) => 
    String.fromCharCode(c.charCodeAt(0) - (c.charCodeAt(0) >= 0x06F0 ? 0x06F0 : 0x0660) + 48)
  ).replace(/\D/g, '')
}

// E.164 형식으로 전화번호 정규화 (발송/검증 통일)
function toE164(phoneNumber: string, countryCode?: string): string {
  if (!phoneNumber) return ''
  
  // 이미 E.164 형식이면 그대로 반환
  if (phoneNumber.startsWith('+')) {
    return phoneNumber
  }
  
  // formatPhoneNumber 사용
  return formatPhoneNumber(phoneNumber, countryCode)
}

// 안전한 문자열 비교 (timing attack 방지)
async function safeCompare(a: string, b: string): Promise<boolean> {
  if (!a || !b) return false
  
  // 길이가 다르면 false (throw 하지 않음)
  if (a.length !== b.length) {
    console.log('[SAFE_COMPARE] 길이 불일치:', { aLen: a.length, bLen: b.length })
    return false
  }
  
  try {
    const cryptoModule = await getCrypto()
    const bufA = Buffer.from(a)
    const bufB = Buffer.from(b)
    return cryptoModule.timingSafeEqual(bufA, bufB)
  } catch (err) {
    console.error('[SAFE_COMPARE] 비교 실패:', err)
    // Fallback: 단순 문자열 비교
    return a === b
  }
}

export async function POST(request: NextRequest) {
  let requestBody: any = null
  
  try {
    console.log('[VERIFICATION_CHECK] ========================================')
    console.log('[VERIFICATION_CHECK] 인증코드 검증 시작')
    console.log('[VERIFICATION_CHECK] 환경:', process.env.NODE_ENV)
    
    requestBody = await request.json()
    const { email, phoneNumber, code, type, nationality } = requestBody
    
    console.log('[VERIFICATION_CHECK] 요청 데이터:', { email, phoneNumber, code, type, nationality })
    
    // 입력 코드 정규화 (유니코드 숫자 처리)
    const normalizedInputCode = normalizeDigits(code)
    console.log('[VERIFICATION_CHECK] 코드 정규화:', { 
      original: code, 
      normalized: normalizedInputCode, 
      length: normalizedInputCode.length,
      type: typeof normalizedInputCode
    })
    
    // 전화번호 정규화 (발송/검증 통일된 함수 사용)
    let normalizedPhoneNumber = phoneNumber
    if (phoneNumber) {
      // nationality가 없어도 전화번호 정규화 시도
      normalizedPhoneNumber = toE164(phoneNumber, nationality)
      console.log('[VERIFICATION_CHECK] 전화번호 정규화 (toE164):', { 
        original: phoneNumber, 
        normalized: normalizedPhoneNumber, 
        nationality: nationality || 'auto-detect'
      })
    }
    
    // 유효성 검사
    if ((!email && !phoneNumber) || !normalizedInputCode) {
      return NextResponse.json(
        { success: false, reason: 'INVALID_INPUT', error: '이메일 또는 전화번호와 인증코드가 필요합니다.' },
        { status: 400 }
      )
    }

    const supabase = createClient()

    // 데이터베이스에서 가장 최신 인증코드 조회 (DESC LIMIT 1)
    let query = supabase
      .from('verification_codes')
      .select('*')
      .eq('type', type)
      .eq('verified', false)
      .order('created_at', { ascending: false }) // 최신순 정렬
      .limit(1) // 가장 최신 1건만

    if (email) {
      query = query.eq('email', email)
    }
    if (normalizedPhoneNumber) {
      query = query.eq('phone_number', normalizedPhoneNumber)
    }

    const { data: verificationData, error: verificationError } = await query.single()

    console.log('[VERIFICATION_CHECK] 데이터베이스 조회 결과:', { 
      found: !!verificationData,
      error: verificationError,
      queryConditions: {
        type,
        phoneNumber: normalizedPhoneNumber,
        email
      }
    })
    
    // DB 조회 결과 상세 로깅
    if (verificationData) {
      const dbCode = normalizeDigits(verificationData.code || '')
      console.log('[VERIFICATION_CHECK] DB 코드 상세:', {
        dbCode: verificationData.code,
        dbCodeNormalized: dbCode,
        dbCodeLength: dbCode.length,
        dbCodeType: typeof verificationData.code,
        createdAt: verificationData.created_at,
        expiresAt: verificationData.expires_at,
        verified: verificationData.verified,
        phoneNumber: verificationData.phone_number
      })
      console.log('[VERIFICATION_CHECK] 입력 코드 상세:', {
        inputCode: code,
        inputCodeNormalized: normalizedInputCode,
        inputCodeLength: normalizedInputCode.length,
        inputCodeType: typeof code
      })
    }

    // DB에서 코드를 찾지 못한 경우
    if (verificationError || !verificationData) {
      console.error('[VERIFICATION_CHECK] ❌ DB 조회 실패 또는 데이터 없음')
      console.error('[VERIFICATION_CHECK] 에러:', verificationError)
      
      // 디버깅: 최근 5개 미인증 코드 조회
      const { data: allCodes } = await supabase
        .from('verification_codes')
        .select('*')
        .eq('type', type)
        .eq('verified', false)
        .order('created_at', { ascending: false })
        .limit(5)
      
      console.log('[VERIFICATION_CHECK] 최근 5개 미인증 코드:', allCodes?.map(c => ({
        code: c.code,
        phone: c.phone_number,
        email: c.email,
        created: c.created_at,
        expires: c.expires_at,
        expired: new Date(c.expires_at) < new Date()
      })))
      
      return NextResponse.json(
        { success: false, reason: 'NOT_FOUND', error: '인증코드가 만료되었거나 존재하지 않습니다.' },
        { status: 400 }
      )
    }
    
    // 만료 확인
    const now = new Date()
    const expiresAt = new Date(verificationData.expires_at)
    if (expiresAt < now) {
      console.error('[VERIFICATION_CHECK] ❌ 코드 만료')
      console.error('[VERIFICATION_CHECK] 만료 시각:', expiresAt.toISOString())
      console.error('[VERIFICATION_CHECK] 현재 시각:', now.toISOString())
      
      return NextResponse.json(
        { success: false, reason: 'EXPIRED', error: '인증코드가 만료되었습니다.' },
        { status: 400 }
      )
    }
    
    // 코드 비교 (normalizeDigits로 정규화 후 비교)
    const dbCode = normalizeDigits(verificationData.code || '')
    const isMatch = await safeCompare(dbCode, normalizedInputCode)
    
    console.log('[VERIFICATION_CHECK] 코드 비교 결과:', {
      dbCode,
      inputCode: normalizedInputCode,
      match: isMatch
    })
    
    if (!isMatch) {
      console.error('[VERIFICATION_CHECK] ❌ 코드 불일치')
      
      return NextResponse.json(
        { success: false, reason: 'MISMATCH', error: '인증코드가 일치하지 않습니다.' },
        { status: 400 }
      )
    }

    // 인증코드를 verified로 업데이트
    console.log('[VERIFICATION_CHECK] ✅ 코드 일치! 인증 처리 중...')
    
    const { error: updateError } = await supabase
      .from('verification_codes')
      .update({ 
        verified: true, 
        verified_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', verificationData.id)

    if (updateError) {
      console.error('[VERIFICATION_CHECK] ❌ 인증코드 업데이트 실패:', updateError)
      
      return NextResponse.json(
        { success: false, reason: 'UPDATE_FAILED', error: '인증 처리 중 오류가 발생했습니다.' },
        { status: 400 }
      )
    }

    console.log('[VERIFICATION_CHECK] ✅✅✅ 인증 성공!')
    console.log('[VERIFICATION_CHECK] ========================================')
    
    return NextResponse.json({
      success: true,
      message: '인증이 완료되었습니다.',
      timestamp: new Date().toISOString()
    })
    
  } catch (error) {
    // 무조건 콘솔 로그 출력
    console.error('[VERIFICATION_CHECK] ========================================')
    console.error('[VERIFICATION_CHECK] ❌❌❌ 예외 발생!')
    console.error('[VERIFICATION_CHECK] 에러 타입:', error?.constructor?.name)
    console.error('[VERIFICATION_CHECK] 에러 메시지:', error instanceof Error ? error.message : String(error))
    console.error('[VERIFICATION_CHECK] 에러 스택:', error instanceof Error ? error.stack : 'N/A')
    
    // 입력값 로깅 (이미 파싱된 경우)
    if (requestBody) {
      console.error('[VERIFICATION_CHECK] 입력값:', {
        email: requestBody.email,
        phoneNumber: requestBody.phoneNumber,
        code: requestBody.code,
        type: requestBody.type,
        nationality: requestBody.nationality
      })
    } else {
      console.error('[VERIFICATION_CHECK] 입력값: 파싱 전 에러 발생')
    }
    
    console.error('[VERIFICATION_CHECK] ========================================')
    
    const errorMessage = error instanceof Error ? error.message : '알 수 없는 오류'
    const errorName = error instanceof Error ? error.name : 'UnknownError'
    
    // 500이 아닌 400 응답으로 변경
    return NextResponse.json(
      { 
        success: false, 
        reason: errorMessage,
        errorType: errorName,
        timestamp: new Date().toISOString()
      },
      { status: 400 }
    )
  }
}