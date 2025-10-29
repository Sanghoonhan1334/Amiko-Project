import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// 알림 목록 조회
export async function GET(request: NextRequest) {
  try {
    const supabase = createClient()
    
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      // 로그인하지 않은 사용자는 빈 배열 반환
      return NextResponse.json({ notifications: [] })
    }

    const { searchParams } = new URL(request.url)
    const unreadOnly = searchParams.get('unreadOnly') === 'true'

    let query = supabase
      .from('notifications')
      .select('*')
      .eq('user_id', user.id)

    if (unreadOnly) {
      query = query.eq('is_read', false)
    }

    const { data, error } = await query
      .order('created_at', { ascending: false })
      .limit(50)

    if (error) {
      console.error('알림 조회 오류:', error)
      return NextResponse.json(
        { error: '알림 조회 실패' },
        { status: 500 }
      )
    }

    return NextResponse.json({ notifications: data || [] })

  } catch (error) {
    console.error('알림 조회 예외:', error)
    return NextResponse.json(
      { error: '알림 조회 중 오류 발생' },
      { status: 500 }
    )
  }
}

// 알림 생성 (관리자용)
export async function POST(request: NextRequest) {
  try {
    const supabase = createClient()
    
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json(
        { error: '인증이 필요합니다.' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { user_id, type, title, message, related_id } = body

    if (!user_id || !type || !title || !message) {
      return NextResponse.json(
        { error: '필수 필드가 누락되었습니다.' },
        { status: 400 }
      )
    }

    const { data, error } = await supabase
      .from('notifications')
      .insert({
        user_id,
        type,
        title,
        message,
        related_id
      })
      .select()
      .single()

    if (error) {
      console.error('알림 생성 오류:', error)
      return NextResponse.json(
        { error: '알림 생성 실패' },
        { status: 500 }
      )
    }

    return NextResponse.json({ notification: data })

  } catch (error) {
    console.error('알림 생성 예외:', error)
    return NextResponse.json(
      { error: '알림 생성 중 오류 발생' },
      { status: 500 }
    )
  }
}
