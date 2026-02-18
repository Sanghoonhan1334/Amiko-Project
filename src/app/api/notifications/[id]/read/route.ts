import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// 알림을 읽음으로 표시
export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const params = await context.params
  try {
    const supabase = createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json(
        { error: '인증이 필요합니다.' },
        { status: 401 }
      )
    }

    const notificationId = params.id

    // 권한 확인
    const { data: notification } = await supabase
      .from('notifications')
      .select('*')
      .eq('id', notificationId)
      .single()

    if (!notification) {
      return NextResponse.json(
        { error: '알림을 찾을 수 없습니다.' },
        { status: 404 }
      )
    }

    if (notification.user_id !== user.id) {
      return NextResponse.json(
        { error: '권한이 없습니다.' },
        { status: 403 }
      )
    }

    // 읽음으로 표시
    const { error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('id', notificationId)

    if (error) {
      console.error('알림 읽기 오류:', error)
      return NextResponse.json(
        { error: '알림 읽기 실패' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true })

  } catch (error) {
    console.error('알림 읽기 예외:', error)
    return NextResponse.json(
      { error: '알림 읽기 중 오류 발생' },
      { status: 500 }
    )
  }
}

// 모든 알림을 읽음으로 표시
export async function PUT(request: NextRequest) {
  try {
    const supabase = createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json(
        { error: '인증이 필요합니다.' },
        { status: 401 }
      )
    }

    // 모든 읽지 않은 알림을 읽음으로 표시
    const { error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('user_id', user.id)
      .eq('is_read', false)

    if (error) {
      console.error('모든 알림 읽기 오류:', error)
      return NextResponse.json(
        { error: '모든 알림 읽기 실패' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true })

  } catch (error) {
    console.error('모든 알림 읽기 예외:', error)
    return NextResponse.json(
      { error: '모든 알림 읽기 중 오류 발생' },
      { status: 500 }
    )
  }
}

