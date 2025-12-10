import { NextRequest, NextResponse } from 'next/server'
import { supabaseServer } from '@/lib/supabaseServer'
import { toE164 } from '@/lib/phoneUtils'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  // 요청 본문을 먼저 파싱 (catch 블록에서도 사용하기 위해)
  let requestBody: { phoneNumber?: string; code?: string; nationality?: string; language?: string }
  try {
    requestBody = await request.json()
  } catch {
    requestBody = {}
  }
  
  try {
    const { phoneNumber, code, nationality = 'KR', language = 'ko' } = requestBody

    // 입력 검증
    if (!phoneNumber || !code) {
      const errorMessage = language === 'es'
        ? 'Por favor ingresa el número de teléfono y el código de verificación.'
        : '전화번호와 인증코드를 입력해주세요.'
      return NextResponse.json(
        { success: false, error: errorMessage },
        { status: 400 }
      )
    }

    // 전화번호 정규화
    let normalizedPhone: string
    try {
      normalizedPhone = toE164(phoneNumber, nationality)
      if (!normalizedPhone.startsWith('+')) {
        const errorMessage = language === 'es'
          ? 'Por favor ingresa un formato de número de teléfono válido.'
          : '올바른 전화번호 형식을 입력해주세요.'
        return NextResponse.json(
          { success: false, error: errorMessage },
          { status: 400 }
        )
      }
    } catch (error) {
      const errorMessage = language === 'es'
        ? 'El formato del número de teléfono no es válido.'
        : '전화번호 형식이 올바르지 않습니다.'
      return NextResponse.json(
        { success: false, error: errorMessage },
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
      console.error('[FIND_EMAIL_PHONE_VERIFY] 인증코드 확인 실패:', codeError)
      const errorMessage = language === 'es'
        ? 'El código de verificación no es correcto.'
        : '인증코드가 올바르지 않습니다.'
      return NextResponse.json(
        { success: false, error: errorMessage },
        { status: 400 }
      )
    }

    // 만료 시간 확인
    const now = new Date()
    const expiresAt = new Date(codeData.expires_at)
    if (now > expiresAt) {
      const errorMessage = language === 'es'
        ? 'El código de verificación ha expirado.'
        : '인증코드가 만료되었습니다.'
      return NextResponse.json(
        { success: false, error: errorMessage },
        { status: 400 }
      )
    }

    // 사용자 찾기
    if (!supabaseServer) {
      const errorMessage = language === 'es'
        ? 'La conexión a la base de datos no está configurada.'
        : '데이터베이스 연결이 설정되지 않았습니다.'
      return NextResponse.json(
        { success: false, error: errorMessage },
        { status: 500 }
      )
    }

    // 여러 형식으로 사용자 검색
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
        console.log('[FIND_EMAIL_PHONE_VERIFY] 사용자 찾기 성공:', { searchPhone, userId: data.id, storedPhone: data.phone })
        break
      }
      if (error && error.code !== 'PGRST116') { // PGRST116은 "no rows" 에러
        console.log('[FIND_EMAIL_PHONE_VERIFY] 검색 시도 실패:', { searchPhone, error: error.message })
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
                console.log('[FIND_EMAIL_PHONE_VERIFY] LIKE 검색으로 사용자 찾기 성공:', { 
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

    if (!userData) {
      console.error('[FIND_EMAIL_PHONE_VERIFY] 사용자 찾기 실패:', { 
        searchVariants: searchVariants.slice(0, 3), // 처음 3개만 로그
        normalizedPhone,
        inputPhone: phoneNumber
      })
      // 언어에 따라 에러 메시지 반환
      const errorMessage = language === 'es'
        ? 'No se pudo encontrar el usuario.'
        : '사용자를 찾을 수 없습니다.'
      return NextResponse.json(
        { success: false, error: errorMessage },
        { status: 404 }
      )
    }

    // 인증코드를 사용된 것으로 표시
    await supabase
      .from('verification_codes')
      .update({ verified: true })
      .eq('id', codeData.id)

    console.log('[FIND_EMAIL_PHONE_VERIFY] 인증 성공, 이메일 반환:', {
      userId: userData.id,
      email: userData.email,
      phone: normalizedPhone
    })

    // SMS 인증 완료 후 이메일 반환 (보안: 인증 완료 후에만 노출)
    const successMessage = language === 'es'
      ? 'Verificación completada.'
      : '인증이 완료되었습니다.'
    return NextResponse.json({
      success: true,
      message: successMessage,
      email: userData.email
    })

  } catch (error: any) {
    console.error('[FIND_EMAIL_PHONE_VERIFY] 오류:', error)
    // 언어 감지 (요청 본문에서 추출)
    const errorLanguage = requestBody?.language === 'es' ? 'es' : 'ko'
    const errorMessage = errorLanguage === 'es'
      ? 'Ocurrió un error en el servidor.'
      : '서버 오류가 발생했습니다.'
    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    )
  }
}
