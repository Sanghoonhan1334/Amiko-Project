import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// 한국인이 받은 예약 요청 목록 조회
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

    // 파트너인지 확인
    const { data: partner } = await supabase
      .from('conversation_partners')
      .select('*')
      .eq('user_id', user.id)
      .single()

    if (!partner) {
      return NextResponse.json(
        { error: '파트너가 아닙니다.' },
        { status: 403 }
      )
    }

    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status') // pending, approved, rejected, all

    let query = supabase
      .from('booking_requests')
      .select(`
        *,
        users!booking_requests_user_id_fkey (
          full_name,
          nickname,
          avatar_url
        )
      `)
      .eq('partner_id', user.id)

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

