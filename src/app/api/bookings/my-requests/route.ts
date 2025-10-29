import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// 현지인이 신청한 예약 목록 조회
export async function GET(request: NextRequest) {
  try {
    const supabase = createClient()
    
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json(
        { error: '인증이 필요합니다.' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status') // pending, approved, rejected, all

    let query = supabase
      .from('booking_requests')
      .select(`
        *,
        conversation_partners!booking_requests_partner_id_fkey (
          name,
          avatar_url,
          specialty
        )
      `)
      .eq('user_id', user.id)

    // 상태별 필터링
    if (status && status !== 'all') {
      query = query.eq('status', status)
    }

    const { data: bookings, error } = await query
      .order('created_at', { ascending: false })

    if (error) {
      console.error('예약 목록 조회 오류:', error)
      return NextResponse.json(
        { error: '예약 목록 조회 실패' },
        { status: 500 }
      )
    }

    return NextResponse.json({ bookings: bookings || [] })

  } catch (error) {
    console.error('예약 목록 조회 예외:', error)
    return NextResponse.json(
      { error: '예약 목록 조회 중 오류 발생' },
      { status: 500 }
    )
  }
}

