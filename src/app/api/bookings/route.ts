import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { emailService } from '@/lib/email-service'

// CORS 프리: 내부 API이므로 CORS 설정 불필요

export async function POST(request: Request) {
  try {
    const body = await request.json()
    console.log('[BOOKING] 받은 데이터:', body)
    
    const { userId, topic, startAt, endAt, price, description, consultantId, duration } = body

    // 유효성 검사
    if (!userId || !topic || !startAt || !endAt || !price || !consultantId) {
      console.log('[BOOKING] 필수 필드 누락:', { userId, topic, startAt, endAt, price, consultantId })
      return NextResponse.json(
        { success: false, error: '필수 필드가 누락되었습니다.' },
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
      console.error('[BOOKING] 상담사 조회 실패:', consultantError)
      return NextResponse.json(
        { success: false, error: '유효하지 않은 상담사입니다.' },
        { status: 400 }
      )
    }

    // 예약 시간이 상담사 근무 시간인지 체크
    const startDate = new Date(startAt)
    const dayOfWeek = startDate.getDay() // 0: 일요일, 1: 월요일, ...
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

    // 기존 예약과 시간 충돌 체크
    const { data: conflictingBookings, error: conflictError } = await supabase
      .from('bookings')
      .select('*')
      .eq('consultant_id', consultantId)
      .eq('status', 'confirmed')
      .or(`start_at.lte.${endAt},end_at.gte.${startAt}`)

    if (conflictError) {
      console.error('[BOOKING] 충돌 체크 실패:', conflictError)
    } else if (conflictingBookings && conflictingBookings.length > 0) {
      return NextResponse.json(
        { success: false, error: '선택한 시간에 이미 다른 예약이 있습니다.' },
        { status: 400 }
      )
    }

    // 유니크한 주문 ID 생성
    const orderId = `order-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`

    // Supabase에 예약 저장
    const { data: booking, error } = await supabase
      .from('bookings')
      .insert({
        user_id: userId,
        consultant_id: consultantId,
        topic,
        description: description || '',
        start_at: startAt,
        end_at: endAt,
        duration: duration || 60,
        price: price,
        order_id: orderId,
        status: 'pending'
      })
      .select()
      .single()

    if (error) {
      console.error('[BOOKING] Supabase 저장 실패:', error)
      return NextResponse.json(
        { success: false, error: '예약 저장에 실패했습니다.' },
        { status: 500 }
      )
    }

    console.log('[BOOKING] 생성됨:', booking)

    // 사용자 정보 조회 (이메일 발송용)
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('email, name')
      .eq('id', userId)
      .single()

    if (!userError && user) {
      try {
        // 예약 완료 이메일 발송
        await emailService.sendNotificationEmail(
          user.email,
          'new_booking',
          {
            consultantName: consultant.name,
            bookingDate: new Date(startAt).toLocaleString('ko-KR'),
            duration: duration || 60,
            amount: price,
            topic: topic
          }
        )
        console.log('[BOOKING] 예약 완료 이메일 발송 성공')
      } catch (emailError) {
        console.error('[BOOKING] 이메일 발송 실패:', emailError)
        // 이메일 발송 실패는 예약 생성 실패로 처리하지 않음
      }
    }

    return NextResponse.json({ 
      success: true, 
      booking,
      message: '예약이 생성되었습니다.'
    })
    
  } catch (error) {
    console.error('예약 생성 실패:', error)
    return NextResponse.json(
      { success: false, error: '예약 생성에 실패했습니다.' },
      { status: 500 }
    )
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    
    if (!userId) {
      return NextResponse.json(
        { success: false, error: '사용자 ID가 필요합니다.' },
        { status: 400 }
      )
    }

    // 기본 예약 정보만 조회 (JOIN 제거)
    const { data: bookings, error } = await supabase
      .from('bookings')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('[BOOKING] 조회 실패:', error)
      return NextResponse.json(
        { success: false, error: '예약 목록 조회에 실패했습니다.' },
        { status: 500 }
      )
    }

    return NextResponse.json({ 
      success: true, 
      bookings: bookings || [],
      message: '예약 목록 조회 성공'
    })
    
  } catch (error) {
    console.error('예약 목록 조회 실패:', error)
    return NextResponse.json(
      { success: false, message: '예약 목록 조회에 실패했습니다.' },
      { status: 500 }
    )
  }
}
