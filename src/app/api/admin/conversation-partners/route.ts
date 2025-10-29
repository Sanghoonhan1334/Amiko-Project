import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

// 화상 채팅 파트너 목록 조회
export async function GET() {
  try {
    console.log('[PARTNERS API] 조회 시작')
    const supabase = createAdminClient()
    console.log('[PARTNERS API] Supabase 클라이언트 생성 완료')

    const { data, error } = await supabase
      .from('conversation_partners')
      .select('*')
      .order('created_at', { ascending: false })

    console.log('[PARTNERS API] 조회 결과:', { data, error })

    if (error) {
      console.error('[PARTNERS API] 파트너 조회 오류:', error)
      return NextResponse.json(
        { error: '파트너 조회 실패', details: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({ partners: data || [] })

  } catch (error: any) {
    console.error('[PARTNERS API] 파트너 조회 예외:', error)
    return NextResponse.json(
      { error: '파트너 조회 중 오류 발생', details: error.message },
      { status: 500 }
    )
  }
}

// 화상 채팅 파트너 추가
export async function POST(request: NextRequest) {
  try {
    const supabase = createAdminClient()
    const body = await request.json()

    const { error } = await supabase
      .from('conversation_partners')
      .insert({
        name: body.name,
        language_level: body.language_level,
        country: body.country,
        status: body.status,
        interests: body.interests,
        bio: body.bio,
        avatar_url: body.avatar_url,
        user_id: null // 관리자가 추가하는 경우 user_id는 null
      })

    if (error) {
      console.error('파트너 추가 오류:', error)
      return NextResponse.json(
        { error: '파트너 추가 실패' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true })

  } catch (error) {
    console.error('파트너 추가 예외:', error)
    return NextResponse.json(
      { error: '파트너 추가 중 오류 발생' },
      { status: 500 }
    )
  }
}

