import { NextRequest, NextResponse } from 'next/server'
import { supabaseServer } from '@/lib/supabaseServer'

// 알림 목록 조회
export async function GET(request: NextRequest) {
  try {
    if (!supabaseServer) {
      console.error('[NOTIFICATIONS API] Supabase 서버 클라이언트가 설정되지 않았습니다.')
      return NextResponse.json({
        notifications: [],
        unreadCount: 0,
        hasMore: false
      })
    }

    // 인증 확인
    const authHeader = request.headers.get('authorization')
    if (!authHeader) {
      return NextResponse.json(
        { error: '인증이 필요합니다.' },
        { status: 401 }
      )
    }

    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authError } = await supabaseServer.auth.getUser(token)

    if (authError || !user) {
      return NextResponse.json(
        { error: '인증에 실패했습니다.' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '20')
    const offset = parseInt(searchParams.get('offset') || '0')
    const unreadOnly = searchParams.get('unreadOnly') === 'true'

    // 알림 조회 쿼리 구성
    let query = supabaseServer
      .from('notifications')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    // 읽지 않은 알림만 조회하는 경우
    if (unreadOnly) {
      query = query.eq('is_read', false)
    }

    const { data: notifications, error } = await query

    if (error) {
      console.error('알림 조회 실패:', error)
      return NextResponse.json(
        { error: '알림을 불러오는데 실패했습니다.' },
        { status: 500 }
      )
    }

    // 읽지 않은 알림 개수 조회
    const { count: unreadCount } = await supabaseServer
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('is_read', false)

    return NextResponse.json({
      notifications: notifications || [],
      unreadCount: unreadCount || 0,
      hasMore: notifications && notifications.length === limit
    })

  } catch (error) {
    console.error('알림 조회 중 오류:', error)
    return NextResponse.json(
      { error: '알림을 불러오는데 실패했습니다.' },
      { status: 500 }
    )
  }
}

// 알림 생성 (시스템용)
export async function POST(request: NextRequest) {
  try {
    if (!supabaseServer) {
      console.error('[NOTIFICATIONS API] Supabase 서버 클라이언트가 설정되지 않았습니다.')
      return NextResponse.json(
        { error: '데이터베이스 연결이 설정되지 않았습니다.' },
        { status: 500 }
      )
    }

    const body = await request.json()
    const { userId, type, title, message, data } = body

    // 입력 검증
    if (!userId || !type || !title || !message) {
      return NextResponse.json(
        { error: '필수 필드가 누락되었습니다.' },
        { status: 400 }
      )
    }

    // 알림 생성
    const { data: notification, error } = await (supabaseServer as any)
      .from('notifications')
      .insert({
        user_id: userId,
        type,
        title,
        message,
        data: data || null
      })
      .select()
      .single()

    if (error) {
      console.error('알림 생성 실패:', error)
      return NextResponse.json(
        { error: '알림 생성에 실패했습니다.' },
        { status: 500 }
      )
    }

    return NextResponse.json({ notification })

  } catch (error) {
    console.error('알림 생성 중 오류:', error)
    return NextResponse.json(
      { error: '알림 생성에 실패했습니다.' },
      { status: 500 }
    )
  }
}