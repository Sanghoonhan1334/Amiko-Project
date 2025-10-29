import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { generateMeetLink } from '@/lib/meet-link-generator'

// 예약 승인
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createClient()
    
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json(
        { error: '인증이 필요합니다.' },
        { status: 401 }
      )
    }

    const bookingId = params.id

    // 파트너 조회
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

    // 예약 요청 조회
    const { data: booking } = await supabase
      .from('booking_requests')
      .select('*')
      .eq('id', bookingId)
      .single()

    if (!booking) {
      return NextResponse.json(
        { error: '예약 요청을 찾을 수 없습니다.' },
        { status: 404 }
      )
    }

    // 권한 확인
    if (booking.partner_id !== partner.user_id) {
      return NextResponse.json(
        { error: '권한이 없습니다.' },
        { status: 403 }
      )
    }

    // 이미 처리된 경우
    if (booking.status !== 'pending') {
      return NextResponse.json(
        { error: '이미 처리된 예약입니다.' },
        { status: 400 }
      )
    }

    // Google Meet 링크 생성 (이미 있으면 재사용, 없으면 생성)
    let meetUrl = booking.meet_url
    if (!meetUrl) {
      meetUrl = generateMeetLink(bookingId, booking.date)
      console.log('[BOOKING APPROVE] Google Meet 링크 생성:', meetUrl)
    }

    // 예약 요청 승인
    const { error: updateError } = await supabase
      .from('booking_requests')
      .update({
        status: 'approved',
        meet_url: meetUrl,
        approved_at: new Date().toISOString()
      })
      .eq('id', bookingId)

    if (updateError) {
      console.error('예약 승인 오류:', updateError)
      return NextResponse.json(
        { error: '예약 승인 실패' },
        { status: 500 }
      )
    }

    // available_schedules 상태 업데이트
    const { error: scheduleError } = await supabase
      .from('available_schedules')
      .update({
        status: 'booked',
        booking_request_id: bookingId
      })
      .eq('id', booking.id)

    if (scheduleError) {
      console.error('스케줄 업데이트 오류:', scheduleError)
      // 롤백: meet_url도 함께 제거
      await supabase
        .from('booking_requests')
        .update({ 
          status: 'pending',
          meet_url: null
        })
        .eq('id', bookingId)
      return NextResponse.json(
        { error: '스케줄 업데이트 실패' },
        { status: 500 }
      )
    }

    // 파트너 이름 가져오기
    const { data: partnerData } = await supabase
      .from('users')
      .select('full_name, nickname')
      .eq('id', partner.user_id)
      .single()

    const partnerName = partnerData?.full_name || partnerData?.nickname || '친구'

    // 사용자에게 승인 알림 전송 (Google Meet 링크 포함)
    await supabase
      .from('notifications')
      .insert({
        user_id: booking.user_id,
        type: 'booking_approved',
        title: '예약이 승인되었습니다',
        message: `${partnerName}님이 ${booking.date} ${booking.start_time} 예약을 승인했습니다. Google Meet 링크: ${meetUrl}`,
        related_id: bookingId
      })

    return NextResponse.json({ success: true })

  } catch (error) {
    console.error('예약 승인 예외:', error)
    return NextResponse.json(
      { error: '예약 승인 중 오류 발생' },
      { status: 500 }
    )
  }
}
