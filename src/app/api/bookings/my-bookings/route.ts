import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseClient } from '@/lib/supabase'

// 한국인이 받은 예약 요청 목록 조회
export async function GET(request: NextRequest) {
  try {
    console.log('[my-bookings] 요청 시작')
    
    const supabase = await createSupabaseClient()
    
    // 쿠키 확인
    const cookieStore = await import('next/headers').then(m => m.cookies())
    const allCookies = cookieStore.getAll()
    console.log('[my-bookings] 쿠키 개수:', allCookies.length)
    const supabaseCookies = allCookies.filter(c => c.name.includes('supabase') || c.name.includes('sb-'))
    console.log('[my-bookings] Supabase 관련 쿠키:', supabaseCookies.map(c => c.name))
    
    // 세션 확인
    const { data: { session: initialSession } } = await supabase.auth.getSession()
    console.log('[my-bookings] 초기 세션:', initialSession ? '있음' : '없음')
    
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError) {
      console.error('[my-bookings] 인증 오류:', {
        message: authError.message,
        name: authError.name,
        status: authError.status
      })
    }
    
    if (!user) {
      console.error('[my-bookings] 사용자 없음, 401 반환', {
        hasSession: !!initialSession,
        authError: authError?.message
      })
      return NextResponse.json(
        { error: '인증이 필요합니다.' },
        { status: 401 }
      )
    }
    
    console.log('[my-bookings] 사용자 확인:', user.id)

    // 파트너인지 확인
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

    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status') // pending, approved, rejected, all

    let query = supabase
      .from('booking_requests')
      .select('*')
      .eq('partner_id', user.id)

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

    // 각 예약에 대해 사용자 정보 조회
    const bookingsWithUsers = await Promise.all(
      (bookings || []).map(async (booking: any) => {
        try {
          const { data: userData, error: userError } = await supabase
            .from('users')
            .select('full_name, nickname, avatar_url, spanish_name, korean_name')
            .eq('id', booking.user_id)
            .single()

          if (userError) {
            console.error(`사용자 정보 조회 실패 (user_id: ${booking.user_id}):`, userError)
          }

          // 사용자 이름 결정 (우선순위: full_name > spanish_name > korean_name > nickname)
          const displayName = userData?.full_name || 
                             userData?.spanish_name || 
                             userData?.korean_name || 
                             userData?.nickname || 
                             null

          // 프로필 사진 URL (avatar_url이 있으면 사용)
          const avatarUrl = userData?.avatar_url || null

          console.log(`[my-bookings] 사용자 정보:`, {
            user_id: booking.user_id,
            displayName,
            avatarUrl,
            userData
          })

          // 누적 포인트 조회(레벨 계산용)
          let totalPoints: number | null = null
          try {
            const { data: pointsRow } = await supabase
              .from('user_points')
              .select('total_points')
              .eq('user_id', booking.user_id)
              .single()
            totalPoints = (pointsRow as any)?.total_points ?? null
          } catch {}

          // 한국 파트너용: DB에 저장된 KST 값 그대로 반환
          // date, start_time, end_time은 이미 KST로 저장되어 있음
          console.log(`[my-bookings] 예약 데이터 (KST):`, {
            booking_id: booking.id,
            date: booking.date,
            start_time: booking.start_time,
            end_time: booking.end_time,
            status: booking.status
          })

          return {
            ...booking,
            users: {
              full_name: displayName,
              nickname: userData?.nickname,
              avatar_url: avatarUrl,
              spanish_name: userData?.spanish_name,
              korean_name: userData?.korean_name,
              total_points: totalPoints
            }
          }
        } catch (err) {
          console.error(`사용자 정보 조회 예외 (user_id: ${booking.user_id}):`, err)
          return {
            ...booking,
            users: {
              full_name: null,
              nickname: null,
              avatar_url: null,
              spanish_name: null,
              korean_name: null
            }
          }
        }
      })
    )

    return NextResponse.json({ bookings: bookingsWithUsers })

  } catch (error) {
    console.error('예약 목록 조회 예외:', error)
    return NextResponse.json(
      { error: '예약 목록 조회 중 오류 발생' },
      { status: 500 }
    )
  }
}

