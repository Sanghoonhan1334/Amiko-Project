import { NextRequest, NextResponse } from 'next/server'
import { supabaseServer } from '@/lib/supabaseServer'
import { toE164 } from '@/lib/phoneUtils'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const { phoneNumber, code, nationality = 'KR' } = await request.json()

    // 입력 검증
    if (!phoneNumber || !code) {
      return NextResponse.json(
        { success: false, error: '전화번호와 인증코드를 입력해주세요.' },
        { status: 400 }
      )
    }

    // 전화번호 정규화
    let normalizedPhone: string
    try {
      normalizedPhone = toE164(phoneNumber, nationality)
      if (!normalizedPhone.startsWith('+')) {
        return NextResponse.json(
          { success: false, error: '올바른 전화번호 형식을 입력해주세요.' },
          { status: 400 }
        )
      }
    } catch (error) {
      return NextResponse.json(
        { success: false, error: '전화번호 형식이 올바르지 않습니다.' },
        { status: 400 }
      )
    }

    const supabase = createClient()

    // 인증코드 검증
    const { data: codeData, error: codeError } = await supabase
      .from('verification_codes')
      .select('*')
      .eq('phone_number', normalizedPhone)
      .eq('code', code)
      .eq('type', 'sms')
      .eq('verified', false)
      .single()

    if (codeError || !codeData) {
      console.error('[FORGOT_PASSWORD_PHONE_VERIFY] 인증코드 확인 실패:', codeError)
      return NextResponse.json(
        { success: false, error: '인증코드가 올바르지 않습니다.' },
        { status: 400 }
      )
    }

    // 만료 시간 확인
    const now = new Date()
    const expiresAt = new Date(codeData.expires_at)
    if (now > expiresAt) {
      return NextResponse.json(
        { success: false, error: '인증코드가 만료되었습니다.' },
        { status: 400 }
      )
    }

    // 사용자 찾기
    if (!supabaseServer) {
      return NextResponse.json(
        { success: false, error: '데이터베이스 연결이 설정되지 않았습니다.' },
        { status: 500 }
      )
    }

    // 여러 형식으로 사용자 검색 (정규화된 형식, 원본 등)
    const searchVariants = [normalizedPhone]
    if (phoneNumber !== normalizedPhone) {
      searchVariants.push(phoneNumber)
    }
    
    // 한국 번호의 경우 여러 변형 추가
    if (nationality === 'KR') {
      const digitsOnly = phoneNumber.replace(/\D/g, '')
      if (digitsOnly.startsWith('010') || digitsOnly.startsWith('011') || 
          digitsOnly.startsWith('016') || digitsOnly.startsWith('017') || 
          digitsOnly.startsWith('018') || digitsOnly.startsWith('019')) {
        const withPlus = `+82${digitsOnly.substring(1)}`
        if (!searchVariants.includes(withPlus)) {
          searchVariants.push(withPlus)
        }
        const withoutPlus = `82${digitsOnly.substring(1)}`
        if (!searchVariants.includes(withoutPlus)) {
          searchVariants.push(withoutPlus)
        }
        if (!searchVariants.includes(digitsOnly)) {
          searchVariants.push(digitsOnly)
        }
      }
    }

    let userData = null
    let userError = null

    for (const searchPhone of searchVariants) {
      const { data, error } = await supabaseServer
        .from('users')
        .select('id, email, phone')
        .eq('phone', searchPhone)
        .single()

      if (!error && data) {
        userData = data
        userError = null
        console.log('[FORGOT_PASSWORD_PHONE_VERIFY] 사용자 찾기 성공:', { searchPhone, userId: data.id, storedPhone: data.phone })
        break
      }
      if (error && error.code !== 'PGRST116') { // PGRST116은 "no rows" 에러
        console.log('[FORGOT_PASSWORD_PHONE_VERIFY] 검색 시도 실패:', { searchPhone, error: error.message })
      }
      userError = error
    }
    
    // 정확히 일치하는 것을 찾지 못한 경우, LIKE 검색으로 시도 (한국 번호만)
    if (!userData && nationality === 'KR') {
      const digitsOnly = phoneNumber.replace(/\D/g, '')
      if (digitsOnly.startsWith('010') || digitsOnly.startsWith('011') || 
          digitsOnly.startsWith('016') || digitsOnly.startsWith('017') || 
          digitsOnly.startsWith('018') || digitsOnly.startsWith('019')) {
        
        // 끝 4자리로 검색 (+821056892434, 01056892434 등 여러 형식 모두 매칭)
        const last4Digits = digitsOnly.slice(-4)
        const { data: likeData, error: likeError } = await supabaseServer
          .from('users')
          .select('id, email, phone')
          .like('phone', `%${last4Digits}`)
          .limit(5)
        
        if (!likeError && likeData && likeData.length > 0) {
          // 여러 결과 중에서 전화번호가 실제로 일치하는 것 찾기
          for (const candidate of likeData) {
            const candidateDigits = candidate.phone?.replace(/\D/g, '') || ''
            const inputDigits = digitsOnly
            // 끝 8자리 이상이 일치하면 같은 번호로 간주
            if (candidateDigits.length >= 8 && inputDigits.length >= 8) {
              if (candidateDigits.slice(-8) === inputDigits.slice(-8)) {
                userData = candidate
                userError = null // 사용자를 찾았으므로 에러 초기화
                console.log('[FORGOT_PASSWORD_PHONE_VERIFY] LIKE 검색으로 사용자 찾기 성공:', { 
                  candidatePhone: candidate.phone, 
                  userId: candidate.id,
                  storedPhoneFormat: candidate.phone,
                  inputPhoneFormat: phoneNumber,
                  normalizedPhone: normalizedPhone
                })
                break
              }
            }
          }
        }
      }
    }

    // 사용자가 존재하지 않는 경우
    if (!userData) {
      console.error('[FORGOT_PASSWORD_PHONE_VERIFY] 사용자 찾기 실패:', { 
        searchVariants: searchVariants.slice(0, 3), // 처음 3개만 로그
        normalizedPhone,
        inputPhone: phoneNumber
      })
      return NextResponse.json(
        { success: false, error: '사용자를 찾을 수 없습니다.' },
        { status: 404 }
      )
    }

    // 인증코드를 사용된 것으로 표시
    await supabase
      .from('verification_codes')
      .update({ verified: true })
      .eq('id', codeData.id)

    // 비밀번호 재설정 토큰 생성 (이메일 기반, 사용자 이메일 사용)
    const resetToken = Buffer.from(`${userData.email}:${Date.now()}`).toString('base64')

    console.log('[FORGOT_PASSWORD_PHONE_VERIFY] 인증 성공, 비밀번호 재설정 토큰 생성:', {
      userId: userData.id,
      email: userData.email,
      phone: normalizedPhone
    })

    return NextResponse.json({
      success: true,
      message: '인증이 완료되었습니다.',
      resetToken: resetToken
    })

  } catch (error) {
    console.error('[FORGOT_PASSWORD_PHONE_VERIFY] 오류:', error)
    return NextResponse.json(
      { success: false, error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}
