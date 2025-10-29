import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseClient } from '@/lib/supabase'
import { convertKSTToUserTimezone } from '@/lib/timezone-converter'
import { supabaseServer } from '@/lib/supabaseServer'

// 현지인이 신청한 예약 목록 조회
export async function GET(request: NextRequest) {
  try {
    const supabase = await createSupabaseClient()
    
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json(
        { error: '인증이 필요합니다.' },
        { status: 401 }
      )
    }

    // 사용자의 signup country를 기반으로 timezone 결정 (회원가입 시 저장된 정보 사용)
    let userTimezone = 'America/Lima' // 기본값
    try {
      const { data: userMetadata, error: metadataError } = await supabaseServer.auth.admin.getUserById(user.id)
      if (metadataError) {
        console.error('[my-requests] 사용자 메타데이터 조회 실패:', metadataError)
      }
      
      const signupCountry = userMetadata?.user?.user_metadata?.country
      console.log('[my-requests] 사용자 회원가입 국적:', signupCountry, 'user_id:', user.id)
      
      if (signupCountry) {
        // 국적에 따른 timezone 매핑 (회원가입 시 선택한 country 코드 기준)
        const countryCode = signupCountry.toUpperCase()
        if (countryCode === 'KR' || countryCode === 'KOREA' || countryCode === 'KO') {
          userTimezone = 'Asia/Seoul'
        } else if (countryCode === 'PE' || countryCode === 'PERU') {
          userTimezone = 'America/Lima'
        } else if (countryCode === 'CO' || countryCode === 'COLOMBIA') {
          userTimezone = 'America/Bogota'
        } else if (countryCode === 'MX' || countryCode === 'MEXICO') {
          userTimezone = 'America/Mexico_City'
        } else if (countryCode === 'CL' || countryCode === 'CHILE') {
          userTimezone = 'America/Santiago'
        } else if (countryCode === 'AR' || countryCode === 'ARGENTINA') {
          userTimezone = 'America/Buenos_Aires'
        } else if (countryCode === 'BR' || countryCode === 'BRAZIL') {
          userTimezone = 'America/Sao_Paulo'
        } else {
          // 기본값은 페루 시간 (대부분의 라틴 아메리카 국가)
          userTimezone = 'America/Lima'
        }
      } else {
        console.warn('[my-requests] 회원가입 국적 정보가 없습니다. 기본값(PET) 사용')
      }
      
      console.log('[my-requests] 결정된 사용자 timezone:', userTimezone)
    } catch (error) {
      console.error('[my-requests] 사용자 timezone 조회 예외:', error)
      // 기본값 사용
    }

    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status') // pending, approved, rejected, all

    // booking_requests 조회 (partner_id는 conversation_partners.user_id를 참조)
    let query = supabase
      .from('booking_requests')
      .select('*')
      .eq('user_id', user.id)

    // 상태별 필터링
    if (status && status !== 'all') {
      query = query.eq('status', status)
    }

    const { data: bookings, error } = await query
      .order('created_at', { ascending: false })

    if (error) {
      console.error('예약 목록 조회 오류:', error)
      return NextResponse.json(
        { error: '예약 목록 조회 실패' },
        { status: 500 }
      )
    }

    // 각 예약에 대해 파트너 정보 조회
    // partner_id는 conversation_partners.user_id를 참조하므로, users 테이블에서 직접 조회
    const bookingsWithPartners = await Promise.all(
      (bookings || []).map(async (booking: any) => {
        try {
          // users 테이블에서 파트너 정보 조회
          const { data: partnerUser, error: userError } = await supabase
            .from('users')
            .select('full_name, nickname, avatar_url, spanish_name, korean_name')
            .eq('id', booking.partner_id)
            .single()

          if (userError) {
            console.error(`파트너 사용자 정보 조회 실패 (partner_id: ${booking.partner_id}):`, userError)
          }

          // conversation_partners에서 specialty 정보 조회
          const { data: partner } = await supabase
            .from('conversation_partners')
            .select('specialty, name')
            .eq('user_id', booking.partner_id)
            .single()

          // 사용자 이름 결정 (우선순위: full_name > spanish_name > korean_name > nickname)
          const displayName = partnerUser?.full_name || 
                             partnerUser?.spanish_name || 
                             partnerUser?.korean_name || 
                             partnerUser?.nickname || 
                             partner?.name || 
                             null

          // 프로필 사진 URL (avatar_url이 있으면 사용)
          const avatarUrl = partnerUser?.avatar_url || null

          // KST로 저장된 날짜/시간을 사용자 timezone으로 변환
          const userDateAndTime = convertKSTToUserTimezone(
            booking.date,
            booking.start_time,
            userTimezone
          )
          const userEndTime = convertKSTToUserTimezone(
            booking.date,
            booking.end_time,
            userTimezone
          )

          return {
            ...booking,
            // 사용자 timezone으로 변환된 날짜/시간 추가
            date: userDateAndTime.date,
            start_time: userDateAndTime.time,
            end_time: userEndTime.time,
            // 원본 KST 시간도 보존 (필요시 사용)
            original_date: booking.date,
            original_start_time: booking.start_time,
            original_end_time: booking.end_time,
            conversation_partners: {
              name: displayName,
              avatar_url: avatarUrl,
              specialty: partner?.specialty || null
            }
          }
        } catch (err) {
          console.error(`파트너 정보 조회 예외 (partner_id: ${booking.partner_id}):`, err)
          // 기본값 대신 null 반환
          return {
            ...booking,
            conversation_partners: {
              name: null,
              avatar_url: null,
              specialty: null
            }
          }
        }
      })
    )

    return NextResponse.json({ bookings: bookingsWithPartners })

  } catch (error) {
    console.error('예약 목록 조회 예외:', error)
    return NextResponse.json(
      { error: '예약 목록 조회 중 오류 발생' },
      { status: 500 }
    )
  }
}

