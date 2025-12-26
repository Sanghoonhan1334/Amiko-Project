import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseClient } from '@/lib/supabase'
import { supabaseServer } from '@/lib/supabaseServer'
import { getCountryByCode } from '@/constants/countries'

/**
 * Google OAuth 사용자 프로필 완성 API
 * 생년월일, 국가, 약관동의 정보를 업데이트합니다.
 */
export async function POST(request: NextRequest) {
  try {
    const { birthDate, country, isKorean, termsAgreed } = await request.json()

    // 필수 필드 검증
    if (!birthDate || !country) {
      return NextResponse.json(
        { error: '생년월일과 국가는 필수입니다.' },
        { status: 400 }
      )
    }

    // 생년월일 유효성 검증
    const birth = new Date(birthDate)
    if (Number.isNaN(birth.getTime())) {
      return NextResponse.json(
        { error: '유효한 생년월일을 입력해주세요.' },
        { status: 400 }
      )
    }

    // 나이 계산
    const today = new Date()
    let age = today.getFullYear() - birth.getFullYear()
    const monthDiff = today.getMonth() - birth.getMonth()
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--
    }

    if (age < 13) {
      return NextResponse.json(
        { error: '만 13세 미만의 사용자는 보호자 동의 없이 가입할 수 없습니다.' },
        { status: 400 }
      )
    }

    // 국가 유효성 검증
    const selectedCountry = getCountryByCode(country)
    if (!selectedCountry) {
      return NextResponse.json(
        { error: '유효한 국가를 선택해주세요.' },
        { status: 400 }
      )
    }

    // 약관 동의 확인
    if (!termsAgreed) {
      return NextResponse.json(
        { error: '약관에 동의해주세요.' },
        { status: 400 }
      )
    }

    // Supabase 클라이언트 생성
    const supabase = await createSupabaseClient()

    // 현재 사용자 정보 가져오기
    const { data: { user }, error: userError } = await supabase.auth.getUser()

    if (userError || !user) {
      return NextResponse.json(
        { error: '인증이 필요합니다.' },
        { status: 401 }
      )
    }

    // 사용자 프로필 업데이트
    if (!supabaseServer) {
      return NextResponse.json(
        { error: '서버 오류가 발생했습니다.' },
        { status: 500 }
      )
    }

    const { error: updateError } = await supabaseServer
      .from('users')
      .update({
        birth_date: birthDate,
        country: country,
        is_korean: isKorean !== undefined ? isKorean : selectedCountry.isKorean,
        terms_agreed: termsAgreed,
        terms_agreed_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', user.id)

    if (updateError) {
      console.error('[COMPLETE_PROFILE] 프로필 업데이트 실패:', updateError)
      return NextResponse.json(
        { error: '프로필 업데이트에 실패했습니다.' },
        { status: 500 }
      )
    }

    console.log('[COMPLETE_PROFILE] 프로필 완성 성공:', {
      userId: user.id,
      country,
      isKorean: isKorean !== undefined ? isKorean : selectedCountry.isKorean
    })

    return NextResponse.json({
      success: true,
      message: '프로필이 완성되었습니다.',
      data: {
        userId: user.id,
        country,
        isKorean: isKorean !== undefined ? isKorean : selectedCountry.isKorean
      }
    })

  } catch (error) {
    console.error('[COMPLETE_PROFILE] 오류:', error)
    return NextResponse.json(
      { error: '프로필 완성 중 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}

