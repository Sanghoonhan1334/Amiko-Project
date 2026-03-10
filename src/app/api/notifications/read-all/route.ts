import { NextResponse } from 'next/server'
import { NextRequest } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { createSupabaseClient } from '@/lib/supabase'

// 모든 알림 읽음 처리
export async function POST(request: NextRequest) {
  try {
    // 세션 검증 — userId는 항상 토큰에서 추출 (IDOR 방지)
    const authSupabase = await createSupabaseClient()
    const { data: { session }, error: sessionError } = await authSupabase.auth.getSession()
    if (sessionError || !session) {
      return NextResponse.json({ success: false, error: '인증이 필요합니다.' }, { status: 401 })
    }
    const userId = session.user.id

    const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)
    
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
