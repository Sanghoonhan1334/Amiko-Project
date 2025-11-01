import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseClient } from '@/lib/supabase'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  const resolvedParams = params instanceof Promise ? await params : params
  const { id } = resolvedParams
  console.log('[BOOKINGS ID API] GET 요청 받음:', { id })
  try {
    // 인증된 클라이언트 사용 (쿠키 기반)
    const supabase = await createSupabaseClient()
    
    // 사용자 인증 확인
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      console.error('[BOOKINGS ID API] 인증 실패:', authError)
      return NextResponse.json(
        { error: '인증이 필요합니다.' },
        { status: 401 }
      )
    }
    
    console.log('[BOOKINGS ID API] 인증된 사용자:', user.id)
    
    const bookingId = id
    console.log('[BOOKINGS ID API] 조회할 ID:', bookingId)
    
    // 예약 정보 조회 (booking_requests 테이블 사용)
    console.log('[BOOKINGS ID API] 쿼리 실행: booking_requests 테이블, id =', bookingId)
    const { data: booking, error: bookingError } = await supabase
      .from('booking_requests')
      .select('*')
      .eq('id', bookingId)
      .single()
    
    console.log('[BOOKINGS ID API] 조회 결과:', { 
      booking: booking ? { 
        id: booking.id, 
        status: booking.status, 
        meet_url: booking.meet_url,
        date: booking.date,
        start_time: booking.start_time
      } : null, 
      bookingError 
    })
    
    if (bookingError || !booking) {
      console.log('[BOOKINGS ID API] 예약 정보를 찾을 수 없습니다:', bookingError)
      return NextResponse.json(
        { error: '예약 정보를 찾을 수 없습니다.' },
        { status: 404 }
      )
    }
    
    return NextResponse.json({ 
      booking: {
        id: booking.id,
        topic: booking.topic,
        description: booking.description,
        date: booking.date,
        start_time: booking.start_time,
        end_time: booking.end_time,
        duration: booking.duration,
        price: booking.price,
        status: booking.status,
        partner_id: booking.partner_id,
        user_id: booking.user_id,
        created_at: booking.created_at,
        meet_url: booking.meet_url
      }
    })
    
  } catch (error) {
    console.error('[BOOKING GET] 오류:', error)
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}
