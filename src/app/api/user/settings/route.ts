import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// 사용자 설정 조회
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')

    if (!userId) {
      return NextResponse.json(
        { success: false, error: '사용자 ID가 필요합니다.' },
        { status: 400 }
      )
    }

    const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)

    // 사용자 설정 조회 (user_preferences 테이블)
    const { data: preferences, error } = await supabase
      .from('user_preferences')
      .select('timezone, country, language, display_name')
      .eq('user_id', userId)
      .single()

    if (error && error.code !== 'PGRST116') { // PGRST116: 데이터 없음
      console.error('[USER SETTINGS] 조회 실패:', error)
      return NextResponse.json(
        { success: false, error: '사용자 설정 조회에 실패했습니다.' },
        { status: 500 }
      )
    }

    // 기본값과 함께 반환
    const settings = {
      timezone: preferences?.timezone || 'Asia/Seoul',
      country: preferences?.country || 'KR',
      language: preferences?.language || 'ko',
      displayName: preferences?.display_name || ''
    }

    return NextResponse.json({
      success: true,
      settings,
      message: '사용자 설정 조회 성공'
    })

  } catch (error) {
    console.error('사용자 설정 조회 실패:', error)
    return NextResponse.json(
      { success: false, error: '사용자 설정 조회에 실패했습니다.' },
      { status: 500 }
    )
  }
}

// 사용자 설정 저장/수정
export async function PUT(request: Request) {
  try {
    const body = await request.json()
    const { userId, timezone, country, language, displayName } = body

    if (!userId) {
      return NextResponse.json(
        { success: false, error: '사용자 ID가 필요합니다.' },
        { status: 400 }
      )
    }

    const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)

    // user_preferences 테이블에 설정 저장 (upsert)
    const { error } = await supabase
      .from('user_preferences')
      .upsert({
        user_id: userId,
        timezone: timezone || 'Asia/Seoul',
        country: country || 'KR',
        language: language || 'ko',
        display_name: displayName || '',
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'user_id'
      })

    if (error) {
      console.error('[USER SETTINGS] 저장 실패:', error)
      return NextResponse.json(
        { success: false, error: '사용자 설정 저장에 실패했습니다.' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: '사용자 설정이 저장되었습니다.'
    })

  } catch (error) {
    console.error('사용자 설정 저장 실패:', error)
    return NextResponse.json(
      { success: false, error: '사용자 설정 저장에 실패했습니다.' },
      { status: 500 }
    )
  }
}
