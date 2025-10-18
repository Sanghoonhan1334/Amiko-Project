import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { toE164, normalizeDigits, safeCompare } from '@/lib/phoneUtils'

// Edge 런타임 문제 방지
export const runtime = 'nodejs'

export async function POST(request: NextRequest) {
  let requestBody: any = null
  let normalizedTo: string = ''
  let inputCode: string = ''
  
  try {
    console.log('[VERIFICATION_CHECK] ========================================')
    console.log('[VERIFICATION_CHECK] 인증코드 검증 시작')
    console.log('[VERIFICATION_CHECK] 환경:', process.env.NODE_ENV)
    console.log('[VERIFICATION_CHECK] 런타임:', 'nodejs')
    
    requestBody = await request.json()
    const { email, phoneNumber, code, type, nationality } = requestBody
    
    // 입력값 저장 (로깅용)
    normalizedTo = email || phoneNumber || 'unknown'
    inputCode = code || ''
    
    console.log('[VERIFICATION_CHECK] 요청 데이터:', { email, phoneNumber, code, type, nationality })
    
    // 입력 코드 정규화 (유니코드 숫자 처리, 길이 6 확인)
    const normalizedInputCode = normalizeDigits(code)
    console.log('[VERIFICATION_CHECK] 코드 정규화:', { 
      original: code, 
      normalized: normalizedInputCode, 
      length: normalizedInputCode.length,
      type: typeof normalizedInputCode
    })
    
    // 길이 6 확인
    if (normalizedInputCode.length !== 6) {
      console.error('[VERIFICATION_CHECK] ❌ 코드 길이 이상:', { 
        expected: 6, 
        actual: normalizedInputCode.length,
        code: normalizedInputCode
      })
      return NextResponse.json({
        success: false,
        reason: 'INVALID_CODE',
        detail: '인증코드는 6자리 숫자여야 합니다.'
      }, { status: 400 })
    }
    
    // 전화번호 정규화 (E.164)
    let phoneE164 = null
    if (phoneNumber) {
      phoneE164 = toE164(phoneNumber, nationality)
      console.log('[VERIFICATION_CHECK] 전화번호 정규화 (toE164):', { 
        original: phoneNumber, 
        normalized: phoneE164, 
        nationality: nationality || 'auto-detect'
      })
    }
    
    // 유효성 검사
    if ((!email && !phoneNumber) || !normalizedInputCode) {
      return NextResponse.json({
        success: false,
        reason: 'INVALID_INPUT',
        detail: '이메일 또는 전화번호와 인증코드가 필요합니다.'
      }, { status: 400 })
    }
    
    const supabase = createClient()
    
    // DB 조회: 최신 미인증 코드 찾기 (status 필드가 있으면 사용, 없으면 verified=false 사용)
    let query = supabase
      .from('verification_codes')
      .select('*')
      .eq('type', type)
      .eq('verified', false) // 기본적으로 미인증 코드만
      .order('created_at', { ascending: false })
      .limit(1)
    
    if (email) {
      query = query.eq('email', email)
    }
    if (phoneE164) {
      query = query.eq('phone_e164', phoneE164)
    }
    
    const { data: verificationData, error: queryError } = await query
    
    console.log('[VERIFICATION_CHECK] 데이터베이스 조회 결과:', {
      found: !!verificationData?.length,
      error: queryError,
      queryConditions: { type, phoneE164, email }
    })
    
    // 에러 처리
    if (queryError) {
      console.error('[VERIFICATION_CHECK] ❌ DB 조회 실패:', queryError)
      return NextResponse.json({
        success: false,
        reason: 'DB_ERROR',
        detail: '데이터베이스 조회에 실패했습니다.'
      }, { status: 400 })
    }
    
    // 레코드 없음
    if (!verificationData || verificationData.length === 0) {
      console.error('[VERIFICATION_CHECK] ❌ 레코드 없음')
      
      // 최근 5개 코드 로깅 (디버깅용)
      const { data: recentCodes } = await supabase
        .from('verification_codes')
        .select('id, code, type, email, phone_number, phone_e164, status, created_at, expires_at')
        .order('created_at', { ascending: false })
        .limit(5)
      
      console.error('[VERIFICATION_CHECK] 최근 5개 코드:', recentCodes?.map(c => ({
        id: c.id,
        code: c.code?.substring(0, 2) + '****',
        type: c.type,
        status: c.status,
        target: c.email || c.phone_e164 || c.phone_number,
        created: c.created_at,
        expired: new Date(c.expires_at) < new Date()
      })))
      
      return NextResponse.json({
        success: false,
        reason: 'NOT_FOUND',
        detail: '인증코드를 찾을 수 없습니다. 다시 발송해주세요.'
      }, { status: 400 })
    }
    
    const verificationRecord = verificationData[0]
    
    console.log('[VERIFICATION_CHECK] DB 코드 상세:', {
      dbCode: verificationRecord.code?.substring(0, 2) + '****',
      dbCodeLength: verificationRecord.code?.length,
      createdAt: verificationRecord.created_at,
      expiresAt: verificationRecord.expires_at,
      status: verificationRecord.status,
      phoneE164: verificationRecord.phone_e164
    })
    
    // 만료 확인
    const now = new Date()
    const expiresAt = new Date(verificationRecord.expires_at)
    
    if (now > expiresAt) {
      console.error('[VERIFICATION_CHECK] ❌ 코드 만료:', {
        now: now.toISOString(),
        expiresAt: expiresAt.toISOString(),
        expiredMinutes: Math.round((now.getTime() - expiresAt.getTime()) / 60000)
      })
      
      return NextResponse.json({
        success: false,
        reason: 'EXPIRED',
        detail: '인증코드가 만료되었습니다. 새로운 코드를 발송해주세요.'
      }, { status: 400 })
    }
    
    // 상태 확인
    if (verificationRecord.status !== 'active') {
      console.error('[VERIFICATION_CHECK] ❌ 상태 이상:', {
        status: verificationRecord.status,
        expected: 'active'
      })
      
      return NextResponse.json({
        success: false,
        reason: 'REPLACED_OR_USED',
        detail: '이미 사용되었거나 교체된 인증코드입니다.'
      }, { status: 400 })
    }
    
    // 코드 비교 (안전한 문자열 비교)
    const dbCode = verificationRecord.code
    const isMatch = await safeCompare(normalizedInputCode, dbCode)
    
    console.log('[VERIFICATION_CHECK] 코드 비교 결과:', { 
      dbCode: dbCode?.substring(0, 2) + '****', 
      inputCode: normalizedInputCode.substring(0, 2) + '****',
      match: isMatch 
    })
    
    if (!isMatch) {
      console.error('[VERIFICATION_CHECK] ❌ 코드 불일치')
      
      return NextResponse.json({
        success: false,
        reason: 'MISMATCH',
        detail: '인증코드가 일치하지 않습니다.'
      }, { status: 400 })
    }
    
    // 인증 성공: 상태를 'used'로 변경
    const { error: updateError } = await supabase
      .from('verification_codes')
      .update({ 
        status: 'used',
        verified: true,
        updated_at: new Date().toISOString()
      })
      .eq('id', verificationRecord.id)
    
    if (updateError) {
      console.error('[VERIFICATION_CHECK] ❌ 상태 업데이트 실패:', updateError)
      // 인증은 성공했지만 상태 업데이트 실패 - 성공으로 처리
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
    
    // 입력값 로깅 (마스킹된 코드)
    console.error('[VERIFICATION_CHECK] 입력값:', {
      to: normalizedTo,
      code: inputCode ? `${inputCode.substring(0, 2)}****` : 'not-provided',
      normalizedTo: normalizedTo,
      inputCodeLength: inputCode.length,
      requestBody: requestBody ? {
        email: requestBody.email,
        phoneNumber: requestBody.phoneNumber,
        type: requestBody.type,
        nationality: requestBody.nationality
      } : 'parsing-failed'
    })
    
    // DB 조회 결과 로깅 (최근 3개)
    try {
      const supabase = createClient()
      const { data: recentCodes } = await supabase
        .from('verification_codes')
        .select('id, code, type, email, phone_number, phone_e164, status, created_at, expires_at')
        .order('created_at', { ascending: false })
        .limit(3)
      
      console.error('[VERIFICATION_CHECK] 최근 DB 코드들:', recentCodes?.map(c => ({
        id: c.id,
        status: c.status,
        created_at: c.created_at,
        expires_at: c.expires_at,
        hasCode: !!c.code,
        type: c.type,
        target: c.email || c.phone_e164 || c.phone_number
      })))
    } catch (dbError) {
      console.error('[VERIFICATION_CHECK] DB 조회 실패:', dbError)
    }
    
    console.error('[VERIFICATION_CHECK] ========================================')
    
    const errorMessage = error instanceof Error ? error.message : '알 수 없는 오류'
    const errorName = error instanceof Error ? error.name : 'UnknownError'
    
    // 에러 타입별 reason 매핑
    let reason = 'UNKNOWN_ERROR'
    if (errorMessage.includes('verification_codes_type_check')) {
      reason = 'INVALID_TYPE'
    } else if (errorMessage.includes('connection')) {
      reason = 'DB_CONNECTION_ERROR'
    } else if (errorMessage.includes('JSON')) {
      reason = 'INVALID_REQUEST'
    }
    
    // 500이 아닌 400 응답으로 변경
    return NextResponse.json({
      success: false,
      reason: reason,
      detail: errorMessage,
      errorType: errorName,
      timestamp: new Date().toISOString()
    }, { status: 400 })
  }
}