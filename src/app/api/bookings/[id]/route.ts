import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  const resolvedParams = params instanceof Promise ? await params : params
  const { id } = resolvedParams
  console.log('[BOOKINGS ID API] GET 요청 받음:', { id })
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )
    
    const bookingId = id
    console.log('[BOOKINGS ID API] 조회할 ID:', bookingId)
    
    // 예약 정보 조회 (booking_requests 테이블 사용)
    const { data: booking, error: bookingError } = await supabase
      .from('booking_requests')
      .select('*')
      .eq('id', bookingId)
      .single()
    
    console.log('[BOOKINGS ID API] 조회 결과:', { booking, bookingError })
    
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
