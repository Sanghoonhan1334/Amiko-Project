import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )
    
    const bookingId = params.id
    
    // 토큰에서 사용자 정보 추출
    const authHeader = request.headers.get('Authorization')
    if (authHeader) {
      const token = authHeader.replace('Bearer ', '')
      const decodedToken = decodeURIComponent(token)
      
      const { data: { user }, error: authError } = await supabase.auth.getUser(decodedToken)
      if (authError || !user) {
        return NextResponse.json(
          { error: '인증이 필요합니다.' },
          { status: 401 }
        )
      }
    }
    
    // 예약 정보 조회
    const { data: booking, error: bookingError } = await supabase
      .from('bookings')
      .select(`
        *,
        users:user_id (
          id,
          full_name,
          email
        ),
        consultants:consultant_id (
          id,
          full_name,
          bio
        )
      `)
      .eq('id', bookingId)
      .single()
    
    if (bookingError || !booking) {
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
        start_at: booking.start_at,
        end_at: booking.end_at,
        duration: booking.duration,
        price: booking.price,
        status: booking.status,
        consultant_id: booking.consultant_id,
        order_id: booking.order_id,
        created_at: booking.created_at,
        meet_url: booking.meet_url,
        user: booking.users,
        consultants: booking.consultants
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
