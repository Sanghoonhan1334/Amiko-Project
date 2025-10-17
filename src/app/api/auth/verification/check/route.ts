import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// 간단한 메모리 저장소 (실제로는 Redis나 데이터베이스 사용 권장)
const verificationCodes = new Map<string, { code: string, expiry: number }>()

export async function POST(request: NextRequest) {
  try {
    console.log('[VERIFICATION_CHECK] 인증코드 검증 시작')
    
    const body = await request.json()
    const { email, code, type } = body
    
    console.log('[VERIFICATION_CHECK] 요청 데이터:', { email, code, type })
    
    // 유효성 검사
    if (!email || !code) {
      return NextResponse.json(
        { success: false, error: '이메일과 인증코드가 필요합니다.' },
        { status: 400 }
      )
    }

    const supabase = createClient()

    // 데이터베이스에서 인증코드 검증 시도
    try {
      const { data: verificationData, error: verificationError } = await supabase
        .from('verification_codes')
        .select('*')
        .eq('email', email)
        .eq('type', type || 'email')
        .eq('code', code)
        .eq('verified', false)
        .gt('expires_at', new Date().toISOString())
        .order('created_at', { ascending: false })
        .limit(1)
        .single()

      if (!verificationError && verificationData) {
        // 데이터베이스에서 인증코드 찾음 - 성공
        console.log('[VERIFICATION_CHECK] 데이터베이스에서 인증 성공!')
        
        // 인증코드를 verified로 업데이트
        const { error: updateError } = await supabase
          .from('verification_codes')
          .update({ 
            verified: true, 
            verified_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
          .eq('id', verificationData.id)

        if (updateError) {
          console.error('인증코드 업데이트 실패:', updateError)
        }

        return NextResponse.json({
          success: true,
          message: '인증이 완료되었습니다.',
          timestamp: new Date().toISOString()
        })
      }
    } catch (dbError) {
      console.log('[VERIFICATION_CHECK] 데이터베이스 검증 실패, 메모리 저장소로 폴백:', dbError)
    }
    
    // 데이터베이스 검증 실패 시 메모리 저장소로 폴백
    const stored = verificationCodes.get(email)
    
    if (!stored) {
      console.log('[VERIFICATION_CHECK] 저장된 인증코드 없음')
      return NextResponse.json(
        { success: false, error: '인증코드가 만료되었거나 존재하지 않습니다.' },
        { status: 400 }
      )
    }
    
    // 만료 시간 확인
    if (Date.now() > stored.expiry) {
      console.log('[VERIFICATION_CHECK] 인증코드 만료됨')
      verificationCodes.delete(email)
      return NextResponse.json(
        { success: false, error: '인증코드가 만료되었습니다.' },
        { status: 400 }
      )
    }
    
    // 인증코드 일치 확인
    if (stored.code !== code) {
      console.log('[VERIFICATION_CHECK] 인증코드 불일치:', { 
        stored: stored.code, 
        input: code 
      })
      return NextResponse.json(
        { success: false, error: '인증코드가 일치하지 않습니다.' },
        { status: 400 }
      )
    }
    
    // 인증 성공
    console.log('[VERIFICATION_CHECK] 메모리 저장소에서 인증 성공!')
    verificationCodes.delete(email) // 사용된 코드 삭제
    
    return NextResponse.json({
      success: true,
      message: '인증이 완료되었습니다.',
      timestamp: new Date().toISOString()
    })
    
  } catch (error) {
    console.error('[VERIFICATION_CHECK] 에러 발생:', error)
    return NextResponse.json(
      { success: false, error: '서버 오류가 발생했습니다.', details: error.message },
      { status: 500 }
    )
  }
}

// 인증코드 저장 함수 (다른 API에서 호출)
export function storeVerificationCode(email: string, code: string) {
  const expiry = Date.now() + 5 * 60 * 1000 // 5분
  verificationCodes.set(email, { code, expiry })
  console.log('[VERIFICATION_CHECK] 인증코드 저장:', { email, code, expiry: new Date(expiry).toISOString() })
}