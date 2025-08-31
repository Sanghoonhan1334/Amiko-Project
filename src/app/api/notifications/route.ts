import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// 알림 생성
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { userId, type, title, message, data } = body

    // 유효성 검사
    if (!userId || !type || !title || !message) {
      return NextResponse.json(
        { success: false, error: '필수 필드가 누락되었습니다.' },
        { status: 400 }
      )
    }

    // 알림 타입 검증
    const validTypes: string[] = [
      'booking_created',
      'payment_confirmed',
      'consultation_reminder',
      'consultation_completed',
      'review_reminder',
      'system'
    ]

    if (!validTypes.includes(type)) {
      return NextResponse.json(
        { success: false, error: '유효하지 않은 알림 타입입니다.' },
        { status: 400 }
      )
    }

    const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)

    // 알림 생성
    const { data: notification, error: insertError } = await supabase
      .from('notifications')
      .insert({
        user_id: userId,
        title,
        message,
        type,
        data: data || {},
        created_at: new Date().toISOString()
      })
      .select()
      .single()

    if (insertError) {
      console.error('❌ 알림 생성 실패:', insertError)
      return NextResponse.json(
        { success: false, error: '알림 생성에 실패했습니다.' },
        { status: 500 }
      )
    }

    // 알림 로그 생성 (선택적)
    try {
      await supabase
        .from('notification_logs')
        .insert({
          notification_id: notification.id,
          user_id: userId,
          type,
          channel: 'in_app',
          status: 'sent'
        })
    } catch (logError) {
      console.warn('[NOTIFICATION] 로그 생성 실패 (무시됨):', logError)
    }

    return NextResponse.json({
      success: true,
      notification,
      message: '알림이 생성되었습니다.'
    })

  } catch (error) {
    console.error('알림 생성 실패:', error)
    return NextResponse.json(
      { success: false, error: '알림 생성에 실패했습니다.' },
      { status: 500 }
    )
  }
}

// 알림 목록 조회
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    const limit = parseInt(searchParams.get('limit') || '20')
    const offset = parseInt(searchParams.get('offset') || '0')
    const unreadOnly = searchParams.get('unreadOnly') === 'true'
    
    if (!userId) {
      return NextResponse.json(
        { success: false, error: '사용자 ID가 필요합니다.' },
        { status: 400 }
      )
    }

    const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)

    // 테이블 존재 여부 확인
    const { data: tableCheck } = await supabase
      .from('notifications')
      .select('id')
      .limit(1)

    if (!tableCheck) {
      return NextResponse.json(
        { success: false, error: 'notifications 테이블이 존재하지 않습니다.' },
        { status: 500 }
      )
    }

    // 쿼리 구성
    let query = supabase
      .from('notifications')
      .select('*')
      .eq('user_id', userId)

    if (unreadOnly) {
      query = query.eq('is_read', false)
    }

    // 알림 목록 조회
    const { data: notifications, error: fetchError } = await query
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (fetchError) {
      console.error('❌ 알림 조회 실패:', fetchError)
      return NextResponse.json(
        { success: false, error: '알림 목록 조회에 실패했습니다.' },
        { status: 500 }
      )
    }

    // 읽지 않은 알림 개수 조회
    let unreadCount = 0
    try {
      const { count } = await supabase
        .from('notifications')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .eq('is_read', false)

      unreadCount = count || 0
    } catch (countError) {
      console.warn('[NOTIFICATION] 읽지 않은 알림 개수 조회 실패 (무시됨):', countError)
    }

    return NextResponse.json({
      success: true,
      notifications: notifications || [],
      unreadCount,
      pagination: {
        limit,
        offset,
        total: notifications?.length || 0
      }
    })

  } catch (error) {
    console.error('알림 목록 조회 실패:', error)
    return NextResponse.json(
      { success: false, error: '알림 목록 조회에 실패했습니다.' },
      { status: 500 }
    )
  }
}

// 알림 삭제
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    const userId = searchParams.get('userId')
    
    if (!id || !userId) {
      return NextResponse.json(
        { success: false, error: '알림 ID와 사용자 ID가 필요합니다.' },
        { status: 400 }
      )
    }

    const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)

    // 알림 삭제
    const { error: deleteError } = await supabase
      .from('notifications')
      .delete()
      .eq('id', id)
      .eq('user_id', userId)

    if (deleteError) {
      console.error('❌ 알림 삭제 실패:', deleteError)
      return NextResponse.json(
        { success: false, error: '알림 삭제에 실패했습니다.' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: '알림이 삭제되었습니다.'
    })

  } catch (error) {
    console.error('알림 삭제 실패:', error)
    return NextResponse.json(
      { success: false, error: '알림 삭제에 실패했습니다.' },
      { status: 500 }
    )
  }
}
