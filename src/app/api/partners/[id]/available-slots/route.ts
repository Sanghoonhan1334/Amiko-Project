import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { convertKSTToUserTimezone, convertUserTimezoneToKST } from '@/lib/timezone-converter'

// 특정 파트너의 가능한 시간 조회
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
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

    // params가 Promise인 경우 처리
    const resolvedParams = 'then' in params ? await params : params
    const partnerIdFromParam = resolvedParams.id

    // conversation_partners 테이블에서 user_id 가져오기
    let partnerUserId = partnerIdFromParam
    
    // 먼저 conversation_partners에서 조회 시도 (conversation_partners.id인 경우)
    const { data: conversationPartner } = await supabase
      .from('conversation_partners')
      .select('user_id')
      .eq('id', partnerIdFromParam)
      .single()
    
    if (conversationPartner?.user_id) {
      partnerUserId = conversationPartner.user_id
      console.log('[available-slots] conversation_partners.id로 찾음, user_id:', partnerUserId)
    } else {
      // 이미 user_id인 경우 그대로 사용
      console.log('[available-slots] user_id로 직접 사용:', partnerUserId)
    }

    // 현재 사용자 정보 조회 (타임존 확인용)
    const { data: { user } } = await supabase.auth.getUser()
    
    // 1. 클라이언트에서 전달한 타임존 확인 (가장 우선순위)
    const clientTimezone = request.headers.get('x-user-timezone')
    let userTimezone: string | null = null

    if (clientTimezone) {
      userTimezone = clientTimezone
      console.log(`[available-slots] 클라이언트에서 전달된 타임존: ${userTimezone}`)
    }

    // 2. 사용자가 있으면 DB에서 타임존 확인
    if (!userTimezone && user) {
      // 사용자 타임존 조회
      const { data: preferences } = await supabase
        .from('user_preferences')
        .select('timezone')
        .eq('user_id', user.id)
        .single()

      if (preferences?.timezone) {
        userTimezone = preferences.timezone
        console.log(`[available-slots] DB user_preferences 타임존: ${userTimezone}`)
      } else {
        // user_preferences에 타임존이 없으면 회원가입 시 입력한 국적(user_metadata.country) 기반으로 추정
        // 주의: users.country는 다른 곳에서 변경될 수 있으므로 회원가입 시 입력한 값만 사용
        const signupCountry = user.user_metadata?.country
        
        const { data: userData } = await supabase
          .from('users')
          .select('language')
          .eq('id', user.id)
          .single()

        // 회원가입 시 입력한 국적이 있으면 그것을 기준으로 타임존 결정
        if (signupCountry) {
          // 회원가입 시 입력한 국적 코드를 타임존으로 매핑
          const countryToTimezone: Record<string, string> = {
            'KR': 'Asia/Seoul',
            '대한민국': 'Asia/Seoul',
            'South Korea': 'Asia/Seoul',
            'Korea': 'Asia/Seoul',
            'KOR': 'Asia/Seoul',
            'PE': 'America/Lima', // 페루
            'CO': 'America/Bogota', // 콜롬비아
            'MX': 'America/Mexico_City', // 멕시코
            'CL': 'America/Santiago', // 칠레
            'AR': 'America/Buenos_Aires', // 아르헨티나
            'BR': 'America/Sao_Paulo', // 브라질
            'US': 'America/New_York', // 미국
            'ES': 'Europe/Madrid', // 스페인
          }
          
          const countryTimezone = countryToTimezone[signupCountry]
          if (countryTimezone) {
            userTimezone = countryTimezone
            console.log(`[available-slots] 회원가입 국적 기반 타임존 설정: ${signupCountry} → ${userTimezone}`)
          } else if (userData?.language === 'es') {
            // 매핑되지 않지만 스페인어권이면 페루로 가정
            userTimezone = 'America/Lima'
            console.log(`[available-slots] language 기반 타임존 설정: es → ${userTimezone}`)
          }
        } else if (userData?.language === 'es') {
          // 회원가입 국적이 없고 language만 있으면 language로 판단
          userTimezone = 'America/Lima'
          console.log(`[available-slots] language만으로 타임존 설정: es → ${userTimezone}`)
        } else if (userData?.language === 'ko') {
          userTimezone = 'Asia/Seoul'
          console.log(`[available-slots] language만으로 타임존 설정: ko → ${userTimezone}`)
        }
      }
    }

    // 3. 모든 방법이 실패하면 기본값: 페루 타임존 (대부분 현지인)
    if (!userTimezone) {
      userTimezone = 'America/Lima'
      console.log(`[available-slots] 최종 fallback: 기본값 ${userTimezone}`)
    }

    console.log(`[available-slots] 최종 사용자 타임존: ${userTimezone}`)

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

    // 1. 특정 날짜에 등록된 스케줄 조회
    const { data: availableSlots, error } = await supabase
      .from('available_schedules')
      .select('*')
      .eq('partner_id', partnerUserId)
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

    // 2. 반복 스케줄 조회
    // 중요: 사용자가 선택한 날짜(date, 사용자 타임존 기준)를 KST 날짜로 변환한 후
    // 그 KST 날짜의 요일로 반복 스케줄을 조회해야 함
    // 예: 페루 일요일 → KST 월요일 → day_of_week = 1로 조회
    
    // 사용자가 선택한 날짜(사용자 타임존 기준)를 KST 날짜로 변환
    const userDateConversion = convertUserTimezoneToKST(date, '12:00', userTimezone)
    const kstDateStr = userDateConversion.date
    
    // KST 날짜의 요일 계산 (KST 타임존으로 명시적으로 계산)
    // 주의: new Date()는 서버의 로컬 타임존으로 해석하므로, KST 타임존으로 명시적으로 계산해야 함
    const kstFormatter = new Intl.DateTimeFormat('en-US', {
      timeZone: 'Asia/Seoul',
      weekday: 'short'
    })
    const kstDateObj = new Date(`${kstDateStr}T12:00:00+09:00`) // KST로 명시적으로 설정
    const kstDayOfWeek = kstDateObj.getUTCDay() // UTC 기준으로 요일 계산 (더 안정적)
    
    // KST 요일 이름 확인 (디버깅용)
    const kstWeekday = kstFormatter.format(kstDateObj)
    console.log(`[available-slots] 사용자 날짜 ${date} (${userTimezone}) → KST 날짜 ${kstDateStr}, KST 요일: ${kstDayOfWeek} (${kstWeekday})`)
    
    const { data: recurringSchedules, error: recurringError } = await supabase
      .from('partner_recurring_schedules')
      .select('*')
      .eq('partner_id', partnerUserId)
      .eq('day_of_week', kstDayOfWeek) // KST 요일로 조회
      .eq('is_active', true)
      .order('start_time', { ascending: true })

    if (recurringError) {
      console.error('반복 스케줄 조회 오류:', recurringError)
      // 반복 스케줄 조회 실패해도 계속 진행 (특정 날짜 스케줄만 사용)
    }

    console.log(`[available-slots] 사용자 날짜: ${date}, KST 날짜: ${kstDateStr}, KST 요일: ${kstDayOfWeek}, 반복 스케줄 수: ${recurringSchedules?.length || 0}`)

    // 3. 특정 날짜 스케줄 처리 (KST 기준 시간을 사용자 타임존으로 변환)
    const convertedSlots = (availableSlots || [])
      .map(slot => {
        // KST 기준 날짜와 시간을 사용자 타임존으로 변환
        console.log(`[available-slots] 특정 날짜 스케줄 변환 시작: KST ${slot.date} ${slot.start_time} → ${userTimezone}`)
        const converted = convertKSTToUserTimezone(slot.date, slot.start_time, userTimezone)
        const convertedEnd = convertKSTToUserTimezone(slot.date, slot.end_time, userTimezone)
        
        console.log(`[available-slots] 변환 결과: KST ${slot.date} ${slot.start_time} → 사용자 타임존 ${converted.date} ${converted.time}`)
        console.log(`[available-slots] 종료 시간 변환: KST ${slot.end_time} → ${convertedEnd.time}`)
        
        return {
          ...slot,
          original_date: slot.date, // 원본 KST 날짜 (디버깅용)
          original_start_time: slot.start_time, // 원본 KST 시간 (디버깅용)
          original_end_time: slot.end_time, // 원본 KST 종료 시간
          date: converted.date, // 변환된 날짜 (사용자 타임존)
          start_time: converted.time, // 변환된 시간 (사용자 타임존)
          end_time: convertedEnd.time, // 변환된 종료 시간
          source: 'specific' // 특정 날짜 스케줄임을 표시
        }
      })
      .filter(slot => slot.date === date) // 사용자가 선택한 날짜와 일치하는 것만
    
    console.log(`[available-slots] 특정 날짜 스케줄 변환 완료: ${convertedSlots.length}개 (필터링 전: ${availableSlots?.length || 0}개)`)

    // 4. 반복 스케줄을 해당 날짜의 실제 슬롯으로 변환
    // 위에서 이미 계산한 kstDateStr 사용 (사용자 선택 날짜를 KST로 변환한 결과)
    const recurringSlots: any[] = []
    if (recurringSchedules && recurringSchedules.length > 0) {
      // 반복 스케줄의 시간은 KST 기준이므로, kstDateStr와 함께 사용자 타임존으로 변환할 예정
      
      recurringSchedules.forEach(recurring => {
        // 20분 단위로 슬롯 생성
        const startTime = recurring.start_time // KST 기준
        const endTime = recurring.end_time // KST 기준
        
        let currentTime = startTime
        while (currentTime < endTime) {
          const [hours, minutes] = currentTime.split(':').map(Number)
          const slotStart = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`
          
          // 20분 후 시간 계산
          const slotEndMinutes = minutes + 20
          const slotEndHours = hours + Math.floor(slotEndMinutes / 60)
          const slotEndMinutesFinal = slotEndMinutes % 60
          const slotEnd = `${String(slotEndHours).padStart(2, '0')}:${String(slotEndMinutesFinal).padStart(2, '0')}`
          
          if (slotEnd <= endTime) {
            // 여기서는 임시로 원본 KST 정보만 저장, 나중에 변환 단계에서 사용자 타임존으로 변환
            recurringSlots.push({
              id: `recurring-${recurring.id}-${slotStart}`, // 가상 ID
              partner_id: partnerUserId,
              date: date, // 임시로 사용자 타임존 날짜 (나중에 변환될 예정)
              start_time: slotStart, // KST 기준 (나중에 변환)
              end_time: slotEnd, // KST 기준 (나중에 변환)
              status: 'available',
              source: 'recurring', // 반복 스케줄임을 표시
              original_date: kstDateStr, // 원본 KST 날짜 (변환 시 사용)
              original_start_time: slotStart, // 원본 KST 시간
              original_end_time: slotEnd // 원본 KST 시간
            })
          }
          
          // 20분 추가
          currentTime = slotEnd
        }
      })
    }

    console.log(`[available-slots] 특정 날짜 스케줄: ${convertedSlots.length}개, 반복 스케줄: ${recurringSlots.length}개`)

    // 5. 반복 스케줄의 시간을 사용자 타임존으로 변환
    // 반복 스케줄의 시간은 KST 기준이므로, KST 날짜와 시간을 사용자 타임존으로 변환
    const convertedRecurringSlots = recurringSlots.map(slot => {
      // 이미 위에서 계산한 kstDateStr 사용 (사용자가 선택한 날짜를 KST로 변환한 결과)
      console.log(`[available-slots] 반복 스케줄 변환 시작: KST 날짜 ${kstDateStr}, KST 시간 ${slot.original_start_time} → ${userTimezone}`)
      
      // KST 기준 날짜(kstDateStr)와 시간을 사용자 타임존으로 변환
      const converted = convertKSTToUserTimezone(kstDateStr, slot.original_start_time, userTimezone)
      const convertedEnd = convertKSTToUserTimezone(kstDateStr, slot.original_end_time, userTimezone)
      
      console.log(`[available-slots] 반복 스케줄 변환 결과: KST ${kstDateStr} ${slot.original_start_time} → 사용자 타임존 ${converted.date} ${converted.time}`)
      console.log(`[available-slots] 반복 스케줄 종료 시간: KST ${slot.original_end_time} → ${convertedEnd.time}`)
      
      return {
        ...slot,
        date: converted.date, // 사용자 타임존 기준 날짜 (변환 후)
        start_time: converted.time, // 사용자 타임존 기준 시간 (변환 후)
        end_time: convertedEnd.time, // 사용자 타임존 기준 시간
        original_date: kstDateStr, // 원본 KST 날짜
        original_start_time: slot.original_start_time, // 원본 KST 시간
        original_end_time: slot.original_end_time // 원본 KST 시간
      }
    })
    
    // 6. 특정 날짜 스케줄과 반복 스케줄 합치기 (이미 변환된 convertedSlots 사용)
    console.log(`[available-slots] 필터링 전: convertedSlots ${convertedSlots.length}개, convertedRecurringSlots ${convertedRecurringSlots.length}개`)
    
    // 변환된 날짜와 사용자 선택 날짜 비교
    // 중요: 변환된 날짜가 정확히 사용자가 선택한 날짜와 일치해야만 포함
    // 타임존 변환 과정에서 날짜가 변경될 수 있지만, 최종적으로 사용자 타임존 기준 날짜가 일치해야 함
    
    const matchingRecurring = convertedRecurringSlots.filter(slot => {
      // 변환된 날짜가 사용자가 선택한 날짜와 정확히 일치해야 함
      const exactMatch = slot.date === date
      
      if (exactMatch) {
        console.log(`[available-slots] 반복 스케줄 날짜 일치: ${slot.date} === ${date}`)
        return true
      } else {
        console.log(`[available-slots] 반복 스케줄 날짜 불일치 제외: 변환된 날짜 ${slot.date} !== 사용자 선택 날짜 ${date}, 원본 KST: ${slot.original_date}`)
        // 날짜가 정확히 일치하지 않으면 제외
        return false
      }
    })
    
    console.log(`[available-slots] 날짜 일치하는 반복 스케줄: ${matchingRecurring.length}개 (전체: ${convertedRecurringSlots.length}개)`)
    
    // 만약 날짜 불일치로 모두 제외되었지만 원본 KST 날짜가 일치하는 경우 디버깅
    if (matchingRecurring.length === 0 && convertedRecurringSlots.length > 0) {
      const firstSlot = convertedRecurringSlots[0]
      console.warn(`[available-slots] ⚠️ 모든 반복 스케줄이 날짜 불일치로 제외됨!`)
      console.warn(`[available-slots] 사용자 선택 날짜: ${date}, 변환된 날짜: ${firstSlot.date}, 원본 KST: ${firstSlot.original_date}, KST 변환: ${kstDateStr}`)
    }
    
    const allSlots = [
      ...convertedSlots, // 이미 사용자 타임존으로 변환되고 필터링됨
      ...matchingRecurring // 사용자가 선택한 날짜와 정확히 일치하는 것만
    ]
    
    console.log(`[available-slots] 합친 슬롯 수: ${allSlots.length}개`)

    // 7. 중복 제거 (특정 날짜 스케줄과 반복 스케줄이 같은 시간대인 경우)
    const uniqueSlots = allSlots.reduce((acc: any[], slot) => {
      const existing = acc.find(s => s.start_time === slot.start_time && s.end_time === slot.end_time && s.date === slot.date)
      if (!existing) {
        acc.push(slot)
      }
      return acc
    }, [])
    
    console.log(`[available-slots] 중복 제거 후: ${uniqueSlots.length}개`)

    // 8. 시간 순으로 정렬
    uniqueSlots.sort((a, b) => a.start_time.localeCompare(b.start_time))

    // 9. 30분 이내의 시간은 제외 (사용자 타임존 기준으로 체크)
    const now = new Date()
    const currentDate = new Date(date + 'T00:00:00')
    const filteredSlots = uniqueSlots.filter(slot => {
      // 먼저 날짜가 정확히 일치하는지 다시 확인 (안전장치)
      if (slot.date !== date) {
        console.log(`[available-slots] 날짜 불일치로 최종 필터링에서 제외: ${slot.date} !== ${date}`)
        return false
      }
      
      try {
        const slotDateTime = new Date(`${slot.date}T${slot.start_time}:00`)
        const minutesUntilSlot = (slotDateTime.getTime() - now.getTime()) / (1000 * 60)
        
        // 현재 날짜인 경우에만 30분 체크
        if (currentDate.toDateString() === now.toDateString()) {
          const keep = minutesUntilSlot >= 30
          if (!keep) {
            console.log(`[available-slots] 30분 이내 시간 제외: ${slot.date} ${slot.start_time} (${minutesUntilSlot.toFixed(1)}분 후)`)
          }
          return keep
        }
        return true // 미래 날짜는 모두 허용
      } catch (error) {
        console.error(`[available-slots] 시간 필터링 에러:`, slot, error)
        return false // 에러 시 제외
      }
    })

    console.log(`[available-slots] 최종 슬롯 수: ${filteredSlots.length}개 (30분 필터링 전: ${uniqueSlots.length}개)`)
    console.log(`[available-slots] 사용자 선택 날짜: ${date} (${userTimezone})`)
    
    // 최종 슬롯 디버깅
    if (filteredSlots.length > 0) {
      console.log(`[available-slots] 최종 슬롯 목록:`, filteredSlots.map(s => `${s.date} ${s.start_time}`))
    } else {
      console.warn(`[available-slots] ⚠️ 최종 슬롯이 0개입니다! 사용자 날짜: ${date}, 타임존: ${userTimezone}`)
      console.warn(`[available-slots] 변환된 KST 날짜: ${kstDateStr}, KST 요일: ${kstDayOfWeek}`)
      console.warn(`[available-slots] 조회된 반복 스케줄 수: ${recurringSchedules?.length || 0}개`)
    }

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

