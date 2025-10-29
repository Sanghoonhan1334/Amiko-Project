import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// 현지인이 신청한 개별 예약 요청 조회
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createClient()
    
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    const bookingId = params.id

    const { data: booking, error } = await supabase
      .from('booking_requests')
      .select(`
        *,
        conversation_partners!booking_requests_partner_id_fkey (
          name,
          avatar_url,
          specialty
        ),
        users!booking_requests_user_id_fkey (
          full_name,
          nickname,
          avatar_url
        )
      `)
      .eq('id', bookingId)
      .eq('user_id', user.id)
      .single()

    if (error || !booking) {
      return NextResponse.json(
        { error: 'Booking not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({ booking })

  } catch (error) {
    console.error('Error fetching booking:', error)
    return NextResponse.json(
      { error: 'Error fetching booking' },
      { status: 500 }
    )
  }
}

