import { NextRequest, NextResponse } from 'next/server'
import { supabaseServer } from '@/lib/supabaseServer'
import { sendVerificationSMS } from '@/lib/smsService'
import { toE164 } from '@/lib/phoneUtils'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const { phoneNumber, nationality = 'KR', language = 'ko' } = await request.json()

    // 입력 검증
    if (!phoneNumber) {
      return NextResponse.json(
        { error: '전화번호를 입력해주세요.' },
        { status: 400 }
      )
    }

    // 사용자 존재 여부 확인
    if (!supabaseServer) {
      return NextResponse.json(
        { error: '데이터베이스 연결이 설정되지 않았습니다.' },
        { status: 500 }
      )
    }

    // 전화번호 정규화
    let normalizedPhone: string
    try {
      normalizedPhone = toE164(phoneNumber, nationality)
      if (!normalizedPhone.startsWith('+')) {
        return NextResponse.json(
          { error: '올바른 전화번호 형식을 입력해주세요.' },
          { status: 400 }
        )
      }
    } catch (error) {
      return NextResponse.json(
        { error: '전화번호 형식이 올바르지 않습니다.' },
        { status: 400 }
      )
    }

    console.log('[FIND_EMAIL_PHONE] 전화번호 정규화:', { phoneNumber, normalizedPhone, nationality })

    // 사용자 정보 조회 (전화번호로)
    // 여러 형식으로 검색
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
        .select('id, email, phone, language')
        .eq('phone', searchPhone)
        .single()

      if (!error && data) {
        userData = data
        userError = null
        console.log('[FIND_EMAIL_PHONE] 사용자 찾기 성공:', { searchPhone, userId: data.id })
        break
      }
      if (error && error.code !== 'PGRST116') {
        console.log('[FIND_EMAIL_PHONE] 검색 시도 실패:', { searchPhone, error: error.message })
      }
      userError = error
    }

    // 사용자가 존재하지 않는 경우 (보안상 사용자에게 알리지 않음)
    if (userError || !userData) {
      console.log('[FIND_EMAIL_PHONE] 사용자 없음 (보안상 성공 응답):', { normalizedPhone })
      // 보안을 위해 존재하지 않아도 성공으로 처리 (SMS 발송하지 않음)
      return NextResponse.json({
        success: true,
        message: language === 'es' ? 'Se ha enviado un código de verificación por SMS.' : '인증코드가 전송되었습니다.'
      })
    }

    // 사용자의 언어 설정 사용
    const userLanguage = userData.language || language

    // 인증코드 생성 (6자리)
    const verificationCode = Math.floor(100000 + Math.random() * 900000).toString()

    // Supabase 클라이언트로 verification_codes 테이블에 저장
    const supabase = createClient()
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString() // 10분 후 만료

    // 기존 미인증 코드들 비활성화
    await supabase
      .from('verification_codes')
      .update({ verified: true })
      .eq('phone_number', normalizedPhone)
      .eq('type', 'sms')
      .eq('verified', false)

    // 새 인증코드 저장
    const { error: insertError } = await supabase
      .from('verification_codes')
      .insert({
        phone_number: normalizedPhone,
        code: verificationCode,
        type: 'sms',
        expires_at: expiresAt,
        verified: false
      })

    if (insertError) {
      console.error('[FIND_EMAIL_PHONE] 인증코드 저장 실패:', insertError)
      return NextResponse.json(
        { error: '인증코드 저장에 실패했습니다.' },
        { status: 500 }
      )
    }

    // SMS 발송
    const smsSent = await sendVerificationSMS(normalizedPhone, verificationCode, userLanguage as 'ko' | 'es', nationality)

    if (!smsSent) {
      console.error('[FIND_EMAIL_PHONE] SMS 발송 실패')
      
      // 프로덕션 환경에서는 개발자 디버깅을 위해 인증코드를 로그에 출력 (임시)
      if (process.env.NODE_ENV === 'production') {
        console.error(`[FIND_EMAIL_PHONE] ⚠️  프로덕션 환경 - SMS 발송 실패, 디버깅용 인증코드: ${verificationCode}`)
        console.error('[FIND_EMAIL_PHONE] 📱 수동으로 전달 가능 (임시 조치)')
      }
      
      return NextResponse.json(
        { 
          error: userLanguage === 'es' 
            ? 'Error al enviar el SMS de verificación. Por favor, verifique la configuración de Twilio o intente nuevamente.' 
            : 'SMS 발송에 실패했습니다. Twilio 설정을 확인하거나 잠시 후 다시 시도해주세요.',
          debugInfo: process.env.NODE_ENV === 'development' ? {
            code: verificationCode,
            phone: normalizedPhone,
            note: '개발 환경 - SMS 발송 실패. 인증코드는 로그를 확인하세요.'
          } : undefined
        },
        { status: 500 }
      )
    }

    console.log(`✅ [FIND_EMAIL_PHONE] ${userLanguage} 언어로 SMS 인증코드 발송 성공: ${normalizedPhone}`)
    
    // 프로덕션 환경에서도 디버깅을 위해 인증코드 로그 출력 (임시 - 나중에 제거 예정)
    if (process.env.NODE_ENV === 'production') {
      console.log(`[FIND_EMAIL_PHONE] 📱 프로덕션 디버깅 - 발송된 인증코드: ${verificationCode} (전화번호: ${normalizedPhone})`)
    }

    return NextResponse.json({
      success: true,
      message: userLanguage === 'es' ? 'Se ha enviado un código de verificación por SMS.' : '인증코드가 전송되었습니다.',
      phoneNumber: normalizedPhone
    })

  } catch (error) {
    console.error('[FIND_EMAIL_PHONE] 오류:', error)
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}
