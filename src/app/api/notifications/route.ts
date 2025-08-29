import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { Notification, NotificationType, NOTIFICATION_TEMPLATES } from '@/lib/notifications'

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
    const validTypes: NotificationType[] = [
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

    // 알림 생성
    const { data: notification, error } = await supabase
      .from('notifications')
      .insert({
        user_id: userId,
        type,
        title,
        message,
        data: data || {},
        is_read: false
      })
      .select()
      .single()

    if (error) {
      console.error('[NOTIFICATION] 생성 실패:', error)
      
      // 테이블이 없는 경우 처리
      if (error.code === 'PGRST205') {
        return NextResponse.json(
          { success: false, error: '알림 테이블이 아직 생성되지 않았습니다. 데이터베이스 설정을 확인해주세요.' },
          { status: 500 }
        )
      }
      
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

    // 테이블 존재 여부 확인
    try {
      const { data: tableCheck, error: tableError } = await supabase
        .from('notifications')
        .select('id')
        .limit(1)

      if (tableError) {
        console.error('[NOTIFICATION] 테이블 확인 실패:', tableError)
        
        if (tableError.code === 'PGRST205') {
          return NextResponse.json({
            success: true,
            notifications: [],
            unreadCount: 0,
            message: '알림 테이블이 아직 생성되지 않았습니다. 빈 목록을 반환합니다.'
          })
        }
        
        throw tableError
      }
    } catch (checkError) {
      console.error('[NOTIFICATION] 테이블 확인 중 오류:', checkError)
      return NextResponse.json({
        success: true,
        notifications: [],
        unreadCount: 0,
        message: '데이터베이스 연결에 문제가 있습니다. 빈 목록을 반환합니다.'
      })
    }

    // 쿼리 구성
    let query = supabase
      .from('notifications')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    // 읽지 않은 알림만 조회
    if (unreadOnly) {
      query = query.eq('is_read', false)
    }

    const { data: notifications, error } = await query

    if (error) {
      console.error('[NOTIFICATION] 조회 실패:', error)
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
      unreadCount = 0
    }

    return NextResponse.json({
      success: true,
      notifications: notifications || [],
      unreadCount,
      message: '알림 목록 조회 성공'
    })

  } catch (error) {
    console.error('알림 목록 조회 실패:', error)
    return NextResponse.json(
      { success: false, error: '알림 목록 조회에 실패했습니다.' },
      { status: 500 }
    )
  }
}
