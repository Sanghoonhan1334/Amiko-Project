import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseClient } from '@/lib/supabase'
import { convertKSTToUserTimezone } from '@/lib/timezone-converter'
import { supabaseServer } from '@/lib/supabaseServer'

// 현지인이 신청한 개별 예약 요청 조회
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const supabase = await createSupabaseClient()
    
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    // params가 Promise인 경우 처리
    const resolvedParams = await Promise.resolve(params)
    const bookingId = resolvedParams.id

    // booking_requests 조회
    const { data: booking, error } = await supabase
      .from('booking_requests')
      .select('*')
      .eq('id', bookingId)
      .eq('user_id', user.id)
      .single()

    if (error || !booking) {
      console.error('[my-requests/[id]] 예약 조회 실패:', error)
      return NextResponse.json(
        { error: 'Booking not found' },
        { status: 404 }
      )
    }

    // 파트너 정보 조회
    const { data: partnerUser } = await supabase
      .from('users')
      .select('full_name, nickname, avatar_url, spanish_name, korean_name')
      .eq('id', booking.partner_id)
      .single()

    const { data: partner } = await supabase
      .from('conversation_partners')
      .select('specialty, name')
      .eq('user_id', booking.partner_id)
      .single()

    // 사용자 이름 결정
    const displayName = partnerUser?.full_name || 
                       partnerUser?.spanish_name || 
                       partnerUser?.korean_name || 
                       partnerUser?.nickname || 
                       partner?.name || 
                       null

    // 사용자의 signup country를 기반으로 timezone 결정
    let userTimezone = 'America/Lima' // 기본값
    try {
      const { data: userMetadata } = await supabaseServer.auth.admin.getUserById(user.id)
      const signupCountry = userMetadata?.user?.user_metadata?.country
      
      if (signupCountry) {
        const countryCode = signupCountry.toUpperCase()
        if (countryCode === 'KR' || countryCode === 'KOREA' || countryCode === 'KO') {
          userTimezone = 'Asia/Seoul'
        } else if (countryCode === 'PE' || countryCode === 'PERU') {
          userTimezone = 'America/Lima'
        } else if (countryCode === 'CO' || countryCode === 'COLOMBIA') {
          userTimezone = 'America/Bogota'
        } else if (countryCode === 'MX' || countryCode === 'MEXICO') {
          userTimezone = 'America/Mexico_City'
        }
      }
    } catch (error) {
      console.error('[my-requests/[id]] timezone 조회 실패:', error)
    }

    // 원본 KST 시간을 그대로 반환하고, 클라이언트에서 변환하도록 함
    // (예약 생성 페이지와 동일한 convertKSTToUserTimezone 함수 사용)
    return NextResponse.json({ 
      booking: {
        ...booking,
        // 원본 KST 시간 (DB에 저장된 값) - 클라이언트에서 변환에 사용
        kst_date: booking.date,
        kst_start_time: booking.start_time,
        kst_end_time: booking.end_time,
        // 사용자 timezone 정보 (클라이언트에서 변환에 사용)
        user_timezone: userTimezone,
        // 하위 호환성을 위해 기존 필드도 유지 (원본 KST 값)
        date: booking.date,
        start_time: booking.start_time,
        end_time: booking.end_time,
        conversation_partners: {
          name: displayName,
          avatar_url: partnerUser?.avatar_url || null,
          specialty: partner?.specialty || null
        }
      }
    })

  } catch (error) {
    console.error('Error fetching booking:', error)
    return NextResponse.json(
      { error: 'Error fetching booking' },
      { status: 500 }
    )
  }
}

