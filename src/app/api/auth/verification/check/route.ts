import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { formatPhoneNumber } from '@/lib/twilioService'

export async function POST(request: NextRequest) {
  try {
    console.log('[VERIFICATION_CHECK] 인증코드 검증 시작')
    
    const body = await request.json()
    const { email, phoneNumber, code, type, nationality } = body
    
    console.log('[VERIFICATION_CHECK] 요청 데이터:', { email, phoneNumber, code, type, nationality })
    
    // 전화번호 정규화 (저장할 때와 동일한 형식으로)
    let normalizedPhoneNumber = phoneNumber
    if (phoneNumber && nationality) {
      normalizedPhoneNumber = formatPhoneNumber(phoneNumber, nationality)
      console.log('[VERIFICATION_CHECK] 전화번호 정규화:', { original: phoneNumber, normalized: normalizedPhoneNumber })
    }
    
    // 유효성 검사
    if ((!email && !phoneNumber) || !code) {
      return NextResponse.json(
        { success: false, error: '이메일 또는 전화번호와 인증코드가 필요합니다.' },
        { status: 400 }
      )
    }

    const supabase = createClient()

    // 데이터베이스에서 인증코드 검증
    let query = supabase
      .from('verification_codes')
      .select('*')
      .eq('type', type)
      .eq('code', code)
      .eq('verified', false)
      .gt('expires_at', new Date().toISOString())
      .order('created_at', { ascending: false })
      .limit(1)

    if (email) {
      query = query.eq('email', email)
    }
    if (normalizedPhoneNumber) {
      query = query.eq('phone_number', normalizedPhoneNumber)
    }

    const { data: verificationData, error: verificationError } = await query.single()

    if (verificationError || !verificationData) {
      console.log('[VERIFICATION_CHECK] 데이터베이스에서 인증코드 없음:', verificationError)
      return NextResponse.json(
        { success: false, error: '인증코드가 만료되었거나 존재하지 않습니다.' },
        { status: 400 }
      )
    }

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
      return NextResponse.json(
        { success: false, error: '인증 처리 중 오류가 발생했습니다.' },
        { status: 500 }
      )
    }

    console.log('[VERIFICATION_CHECK] 데이터베이스에서 인증 성공!')
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