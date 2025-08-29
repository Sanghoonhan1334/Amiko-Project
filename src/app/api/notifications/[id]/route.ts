import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

// 특정 알림 읽음 처리
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const { isRead } = body

    if (typeof isRead !== 'boolean') {
      return NextResponse.json(
        { success: false, error: '읽음 상태가 필요합니다.' },
        { status: 400 }
      )
    }

    // 알림 읽음 처리
    const { data: notification, error } = await supabase
      .from('notifications')
      .update({
        is_read: isRead,
        read_at: isRead ? new Date().toISOString() : null
      })
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('[NOTIFICATION] 읽음 처리 실패:', error)
      return NextResponse.json(
        { success: false, error: '알림 읽음 처리에 실패했습니다.' },
        { status: 500 }
      )
    }

    if (!notification) {
      return NextResponse.json(
        { success: false, error: '알림을 찾을 수 없습니다.' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      notification,
      message: isRead ? '알림을 읽음 처리했습니다.' : '알림을 읽지 않음 처리했습니다.'
    })

  } catch (error) {
    console.error('알림 읽음 처리 실패:', error)
    return NextResponse.json(
      { success: false, error: '알림 읽음 처리에 실패했습니다.' },
      { status: 500 }
    )
  }
}

// 특정 알림 삭제
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    // 알림 삭제
    const { error } = await supabase
      .from('notifications')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('[NOTIFICATION] 삭제 실패:', error)
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
