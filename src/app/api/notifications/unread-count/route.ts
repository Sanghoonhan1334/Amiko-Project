import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// 읽지 않은 알림 개수 조회
export async function GET(request: NextRequest) {
  try {
    const supabase = createClient()
    
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      // 로그인하지 않은 사용자는 0 반환
      return NextResponse.json({ count: 0 })
    }

    const { data, error } = await supabase
      .from('notifications')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('is_read', false)

    if (error) {
      console.error('알림 개수 조회 오류:', error)
      return NextResponse.json(
        { error: '알림 개수 조회 실패' },
        { status: 500 }
      )
    }

    return NextResponse.json({ count: data?.length || 0 })

  } catch (error) {
    console.error('알림 개수 조회 예외:', error)
    return NextResponse.json(
      { error: '알림 개수 조회 중 오류 발생' },
      { status: 500 }
    )
  }
}

