import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { convertKSTToUserTimezone } from '@/lib/timezone-converter'

// 특정 파트너의 가능한 시간 조회
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createClient()
    const { searchParams } = new URL(request.url)
    const date = searchParams.get('date') // YYYY-MM-DD 형식 (사용자가 선택한 날짜, 사용자 타임존 기준)

    if (!date) {
      return NextResponse.json(
        { error: '날짜가 필요합니다.' },
        { status: 400 }
      )
    }

    const partnerId = params.id

    // 현재 사용자 정보 조회 (타임존 확인용)
    const { data: { user } } = await supabase.auth.getUser()
    let userTimezone = 'Asia/Seoul' // 기본값: 한국 시간

    if (user) {
      // 사용자 타임존 조회
      const { data: preferences } = await supabase
        .from('user_preferences')
        .select('timezone')
        .eq('user_id', user.id)
        .single()

      if (preferences?.timezone) {
        userTimezone = preferences.timezone
      }
    }

    // 해당 날짜의 가능한 시간 조회 (available 상태만)
    // 주의: DB에 저장된 날짜는 KST 기준이므로, 사용자가 선택한 날짜를 KST로 변환해서 조회해야 함
    // 하지만 먼저 모든 KST 날짜의 스케줄을 가져온 다음, 각각을 사용자 타임존으로 변환하여 필터링하는 방식으로 처리
    
    // 일단 해당 날짜 근처의 모든 가능한 시간 조회 (KST 기준)
    // 날짜 범위를 넓게 잡아서 조회 (타임존 차이로 인해 다른 날짜로 변환될 수 있음)
    const searchDate = new Date(date + 'T00:00:00')
    const dayBefore = new Date(searchDate)
    dayBefore.setDate(dayBefore.getDate() - 1)
    const dayAfter = new Date(searchDate)
    dayAfter.setDate(dayAfter.getDate() + 1)

    const { data: availableSlots, error } = await supabase
      .from('available_schedules')
      .select('*')
      .eq('partner_id', partnerId)
      .gte('date', dayBefore.toISOString().split('T')[0])
      .lte('date', dayAfter.toISOString().split('T')[0])
      .eq('status', 'available')
      .order('date', { ascending: true })
      .order('start_time', { ascending: true })

    if (error) {
      console.error('가능 시간 조회 오류:', error)
      return NextResponse.json(
        { error: '가능 시간 조회 실패' },
        { status: 500 }
      )
    }

    // KST 기준 시간을 사용자 타임존으로 변환하고, 사용자가 선택한 날짜와 일치하는 것만 필터링
    const convertedSlots = (availableSlots || [])
      .map(slot => {
        // KST 기준 날짜와 시간을 사용자 타임존으로 변환
        const converted = convertKSTToUserTimezone(slot.date, slot.start_time, userTimezone)
        
        return {
          ...slot,
          original_date: slot.date, // 원본 KST 날짜 (디버깅용)
          original_start_time: slot.start_time, // 원본 KST 시간 (디버깅용)
          date: converted.date, // 변환된 날짜 (사용자 타임존)
          start_time: converted.time, // 변환된 시간 (사용자 타임존)
          end_time: convertKSTToUserTimezone(slot.date, slot.end_time, userTimezone).time
        }
      })
      .filter(slot => slot.date === date) // 사용자가 선택한 날짜와 일치하는 것만

    // 30분 이내의 시간은 제외 (사용자 타임존 기준으로 체크)
    const now = new Date()
    const currentDate = new Date(date)
    const filteredSlots = convertedSlots.filter(slot => {
      const slotDateTime = new Date(`${slot.date}T${slot.start_time}:00`)
      const minutesUntilSlot = (slotDateTime.getTime() - now.getTime()) / (1000 * 60)
      
      // 현재 날짜인 경우에만 30분 체크
      if (currentDate.toDateString() === now.toDateString()) {
        return minutesUntilSlot >= 30
      }
      return true // 미래 날짜는 모두 허용
    })

    return NextResponse.json({ 
      slots: filteredSlots,
      userTimezone // 사용자가 어떤 타임존으로 조회했는지 반환
    })

  } catch (error) {
    console.error('가능 시간 조회 예외:', error)
    return NextResponse.json(
      { error: '가능 시간 조회 중 오류 발생' },
      { status: 500 }
    )
  }
}

