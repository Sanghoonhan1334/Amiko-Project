import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// 읽지 않은 알림 개수 조회
export async function GET(request: NextRequest) {
  try {
    const supabase = createClient()
    const searchParams = request.nextUrl.searchParams
    const typesParam = searchParams.get('types')
    const allowedTypes = typesParam
      ? typesParam.split(',').map(type => type.trim()).filter(Boolean)
      : []

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      // 로그인하지 않은 사용자는 0 반환
      return NextResponse.json({ count: 0 })
    }

    let query = supabase
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('is_read', false)

    if (allowedTypes.length > 0) {
      query = query.in('type', allowedTypes)
    }

    const { count, error } = await query

    if (error) {
      console.error('알림 개수 조회 오류:', error)
      return NextResponse.json(
        { error: '알림 개수 조회 실패' },
        { status: 500 }
      )
    }

    return NextResponse.json({ count: count || 0 })

  } catch (error) {
    console.error('알림 개수 조회 예외:', error)
    return NextResponse.json(
      { error: '알림 개수 조회 중 오류 발생' },
      { status: 500 }
    )
  }
}

