import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { convertKSTToUserTimezone, convertUserTimezoneToKST, getTimezoneFromPhoneNumber } from '@/lib/timezone-converter'

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
        // user_preferences에 타임존이 없으면 회원가입 시 입력한 정보 기반으로 추정
        // 회원가입 시 입력한 전화번호와 국가코드 기준으로 타임존 결정
        const signupPhone = user.user_metadata?.phone
        const signupCountry = user.user_metadata?.country
        userTimezone = getTimezoneFromPhoneNumber(signupPhone, signupCountry)
        console.log(`[available-slots] 전화번호 기준 타임존: ${signupPhone} (국가번호 없을 시 fallback: ${signupCountry}) → ${userTimezone}`)
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
    
    // 먼저 사용자가 선택한 날짜(사용자 타임존 기준)를 KST 날짜로 변환
    const userDateConversion = convertUserTimezoneToKST(date, '12:00', userTimezone)
    const kstDateStr = userDateConversion.date
    const kstTimeStr = userDateConversion.time
    console.log(`[available-slots] 사용자 날짜 ${date} 12:00 (${userTimezone}) → KST 날짜 ${kstDateStr} ${kstTimeStr}`)
    
    // 변환 검증: KST 날짜를 다시 사용자 타임존으로 변환하여 일치 확인
    const verificationConversion = convertKSTToUserTimezone(kstDateStr, kstTimeStr, userTimezone)
    if (verificationConversion.date !== date) {
      console.warn(`[available-slots] ⚠️ 날짜 변환 검증 실패:`, {
        원본_사용자_날짜: date,
        변환된_KST_날짜: kstDateStr,
        역변환된_사용자_날짜: verificationConversion.date,
        불일치: true
      })
    }

    // 1. 특정 날짜에 등록된 스케줄 조회 (KST 날짜 기준)
    const kstDayBefore = new Date(new Date(`${kstDateStr}T00:00:00+09:00`).getTime() - 24 * 60 * 60 * 1000)
    const kstDayAfter = new Date(new Date(`${kstDateStr}T00:00:00+09:00`).getTime() + 24 * 60 * 60 * 1000)
    const kstDayBeforeStr = kstDayBefore.toISOString().split('T')[0]
    const kstDayAfterStr = kstDayAfter.toISOString().split('T')[0]
    
    console.log(`[available-slots] ⚠️ 특정 날짜 스케줄 조회 범위: ${kstDayBeforeStr} ~ ${kstDayAfterStr} (KST 기준)`)
    
    const { data: availableSlots, error } = await supabase
      .from('available_schedules')
      .select('*')
      .eq('partner_id', partnerUserId)
      .gte('date', kstDayBeforeStr)
      .lte('date', kstDayAfterStr)
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
    
    // KST 날짜의 요일 계산 (KST 타임존으로 명시적으로 계산)
    // 중요: kstDateStr은 이미 KST 기준 날짜 문자열 (예: "2025-10-30")
    // 이 날짜의 요일을 정확히 계산해야 함
    // day_of_week: 0=일요일, 1=월요일, 2=화요일, 3=수요일, 4=목요일, 5=금요일, 6=토요일
    
    // 방법: KST 날짜의 정오(12:00)를 나타내는 UTC timestamp를 계산한 후
    // 그 UTC timestamp를 KST 타임존으로 포맷팅하여 요일을 얻음
    
    // 1. KST 날짜의 정오(12:00 KST)를 나타내는 Date 객체 생성
    // 가장 정확한 방법: ISO 문자열 형식으로 KST 타임존 명시
    const [kstYear, kstMonth, kstDay] = kstDateStr.split('-').map(Number)
    
    // KST 날짜의 정오(12:00 KST)를 ISO 문자열로 생성
    // KST는 UTC+9이므로 "2025-10-30T12:00:00+09:00" 형식
    const kstISOString = `${String(kstYear).padStart(4, '0')}-${String(kstMonth).padStart(2, '0')}-${String(kstDay).padStart(2, '0')}T12:00:00+09:00`
    const kstDateObj = new Date(kstISOString)
    
    console.log(`[available-slots] ⚠️ KST 날짜 파싱: ${kstDateStr} → ISO: ${kstISOString} → Date 객체: ${kstDateObj.toISOString()}`)
    
    // 날짜 검증: 포맷팅된 날짜가 원본과 일치하는지 확인
    const kstFormatted = new Intl.DateTimeFormat('en-CA', {
      timeZone: 'Asia/Seoul',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    }).format(kstDateObj)
    
    if (kstFormatted !== kstDateStr) {
      console.warn(`[available-slots] ⚠️ 날짜 불일치! 원본: ${kstDateStr}, 포맷팅: ${kstFormatted}`)
    }
    
    // 2. 이 UTC timestamp를 KST 타임존으로 포맷팅하여 요일 얻기
    // Intl.DateTimeFormat은 UTC timestamp를 KST 타임존의 날짜/시간으로 변환
    const kstWeekdayShort = new Intl.DateTimeFormat('en-US', {
      timeZone: 'Asia/Seoul',
      weekday: 'short'
    }).format(kstDateObj)
    
    // 요일 문자열을 숫자로 매핑
    const weekdayShortMap: Record<string, number> = {
      'Sun': 0, 'Mon': 1, 'Tue': 2, 'Wed': 3, 'Thu': 4, 'Fri': 5, 'Sat': 6
    }
    const kstDayOfWeek = weekdayShortMap[kstWeekdayShort] ?? 0
    
    // Alternative method: long format으로도 검증
    const kstWeekdayLong = new Intl.DateTimeFormat('en-US', {
      timeZone: 'Asia/Seoul',
      weekday: 'long'
    }).format(kstDateObj)
    const weekdayLongMap: Record<string, number> = {
      'Sunday': 0, 'Monday': 1, 'Tuesday': 2, 'Wednesday': 3, 'Thursday': 4, 'Friday': 5, 'Saturday': 6
    }
    const kstDayOfWeekAlt = weekdayLongMap[kstWeekdayLong] ?? kstDayOfWeek
    
    // 추가 검증: UTC 기반 요일 계산 (Zeller's congruence 대신 간단한 방법)
    // kstDateStr의 날짜가 KST 타임존에서 어떤 요일인지 계산
    // KST는 UTC+9이므로, KST 날짜의 00:00 KST는 UTC 날짜의 15:00 (전날) 또는 16:00 (전날)입니다
    // 더 정확하게는, KST 날짜의 정오(12:00 KST)를 UTC로 변환하면 (예: 2025-10-30 12:00 KST = 2025-10-30 03:00 UTC)
    // 이 UTC 시간을 기반으로 요일을 계산하는 것이 더 정확합니다
    
    // 방법: KST 날짜의 정오를 UTC로 변환한 후, 그 UTC 시간을 Date 객체로 생성
    // 그런 다음 Intl.DateTimeFormat으로 KST 타임존의 요일을 얻습니다 (이미 위에서 했지만)
    
    // 대안: UTC Date 객체 생성 시 KST 오프셋 고려
    // KST는 UTC+9이므로, UTC timestamp = KST timestamp - 9 hours
    // KST 날짜의 정오(12:00) = UTC 날짜의 03:00 (같은 날)
    // 하지만 Date 객체는 UTC 기준이므로, KST 12:00를 나타내는 UTC Date 객체 생성
    const utcDateForKstNoon = new Date(Date.UTC(kstYear, kstMonth - 1, kstDay, 3, 0, 0)) // KST 12:00 = UTC 03:00 (대략)
    const utcBasedWeekday = new Intl.DateTimeFormat('en-US', {
      timeZone: 'Asia/Seoul',
      weekday: 'short'
    }).format(utcDateForKstNoon)
    const utcBasedDayOfWeek = weekdayShortMap[utcBasedWeekday] ?? kstDayOfWeek
    
    console.log(`[available-slots] UTC 기반 요일 계산: ${utcDateForKstNoon.toISOString()} → ${utcBasedWeekday} (${utcBasedDayOfWeek})`)
    
    // 최종 결정: 일관성을 위해 주 방법(kstDayOfWeek) 우선 사용
    // 하지만 모든 방법이 일치하는지 확인
    if (kstDayOfWeek !== utcBasedDayOfWeek || kstDayOfWeekAlt !== utcBasedDayOfWeek) {
      console.warn(`[available-slots] ⚠️ 요일 계산 방법 간 불일치:`, {
        주방법: `${kstDayOfWeek} (${kstWeekdayShort})`,
        대안방법: `${kstDayOfWeekAlt} (${kstWeekdayLong})`,
        UTC방법: `${utcBasedDayOfWeek} (${utcBasedWeekday})`
      })
    }
    
    console.log(`[available-slots] ⚠️ KST 날짜 ${kstDateStr} → KST 요일 계산 상세:`, {
      kstYear,
      kstMonth,
      kstDay,
      kstISOString,
      weekdayShort: kstWeekdayShort,
      weekdayLong: kstWeekdayLong,
      kstDayOfWeek: kstDayOfWeek,
      kstDayOfWeekAlt: kstDayOfWeekAlt,
      formattedDate: kstFormatted,
      dateMatches: kstFormatted === kstDateStr,
      dateObjISO: kstDateObj.toISOString(),
      dateObjUTC: kstDateObj.toUTCString(),
      dateObjTimestamp: kstDateObj.getTime()
    })
    console.log(`[available-slots] 사용자 날짜 ${date} (${userTimezone}) → KST 날짜 ${kstDateStr}, KST 요일: ${kstDayOfWeek} (${kstWeekdayShort})`)
    
    // 최종적으로 사용할 요일 결정
    // 주 방법(kstDayOfWeek)이 유효하면 사용, 아니면 alternative method 사용
    const finalKstDayOfWeek = (kstDayOfWeek !== undefined && kstDayOfWeek !== null) ? kstDayOfWeek : kstDayOfWeekAlt
    console.log(`[available-slots] ⚠️ 반복 스케줄 조회 조건: partner_id=${partnerUserId}, day_of_week=${finalKstDayOfWeek}, is_active=true`)
    
    // 먼저 해당 partner_id의 모든 반복 스케줄 조회 (디버깅용)
    const { data: allRecurringSchedules } = await supabase
      .from('partner_recurring_schedules')
      .select('*')
      .eq('partner_id', partnerUserId)
      .eq('is_active', true)
    
    const allDayOfWeeks = allRecurringSchedules?.map(s => s.day_of_week) || []
    const uniqueDayOfWeeks = [...new Set(allDayOfWeeks)].sort()
    
    // 더 상세한 디버깅: 각 스케줄의 day_of_week와 실제 요일 매핑 확인
    const dayNames = ['일요일', '월요일', '화요일', '수요일', '목요일', '금요일', '토요일']
    const dayNamesShort = ['일', '월', '화', '수', '목', '금', '토']
    
    console.log(`[available-slots] ⚠️ 해당 파트너의 모든 반복 스케줄 (활성):`, {
      totalCount: allRecurringSchedules?.length || 0,
      dayOfWeeksInDB: uniqueDayOfWeeks,
      dayOfWeeksInDBNames: uniqueDayOfWeeks.map(d => `${d}(${dayNamesShort[d]})`),
      queryingForDayOfWeek: finalKstDayOfWeek,
      queryingForDayOfWeekName: dayNamesShort[finalKstDayOfWeek],
      queryingForDayOfWeekOriginal: kstDayOfWeek,
      queryingForDayOfWeekOriginalName: dayNamesShort[kstDayOfWeek],
      matches: allDayOfWeeks.includes(finalKstDayOfWeek),
      kstDateStr,
      userSelectedDate: date,
      userTimezone,
      schedules: allRecurringSchedules?.map(s => ({
        id: s.id,
        day_of_week: s.day_of_week,
        day_name: dayNamesShort[s.day_of_week],
        day_name_full: dayNames[s.day_of_week],
        start_time: s.start_time,
        end_time: s.end_time,
        is_active: s.is_active,
        partner_id: s.partner_id
      })) || []
    })
    
    // 만약 매칭되는 스케줄이 없고, 다른 day_of_week가 있다면 상세 경고
    if (!allDayOfWeeks.includes(finalKstDayOfWeek) && allRecurringSchedules && allRecurringSchedules.length > 0) {
      console.warn(`[available-slots] ⚠️⚠️⚠️ 매칭 실패 상세:`, {
        계산된_KST_요일: `${finalKstDayOfWeek} (${dayNamesShort[finalKstDayOfWeek]})`,
        DB에_있는_요일들: uniqueDayOfWeeks.map(d => `${d} (${dayNamesShort[d]})`).join(', '),
        KST_날짜: kstDateStr,
        사용자_선택_날짜: date,
        사용자_타임존: userTimezone,
        계산_방법: {
          kstYear,
          kstMonth,
          kstDay,
          kstISOString,
          kstWeekdayShort,
          kstWeekdayLong,
          kstDayOfWeek,
          kstDayOfWeekAlt,
          finalKstDayOfWeek
        }
      })
    }
    
    const { data: recurringSchedules, error: recurringError } = await supabase
      .from('partner_recurring_schedules')
      .select('*')
      .eq('partner_id', partnerUserId)
      .eq('day_of_week', finalKstDayOfWeek) // KST 요일로 조회 (최종 결정된 값 사용)
      .eq('is_active', true)
      .order('start_time', { ascending: true })
    
    console.log(`[available-slots] ⚠️ 반복 스케줄 조회 결과 (필터링 후):`, {
      error: recurringError?.message || null,
      count: recurringSchedules?.length || 0,
      schedules: recurringSchedules?.map(s => ({
        day_of_week: s.day_of_week,
        start_time: s.start_time,
        end_time: s.end_time
      })) || []
    })

    if (recurringError) {
      console.error('반복 스케줄 조회 오류:', recurringError)
      // 반복 스케줄 조회 실패해도 계속 진행 (특정 날짜 스케줄만 사용)
    }

    console.log(`[available-slots] 사용자 날짜: ${date}, KST 날짜: ${kstDateStr}, KST 요일: ${finalKstDayOfWeek} (원본: ${kstDayOfWeek}), 반복 스케줄 수: ${recurringSchedules?.length || 0}`)
    console.log(`[available-slots] ⚠️ 조회된 반복 스케줄 상세:`, JSON.stringify(recurringSchedules, null, 2))
    console.log(`[available-slots] ⚠️ 조회된 특정 날짜 스케줄 수: ${availableSlots?.length || 0}`)
    if (availableSlots && availableSlots.length > 0) {
      console.log(`[available-slots] ⚠️ 특정 날짜 스케줄 상세:`, JSON.stringify(availableSlots.slice(0, 3), null, 2))
    }

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
    // 중요: 타임존 변환으로 인해 날짜가 하루 차이날 수 있으므로,
    // 원본 KST 날짜가 사용자가 선택한 날짜를 KST로 변환한 결과와 일치하면 포함
    // 예: 사용자가 2025-11-25 (Lima) 선택 → KST 2025-11-25로 변환
    //     KST 2025-11-25 10:10 → Lima 2025-11-24 20:10 (날짜는 바뀌지만 원본 KST 날짜는 일치)
    
    const matchingRecurring = convertedRecurringSlots
      .filter(slot => {
        // 원본 KST 날짜가 사용자가 선택한 날짜를 KST로 변환한 결과와 일치하는지 확인
        const kstDateMatch = slot.original_date === kstDateStr
        
        // 추가 검증: 변환된 날짜가 사용자 선택 날짜와 일치하는 경우도 포함
        const convertedDateMatch = slot.date === date
        
        // 둘 중 하나라도 일치하면 포함
        const shouldInclude = kstDateMatch || convertedDateMatch
        
        if (shouldInclude) {
          if (kstDateMatch && convertedDateMatch) {
            console.log(`[available-slots] 반복 스케줄 날짜 일치: KST ${slot.original_date} === ${kstDateStr}, 변환 ${slot.date} === ${date}`)
          } else if (kstDateMatch) {
            console.log(`[available-slots] 반복 스케줄 날짜 일치 (KST 기준): KST ${slot.original_date} === ${kstDateStr}, 변환된 날짜: ${slot.date}`)
          } else {
            console.log(`[available-slots] 반복 스케줄 날짜 일치 (변환 기준): 변환 ${slot.date} === ${date}`)
          }
          return true
        } else {
          console.log(`[available-slots] 반복 스케줄 날짜 불일치 제외: KST ${slot.original_date} !== ${kstDateStr} AND 변환 ${slot.date} !== ${date}`)
          return false
        }
      })
      .map(slot => {
        // KST 날짜가 일치하지만 변환된 날짜가 다를 경우, 사용자가 선택한 날짜로 덮어쓰기
        // 예: 사용자가 2025-11-25 선택 → KST 2025-11-25 → 변환 시 2025-11-24가 되었더라도
        //     사용자가 선택한 날짜(2025-11-25)로 표시해야 함
        if (slot.original_date === kstDateStr && slot.date !== date) {
          return {
            ...slot,
            date: date // 사용자가 선택한 날짜로 강제 설정
          }
        }
        return slot
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
      console.warn(`[available-slots] 변환된 KST 날짜: ${kstDateStr}, KST 요일: ${finalKstDayOfWeek} (원본: ${kstDayOfWeek})`)
      console.warn(`[available-slots] 조회된 반복 스케줄 수: ${recurringSchedules?.length || 0}개`)
    }

    return NextResponse.json({ 
      slots: filteredSlots,
      userTimezone, // 사용자가 어떤 타임존으로 조회했는지 반환
      debug: {
        partnerUserId,
        kstDateStr,
        kstDayOfWeek: finalKstDayOfWeek,
        userSelectedDate: date,
        allRecurringSchedulesCount: allRecurringSchedules?.length || 0,
        matchingRecurringSchedulesCount: recurringSchedules?.length || 0,
        convertedRecurringSlotsCount: convertedRecurringSlots.length,
        matchingRecurringCount: matchingRecurring.length,
        specificSlotsCount: availableSlots?.length || 0,
        convertedSpecificSlotsCount: convertedSlots.length,
        uniqueSlotsCount: uniqueSlots.length,
        finalSlotsCount: filteredSlots.length
      }
    })

  } catch (error) {
    console.error('가능 시간 조회 예외:', error)
    return NextResponse.json(
      { error: '가능 시간 조회 중 오류 발생' },
      { status: 500 }
    )
  }
}

