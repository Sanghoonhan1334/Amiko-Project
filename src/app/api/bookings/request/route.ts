import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseClient } from '@/lib/supabase'
import { createServerSupabaseClient } from '@/lib/supabaseServer'
import { convertUserTimezoneToKST, getTimezoneFromPhoneNumber } from '@/lib/timezone-converter'

// 현지인이 한국인 친구에게 예약 요청
export async function POST(request: NextRequest) {
  try {
    const supabase = await createSupabaseClient()
    
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      // 사용자 언어는 아직 확인 전이므로 일단 기본 메시지 (다음에 getErrorMessage로 대체)
      return NextResponse.json(
        { error: 'Se requiere autenticación.' },
        { status: 401 }
      )
    }

    // 사용자 언어 결정 (signup 시 선택한 country 기반)
    let userLanguage = 'es' // 기본값: 스페인어
    try {
      const supabaseServer = createServerSupabaseClient()
      const { data: { user: authUser }, error: adminError } = await supabaseServer.auth.admin.getUserById(user.id)
      
      if (adminError) {
        console.error('[booking-request] admin.getUserById 오류:', adminError)
      } else {
        const signupCountry = authUser?.user_metadata?.country
        if (signupCountry === 'KR') {
          userLanguage = 'ko'
        } else {
          userLanguage = 'es'
        }
        console.log('[booking-request] 사용자 언어 결정:', { signupCountry, userLanguage })
      }
    } catch (error) {
      console.error('[booking-request] 사용자 언어 확인 실패, 기본값 사용:', error)
    }

    // 에러 메시지 번역 함수
    const getErrorMessage = (key: 'auth_required' | 'missing_info' | 'too_soon' | 'schedule_not_found' | 'slot_unavailable' | 'request_failed' | 'error_occurred' | 'invalid_recurring_format') => {
      const messages: Record<string, { ko: string; es: string }> = {
        auth_required: { ko: '인증이 필요합니다.', es: 'Se requiere autenticación.' },
        missing_info: { ko: '필수 정보가 누락되었습니다.', es: 'Falta información requerida.' },
        too_soon: { ko: '예약은 최소 30분 전에 신청해야 합니다.', es: 'La reserva debe solicitarse al menos 30 minutos antes.' },
        schedule_not_found: { ko: '해당 반복 스케줄을 찾을 수 없습니다.', es: 'No se pudo encontrar el horario recurrente correspondiente.' },
        slot_unavailable: { ko: '해당 시간에 예약할 수 없습니다.', es: 'No se puede reservar en este horario.' },
        request_failed: { ko: '예약 요청 생성 실패', es: 'Error al crear la solicitud de reserva.' },
        error_occurred: { ko: '예약 요청 생성 중 오류 발생', es: 'Ocurrió un error al crear la solicitud de reserva.' },
        invalid_recurring_format: { ko: '반복 스케줄 ID 형식이 올바르지 않습니다.', es: 'El formato del ID del horario recurrente no es válido.' }
      }
      return messages[key]?.[userLanguage] || messages[key]?.es || 'Error desconocido.'
    }

    const body = await request.json()
    const { partner_id, date, start_time, end_time, duration, topic, description, meet_url, schedule_id } = body

    console.log('[booking-request] 요청 데이터:', { partner_id, date, start_time, schedule_id })

    if (!partner_id || !date || !start_time || !end_time) {
      return NextResponse.json(
        { error: getErrorMessage('missing_info') },
        { status: 400 }
      )
    }

    // partner_id가 conversation_partners.id인지 users.id인지 확인하고 변환
    let actualPartnerId = partner_id
    const { data: conversationPartner } = await supabase
      .from('conversation_partners')
      .select('user_id')
      .eq('id', partner_id)
      .single()

    if (conversationPartner?.user_id) {
      actualPartnerId = conversationPartner.user_id
      console.log('[booking-request] conversation_partners.id → user_id 변환:', partner_id, '→', actualPartnerId)
    } else {
      // 이미 user_id인 경우 그대로 사용
      console.log('[booking-request] user_id로 직접 사용:', actualPartnerId)
    }

    // 사용자 타임존 조회 (회원가입 시 입력한 전화번호의 국가번호 기준)
    let userTimezone = 'America/Lima' // 기본값: 페루
    try {
      const supabaseServer = createServerSupabaseClient()
      const { data: { user: authUser }, error: adminError } = await supabaseServer.auth.admin.getUserById(user.id)
      
      if (adminError) {
        console.error('[booking-request] admin.getUserById 오류 (timezone):', adminError)
      } else {
        const signupPhone = authUser?.user_metadata?.phone
        const signupCountry = authUser?.user_metadata?.country
        userTimezone = getTimezoneFromPhoneNumber(signupPhone, signupCountry)
        console.log('[booking-request] 전화번호 기준 타임존:', { phone: signupPhone, country: signupCountry, timezone: userTimezone })
      }
    } catch (error) {
      console.error('[booking-request] 사용자 타임존 확인 실패, 기본값 사용:', error)
    }

    // 사용자가 선택한 시간은 사용자 타임존 기준이므로, KST로 변환
    const kstDateAndTime = convertUserTimezoneToKST(date, start_time, userTimezone)
    const kstDate = schedule_id ? undefined : kstDateAndTime.date // schedule_id가 있으면 original_date 사용
    const kstStartTime = schedule_id ? undefined : kstDateAndTime.time
    const kstEndTime = end_time ? convertUserTimezoneToKST(date, end_time, userTimezone).time : undefined

    // 30분 이내 시간 체크 (사용자 타임존 기준으로 정확하게)
    const now = new Date()
    const formatter = new Intl.DateTimeFormat('en-CA', {
      timeZone: userTimezone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    })
    
    const nowParts = formatter.formatToParts(now)
    const nowYear = nowParts.find(p => p.type === 'year')?.value || '0'
    const nowMonth = nowParts.find(p => p.type === 'month')?.value || '0'
    const nowDay = nowParts.find(p => p.type === 'day')?.value || '0'
    const nowHour = nowParts.find(p => p.type === 'hour')?.value || '0'
    const nowMinute = nowParts.find(p => p.type === 'minute')?.value || '0'
    
    const nowDateStr = `${nowYear}-${nowMonth}-${nowDay}`
    const nowTimeStr = `${nowHour.padStart(2, '0')}:${nowMinute.padStart(2, '0')}`
    
    // 사용자 timezone의 현재 날짜/시간과 비교
    const isPastDate = date < nowDateStr
    const isPastTime = date === nowDateStr && start_time < nowTimeStr
    const isPast = isPastDate || isPastTime
    
    // 30분 미만인지 확인 (같은 날짜이고 과거가 아닌 경우만)
    let isTooSoon = false
    if (date === nowDateStr && !isPast) {
      const [slotHour, slotMinute] = start_time.split(':').map(Number)
      const [currentHour, currentMinute] = nowTimeStr.split(':').map(Number)
      const slotTotalMinutes = slotHour * 60 + slotMinute
      const currentTotalMinutes = currentHour * 60 + currentMinute
      const diffMinutes = slotTotalMinutes - currentTotalMinutes
      isTooSoon = diffMinutes < 30
    }
    
    if (isPast || isTooSoon) {
      return NextResponse.json(
        { error: getErrorMessage('too_soon') },
        { status: 400 }
      )
    }

    // schedule_id가 제공된 경우 해당 스케줄 조회
    let availableSlot
    if (schedule_id && !schedule_id.startsWith('recurring-')) {
      // 특정 날짜 스케줄인 경우
      const { data: slot } = await supabase
        .from('available_schedules')
        .select('*')
        .eq('id', schedule_id)
        .eq('partner_id', actualPartnerId)
      .eq('status', 'available')
      .single()
      
      if (!slot) {
        return NextResponse.json(
          { error: getErrorMessage('slot_unavailable') },
          { status: 400 }
        )
      }
      availableSlot = slot
    } else if (schedule_id && schedule_id.startsWith('recurring-')) {
      // 반복 스케줄인 경우 - recurring 스케줄에서 정보 가져오기
      // schedule_id 형식: recurring-{recurring_id}-{time}
      // 예: recurring-a5591d76-8eb9-4f63-b255-94fde9bb9278-10:10
      const recurringPrefix = 'recurring-'
      const afterPrefix = schedule_id.substring(recurringPrefix.length)
      
      // UUID 형식: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx (36자, 대시 4개)
      // 시간 형식: HH:MM
      // 따라서 마지막 대시 다음이 시간인지 확인
      // 방법: 마지막 대시 이후가 시간 형식 (HH:MM)인지 확인
      const timePattern = /^\d{2}:\d{2}$/
      const parts = afterPrefix.split('-')
      
      // 시간 부분은 마지막 부분이어야 함
      const lastPart = parts[parts.length - 1]
      if (!timePattern.test(lastPart)) {
        console.error('[booking-request] 반복 스케줄 ID 파싱 실패:', schedule_id, '마지막 부분:', lastPart)
        return NextResponse.json(
          { error: getErrorMessage('invalid_recurring_format') },
          { status: 400 }
        )
      }
      
      // recurring_id는 마지막 부분(시간)을 제외한 모든 부분
      const recurringId = parts.slice(0, -1).join('-')
      const timeStr = lastPart
      
      console.log('[booking-request] 반복 스케줄 파싱:', { schedule_id, recurringId, timeStr, original_partner_id: partner_id, actual_partner_id: actualPartnerId })
      
      // actualPartnerId 사용 (conversation_partners.id → user_id 변환된 값)
      const { data: recurringSchedule, error: recurringError } = await supabase
        .from('partner_recurring_schedules')
        .select('*')
        .eq('id', recurringId)
        .eq('partner_id', actualPartnerId)
        .eq('is_active', true)
        .single()
      
      if (recurringError || !recurringSchedule) {
        console.error('[booking-request] 반복 스케줄 조회 실패:', {
          error: recurringError,
          recurringId,
          actualPartnerId,
          queryConditions: { id: recurringId, partner_id: actualPartnerId, is_active: true }
        })
        
        // 디버깅: 해당 partner_id의 모든 반복 스케줄 조회
        const { data: allRecurring } = await supabase
          .from('partner_recurring_schedules')
          .select('id, partner_id, is_active')
          .eq('partner_id', actualPartnerId)
        console.log('[booking-request] 해당 partner_id의 모든 반복 스케줄:', allRecurring)
        
        return NextResponse.json(
          { error: getErrorMessage('schedule_not_found') },
          { status: 400 }
        )
      }
      
      console.log('[booking-request] 반복 스케줄 찾음:', recurringSchedule)
      
      // 사용자가 선택한 날짜와 시간으로 가상 스케줄 생성
      // KST로 변환된 날짜와 시간 사용
      console.log('[booking-request] 변환 전 (사용자 timezone):', { date, start_time, userTimezone })
      const kstDateAndTime = convertUserTimezoneToKST(date, start_time, userTimezone)
      const kstEndTime = convertUserTimezoneToKST(date, end_time, userTimezone)
      console.log('[booking-request] 변환 후 (KST):', { 
        date: kstDateAndTime.date, 
        start_time: kstDateAndTime.time,
        end_time: kstEndTime.time
      })
      
      availableSlot = {
        id: schedule_id, // 가상 ID 사용
        partner_id: actualPartnerId,
        date: kstDateAndTime.date,
        start_time: kstDateAndTime.time,
        end_time: kstEndTime.time,
        status: 'available'
      }
      
      console.log('[booking-request] availableSlot 생성:', availableSlot)
    } else {
      // 해당 시간이 available_schedules에 존재하는지 확인 (KST 기준)
      const { data: slot } = await supabase
        .from('available_schedules')
        .select('*')
        .eq('partner_id', actualPartnerId)
        .eq('date', kstDate!)
        .eq('start_time', kstStartTime!)
      .eq('status', 'available')
      .single()

      if (!slot) {
        return NextResponse.json(
          { error: getErrorMessage('slot_unavailable') },
          { status: 400 }
        )
      }
      availableSlot = slot
    }

    // KST 기준 날짜와 시간으로 저장
    const bookingDate = availableSlot.date // KST 기준
    const bookingStartTime = availableSlot.start_time // KST 기준
    const bookingEndTime = availableSlot.end_time // KST 기준

    console.log('[booking-request] DB에 저장할 값:', {
      bookingDate,
      bookingStartTime,
      bookingEndTime,
      originalUserInput: { date, start_time, userTimezone }
    })

    // 예약 요청 생성 (KST 기준으로 저장)
    // 주의: partner_id는 users.id (actualPartnerId)를 사용해야 함
    const { data: bookingRequest, error } = await supabase
      .from('booking_requests')
      .insert({
        partner_id: actualPartnerId,
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
        { error: getErrorMessage('request_failed') },
        { status: 500 }
      )
    }

    // available_schedules의 status를 pending으로 변경 (반복 스케줄이 아닌 경우만)
    if (!availableSlot.id.startsWith('recurring-')) {
      await supabase
        .from('available_schedules')
        .update({ 
          status: 'pending',
          booking_request_id: bookingRequest.id 
        })
        .eq('id', availableSlot.id)
    }

    // 사용자 이름 가져오기
    const { data: userData } = await supabase
      .from('users')
      .select('full_name, nickname')
      .eq('id', user.id)
      .single()

    const userName = userData?.full_name || userData?.nickname || '익명'

    // 한국인 파트너에게 알림 전송 (KST 기준 날짜/시간 표시)
    // 주의: user_id는 actualPartnerId (users.id)를 사용해야 함
    await supabase
      .from('notifications')
      .insert({
        user_id: actualPartnerId,
        type: 'booking_request',
        title: '새로운 예약 요청',
        message: `${userName}님이 ${bookingDate} ${bookingStartTime} (한국 시간) 예약을 요청했습니다.`,
        related_id: bookingRequest.id
      })

    return NextResponse.json({ bookingRequest })

  } catch (error) {
    console.error('예약 요청 생성 예외:', error)
    // catch 블록에서는 언어를 확인할 수 없을 수 있으므로 스페인어 기본값 사용
    return NextResponse.json(
      { error: 'Ocurrió un error al crear la solicitud de reserva.' },
      { status: 500 }
    )
  }
}
