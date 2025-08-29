import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

// 모든 알림 읽음 처리
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { userId } = body

    if (!userId) {
      return NextResponse.json(
        { success: false, error: '사용자 ID가 필요합니다.' },
        { status: 400 }
      )
    }

    // 모든 읽지 않은 알림을 읽음 처리
    const { data: notifications, error } = await supabase
      .from('notifications')
      .update({
        is_read: true,
        read_at: new Date().toISOString()
      })
      .eq('user_id', userId)
      .eq('is_read', false)
      .select()

    if (error) {
      console.error('[NOTIFICATION] 전체 읽음 처리 실패:', error)
      return NextResponse.json(
        { success: false, error: '알림 읽음 처리에 실패했습니다.' },
        { status: 500 }
      )
    }

    const updatedCount = notifications?.length || 0

    return NextResponse.json({
      success: true,
      updatedCount,
      message: `${updatedCount}개의 알림을 읽음 처리했습니다.`
    })

  } catch (error) {
    console.error('알림 전체 읽음 처리 실패:', error)
    return NextResponse.json(
      { success: false, error: '알림 읽음 처리에 실패했습니다.' },
      { status: 500 }
    )
  }
}
