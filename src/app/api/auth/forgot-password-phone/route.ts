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

    console.log('[FORGOT_PASSWORD_PHONE] 전화번호 정규화:', { phoneNumber, normalizedPhone, nationality })

    // 사용자 정보 조회 (전화번호로)
    // 여러 형식으로 검색 (원본, 정규화된 형식)
    const searchVariants = [normalizedPhone]
    if (phoneNumber !== normalizedPhone) {
      searchVariants.push(phoneNumber)
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
        console.log('[FORGOT_PASSWORD_PHONE] 사용자 찾기 성공:', { searchPhone, userId: data.id })
        break
      }
      userError = error
    }

    // 사용자가 존재하지 않는 경우에도 성공으로 처리 (보안상)
    if (userError || !userData) {
      console.log('[FORGOT_PASSWORD_PHONE] 사용자 없음 (보안상 성공 응답):', { normalizedPhone })
      return NextResponse.json({
        success: true,
        message: language === 'es' ? 'Se ha enviado un código de verificación por SMS.' : '인증코드가 전송되었습니다.'
      })
    }

    // 사용자의 언어 설정 사용 (없으면 요청에서 받은 언어 사용)
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
      console.error('[FORGOT_PASSWORD_PHONE] 인증코드 저장 실패:', insertError)
      return NextResponse.json(
        { error: '인증코드 저장에 실패했습니다.' },
        { status: 500 }
      )
    }

    // SMS 발송
    const smsSent = await sendVerificationSMS(normalizedPhone, verificationCode, userLanguage as 'ko' | 'es', nationality)

    if (!smsSent) {
      console.error('[FORGOT_PASSWORD_PHONE] SMS 발송 실패')
      return NextResponse.json(
        { error: userLanguage === 'es' ? 'Error al enviar el SMS de verificación.' : 'SMS 발송에 실패했습니다.' },
        { status: 500 }
      )
    }

    console.log(`✅ [FORGOT_PASSWORD_PHONE] ${userLanguage} 언어로 SMS 인증코드 발송 성공: ${normalizedPhone}`)

    return NextResponse.json({
      success: true,
      message: userLanguage === 'es' ? 'Se ha enviado un código de verificación por SMS.' : '인증코드가 전송되었습니다.',
      phoneNumber: normalizedPhone // 마스킹된 전화번호 반환 (나중에 표시용)
    })

  } catch (error) {
    console.error('[FORGOT_PASSWORD_PHONE] 오류:', error)
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}
