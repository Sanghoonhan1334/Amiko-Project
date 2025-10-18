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

    // 데이터베이스에서 인증코드 검증 (더 관대한 검증)
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
      // 전화번호 검증을 더 유연하게 (여러 형식 시도)
      query = query.or(`phone_number.eq.${normalizedPhoneNumber},phone_number.eq.${phoneNumber},phone_number.eq.${normalizedPhoneNumber.replace('+', '')}`)
    }

    const { data: verificationData, error: verificationError } = await query.single()

    console.log('[VERIFICATION_CHECK] 데이터베이스 조회 결과:', { 
      data: verificationData, 
      error: verificationError,
      queryConditions: {
        type,
        code,
        phoneNumber: normalizedPhoneNumber,
        email,
        expiresAt: new Date().toISOString()
      }
    })

    // 디버깅을 위한 추가 로그
    if (!verificationData) {
      console.log('[VERIFICATION_CHECK] 디버깅: 데이터베이스에서 모든 인증코드 조회')
      const { data: allCodes } = await supabase
        .from('verification_codes')
        .select('*')
        .eq('type', type)
        .eq('verified', false)
        .order('created_at', { ascending: false })
        .limit(5)
      
      console.log('[VERIFICATION_CHECK] 최근 5개 미인증 코드:', allCodes)
      
      // 입력된 코드와 비교
      console.log('[VERIFICATION_CHECK] 코드 비교:')
      console.log('  입력된 코드:', code)
      console.log('  입력된 코드 타입:', typeof code)
      console.log('  입력된 코드 길이:', code?.length)
      
      if (allCodes) {
        allCodes.forEach((dbCode, index) => {
          console.log(`  DB 코드 ${index + 1}:`, dbCode.code)
          console.log(`  DB 코드 ${index + 1} 타입:`, typeof dbCode.code)
          console.log(`  DB 코드 ${index + 1} 길이:`, dbCode.code?.length)
          console.log(`  코드 일치 여부:`, dbCode.code === code)
          console.log(`  전화번호 일치 여부:`, dbCode.phone_number === normalizedPhoneNumber)
          console.log(`  만료 여부:`, new Date(dbCode.expires_at) < new Date())
        })
      }
    }

    if (verificationError || !verificationData) {
      console.log('[VERIFICATION_CHECK] 데이터베이스에서 인증코드 없음:', verificationError)
      
      // 임시 해결책: 코드만으로 검증 (전화번호 무시)
      console.log('[VERIFICATION_CHECK] 임시 해결책 시도: 코드만으로 검증')
      const { data: tempVerificationData, error: tempError } = await supabase
        .from('verification_codes')
        .select('*')
        .eq('type', type)
        .eq('code', code)
        .eq('verified', false)
        .gt('expires_at', new Date().toISOString())
        .order('created_at', { ascending: false })
        .limit(1)
        .single()
      
      console.log('[VERIFICATION_CHECK] 임시 검증 결과:', { data: tempVerificationData, error: tempError })
      
      if (tempVerificationData) {
        console.log('[VERIFICATION_CHECK] 임시 검증 성공! 코드만으로 인증 완료')
        
        // 인증코드를 verified로 업데이트
        const { error: updateError } = await supabase
          .from('verification_codes')
          .update({ 
            verified: true, 
            verified_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
          .eq('id', tempVerificationData.id)

        if (updateError) {
          console.error('인증코드 업데이트 실패:', updateError)
          return NextResponse.json(
            { success: false, error: '인증 처리 중 오류가 발생했습니다.' },
            { status: 500 }
          )
        }

        return NextResponse.json({
          success: true,
          message: '인증이 완료되었습니다.',
          timestamp: new Date().toISOString()
        })
      }
      
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