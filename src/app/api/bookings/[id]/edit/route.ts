import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// 예약 수정
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)
    const body = await request.json()
    
    const { consultantId, topic, startAt, endAt, duration, price, description } = body

    // 유효성 검사
    if (!consultantId || !topic || !startAt || !endAt || !duration || !price) {
      return NextResponse.json(
        { success: false, error: '필수 필드가 누락되었습니다.' },
        { status: 400 }
      )
    }

    // 기존 예약 정보 조회
    const { data: existingBooking, error: fetchError } = await supabase
      .from('bookings')
      .select('*')
      .eq('id', id)
      .single()

    if (fetchError || !existingBooking) {
      return NextResponse.json(
        { success: false, error: '예약을 찾을 수 없습니다.' },
        { status: 404 }
      )
    }

    // 예약 변경 불가능한 상태 체크
    if (existingBooking.status === 'completed' || existingBooking.status === 'cancelled') {
      return NextResponse.json(
        { success: false, error: '완료되거나 취소된 예약은 변경할 수 없습니다.' },
        { status: 400 }
      )
    }

    // 상담사 정보 조회 및 예약 가능 시간 체크
    const { data: consultant, error: consultantError } = await supabase
      .from('consultants')
      .select('*')
      .eq('id', consultantId)
      .eq('is_active', true)
      .single()

    if (consultantError || !consultant) {
      return NextResponse.json(
        { success: false, error: '유효하지 않은 상담사입니다.' },
        { status: 400 }
      )
    }

    // 예약 시간이 상담사 근무 시간인지 체크
    const startDate = new Date(startAt)
    const dayOfWeek = startDate.getDay()
    const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday']
    const dayKey = dayNames[dayOfWeek]
    
    const daySchedule = consultant.available_hours[dayKey]
    if (!daySchedule || !daySchedule.isWorking) {
      return NextResponse.json(
        { success: false, error: '선택한 날짜는 상담사의 휴무일입니다.' },
        { status: 400 }
      )
    }

    // 예약 시간이 상담사 근무 시간 내인지 체크
    const startTime = startDate.toTimeString().slice(0, 5)
    const endTime = new Date(endAt).toTimeString().slice(0, 5)
    
    const isTimeAvailable = daySchedule.timeSlots.some((slot: { start: string; end: string }) => {
      return startTime >= slot.start && endTime <= slot.end
    })

    if (!isTimeAvailable) {
      return NextResponse.json(
        { success: false, error: '선택한 시간은 상담사의 근무 시간이 아닙니다.' },
        { status: 400 }
      )
    }

    // 기존 예약과 시간 충돌 체크 (자신 제외)
    const { data: conflictingBookings, error: conflictError } = await supabase
      .from('bookings')
      .select('*')
      .eq('consultant_id', consultantId)
      .eq('status', 'confirmed')
      .neq('id', id)
      .or(`start_at.lte.${endAt},end_at.gte.${startAt}`)

    if (conflictError) {
      console.error('[BOOKING EDIT] 충돌 체크 실패:', conflictError)
    } else if (conflictingBookings && conflictingBookings.length > 0) {
      return NextResponse.json(
        { success: false, error: '선택한 시간에 이미 다른 예약이 있습니다.' },
        { status: 400 }
      )
    }

    // 예약 정보 업데이트
    const { data: updatedBooking, error: updateError } = await supabase
      .from('bookings')
      .update({
        consultant_id: consultantId,
        topic,
        description: description || '',
        start_at: startAt,
        end_at: endAt,
        duration,
        price,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single()

    if (updateError) {
      console.error('[BOOKING EDIT] 업데이트 실패:', updateError)
      return NextResponse.json(
        { success: false, error: '예약 수정에 실패했습니다.' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      booking: updatedBooking,
      message: '예약이 성공적으로 수정되었습니다.'
    })

  } catch (error) {
    console.error('예약 수정 실패:', error)
    return NextResponse.json(
      { success: false, error: '예약 수정에 실패했습니다.' },
      { status: 500 }
    )
  }
}
