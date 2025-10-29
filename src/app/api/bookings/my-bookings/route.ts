import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseClient } from '@/lib/supabase'

// 한국인이 받은 예약 요청 목록 조회
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

          return {
            ...booking,
            users: {
              full_name: displayName,
              nickname: userData?.nickname,
              avatar_url: avatarUrl,
              spanish_name: userData?.spanish_name,
              korean_name: userData?.korean_name
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

