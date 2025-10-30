import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { extractCountryCodeFromPhone } from '@/lib/timezone-converter'

// 화상 채팅 파트너 등록
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const supabase = createClient()

    // 한국인 판정: (1) 인증센터 is_korean OR (2) 전화번호 국가번호 +82 OR (3) 관리자 승인 플래그
    let isKoreanAllowed = Boolean(body.is_korean)

    try {
      // users 테이블에서 전화번호/플래그 조회
      const { data: userRow } = await supabase
        .from('users')
        .select('phone, phone_country, is_korean, admin_partner_override')
        .eq('id', body.user_id)
        .single()

      const phone = body.phone || userRow?.phone || null
      const phoneCountryField = (userRow as any)?.phone_country || null
      const phoneCodeParsed = extractCountryCodeFromPhone(phone)
      const effectiveCode = phoneCountryField || phoneCodeParsed || null
      const byPhone = effectiveCode === '82'
      const adminOverride = Boolean(userRow?.admin_partner_override)
      const isKoreanProfile = Boolean(userRow?.is_korean)

      isKoreanAllowed = Boolean(isKoreanAllowed || isKoreanProfile || byPhone || adminOverride)
    } catch (e) {
      // 조회 실패 시 기존 body 기준만 사용
    }

    if (!isKoreanAllowed) {
      return NextResponse.json(
        { error: '한국(+82) 번호 또는 관리자 승인/한국인 인증이 필요합니다.' },
        { status: 403 }
      )
    }

    // 이미 등록되어 있는지 확인
    const { data: existing } = await supabase
      .from('conversation_partners')
      .select('id')
      .eq('user_id', body.user_id)
      .single()

    if (existing) {
      return NextResponse.json(
        { error: '이미 등록되어 있습니다.' },
        { status: 400 }
      )
    }

    // 등록
    const { error } = await supabase
      .from('conversation_partners')
      .insert({
        user_id: body.user_id,
        name: body.name,
        language_level: body.language_level,
        country: body.country,
        status: body.status,
        interests: body.interests,
        bio: body.bio,
        avatar_url: body.avatar_url
      })

    if (error) {
      console.error('파트너 등록 오류:', error)
      return NextResponse.json(
        { error: '파트너 등록 실패', details: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true })

  } catch (error) {
    console.error('파트너 등록 예외:', error)
    return NextResponse.json(
      { error: '파트너 등록 중 오류 발생' },
      { status: 500 }
    )
  }
}

