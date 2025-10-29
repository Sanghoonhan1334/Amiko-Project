import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// 화상 채팅 파트너 등록
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const supabase = createClient()

    // 한국인만 등록 가능 (인증센터에서 확인된 is_korean 필드)
    if (!body.is_korean) {
      return NextResponse.json(
        { error: '한국인만 화상 채팅 파트너로 등록할 수 있습니다.' },
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

