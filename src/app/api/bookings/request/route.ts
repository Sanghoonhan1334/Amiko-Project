import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { convertUserTimezoneToKST } from '@/lib/timezone-converter'

// 현지인이 한국인 친구에게 예약 요청
export async function POST(request: NextRequest) {
  try {
    const supabase = createClient()
    
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json(
        { error: '인증이 필요합니다.' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { partner_id, date, start_time, end_time, duration, topic, description, meet_url, schedule_id } = body

    if (!partner_id || !date || !start_time || !end_time) {
      return NextResponse.json(
        { error: '필수 정보가 누락되었습니다.' },
        { status: 400 }
      )
    }

    // 사용자 타임존 조회
    let userTimezone = 'Asia/Seoul'
    const { data: preferences } = await supabase
      .from('user_preferences')
      .select('timezone')
      .eq('user_id', user.id)
      .single()

    if (preferences?.timezone) {
      userTimezone = preferences.timezone
    }

    // 사용자가 선택한 시간은 사용자 타임존 기준이므로, KST로 변환
    const kstDateAndTime = convertUserTimezoneToKST(date, start_time, userTimezone)
    const kstDate = schedule_id ? undefined : kstDateAndTime.date // schedule_id가 있으면 original_date 사용
    const kstStartTime = schedule_id ? undefined : kstDateAndTime.time
    const kstEndTime = end_time ? convertUserTimezoneToKST(date, end_time, userTimezone).time : undefined

    // 30분 이내 시간 체크 (사용자 타임존 기준)
    const now = new Date()
    const slotDateTime = new Date(`${date}T${start_time}`)
    const minutesUntilSlot = (slotDateTime.getTime() - now.getTime()) / (1000 * 60)
    
    if (minutesUntilSlot < 30) {
      return NextResponse.json(
        { error: '예약은 최소 30분 전에 신청해야 합니다.' },
        { status: 400 }
      )
    }

    // schedule_id가 제공된 경우 해당 스케줄 조회
    let availableSlot
    if (schedule_id) {
      const { data: slot } = await supabase
        .from('available_schedules')
        .select('*')
        .eq('id', schedule_id)
        .eq('partner_id', partner_id)
        .eq('status', 'available')
        .single()
      
      if (!slot) {
        return NextResponse.json(
          { error: '해당 시간에 예약할 수 없습니다.' },
          { status: 400 }
        )
      }
      availableSlot = slot
    } else {
      // 해당 시간이 available_schedules에 존재하는지 확인 (KST 기준)
      const { data: slot } = await supabase
        .from('available_schedules')
        .select('*')
        .eq('partner_id', partner_id)
        .eq('date', kstDate!)
        .eq('start_time', kstStartTime!)
        .eq('status', 'available')
        .single()

      if (!slot) {
        return NextResponse.json(
          { error: '해당 시간에 예약할 수 없습니다.' },
          { status: 400 }
        )
      }
      availableSlot = slot
    }

    // KST 기준 날짜와 시간으로 저장
    const bookingDate = availableSlot.date // KST 기준
    const bookingStartTime = availableSlot.start_time // KST 기준
    const bookingEndTime = availableSlot.end_time // KST 기준

    // 예약 요청 생성 (KST 기준으로 저장)
    const { data: bookingRequest, error } = await supabase
      .from('booking_requests')
      .insert({
        partner_id,
        user_id: user.id,
        date: bookingDate, // KST 기준
        start_time: bookingStartTime, // KST 기준
        end_time: bookingEndTime, // KST 기준
        duration: duration || 60,
        topic,
        description,
        meet_url,
        status: 'pending'
      })
      .select()
      .single()

    if (error) {
      console.error('예약 요청 생성 오류:', error)
      return NextResponse.json(
        { error: '예약 요청 생성 실패' },
        { status: 500 }
      )
    }

    // available_schedules의 status를 pending으로 변경
    await supabase
      .from('available_schedules')
      .update({ 
        status: 'pending',
        booking_request_id: bookingRequest.id 
      })
      .eq('id', availableSlot.id)

    // 사용자 이름 가져오기
    const { data: userData } = await supabase
      .from('users')
      .select('full_name, nickname')
      .eq('id', user.id)
      .single()

    const userName = userData?.full_name || userData?.nickname || '익명'

    // 한국인 파트너에게 알림 전송 (KST 기준 날짜/시간 표시)
    await supabase
      .from('notifications')
      .insert({
        user_id: partner_id,
        type: 'booking_request',
        title: '새로운 예약 요청',
        message: `${userName}님이 ${bookingDate} ${bookingStartTime} (한국 시간) 예약을 요청했습니다.`,
        related_id: bookingRequest.id
      })

    return NextResponse.json({ bookingRequest })

  } catch (error) {
    console.error('예약 요청 생성 예외:', error)
    return NextResponse.json(
      { error: '예약 요청 생성 중 오류 발생' },
      { status: 500 }
    )
  }
}
