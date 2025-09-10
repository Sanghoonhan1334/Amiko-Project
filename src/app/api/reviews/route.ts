import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// 후기 작성
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { bookingId, userId, consultantId, rating, title, content, isAnonymous } = body

    // 유효성 검사
    if (!bookingId || !userId || !consultantId || !rating || !title || !content) {
      return NextResponse.json(
        { success: false, error: '필수 필드가 누락되었습니다.' },
        { status: 400 }
      )
    }

    const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)

    // 예약 정보 조회 및 상태 확인
    const { data: booking, error: bookingError } = await supabase
      .from('bookings')
      .select('*')
      .eq('id', bookingId)
      .eq('user_id', userId)
      .single()

    if (bookingError || !booking) {
      return NextResponse.json(
        { success: false, error: '예약 정보를 찾을 수 없습니다.' },
        { status: 404 }
      )
    }

    // 상담 완료 상태 확인
    if (booking.status !== 'completed') {
      return NextResponse.json(
        { success: false, error: '완료된 상담에만 후기를 작성할 수 있습니다.' },
        { status: 400 }
      )
    }

    // 이미 후기가 작성되었는지 확인
    const { data: existingReview, error: reviewCheckError } = await supabase
      .from('reviews')
      .select('id')
      .eq('booking_id', bookingId)
      .single()

    if (reviewCheckError && reviewCheckError.code !== 'PGRST116') {
      console.error('[REVIEW] 중복 체크 실패:', reviewCheckError)
    } else if (existingReview) {
      return NextResponse.json(
        { success: false, error: '이미 후기가 작성되었습니다.' },
        { status: 400 }
      )
    }

    // 후기 저장
    const { data: review, error } = await supabase
      .from('reviews')
      .insert({
        booking_id: bookingId,
        user_id: userId,
        consultant_id: consultantId,
        rating,
        title,
        content,
        is_anonymous: isAnonymous || false,
        created_at: new Date().toISOString()
      })
      .select()
      .single()

    if (error) {
      console.error('[REVIEW] 저장 실패:', error)
      return NextResponse.json(
        { success: false, error: '후기 저장에 실패했습니다.' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      review,
      message: '후기가 성공적으로 작성되었습니다.'
    })

  } catch (error) {
    console.error('후기 작성 실패:', error)
    return NextResponse.json(
      { success: false, error: '후기 작성에 실패했습니다.' },
      { status: 500 }
    )
  }
}

// 후기 목록 조회
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const consultantId = searchParams.get('consultantId')
    const userId = searchParams.get('userId')
    
    const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)
    
    let query = supabase
      .from('reviews')
      .select(`
        *,
        users (
          email
        ),
        consultants (
          name,
          specialty
        )
      `)
      .order('created_at', { ascending: false })

    // 상담사별 필터링
    if (consultantId) {
      query = query.eq('consultant_id', consultantId)
    }

    // 사용자별 필터링
    if (userId) {
      query = query.eq('user_id', userId)
    }

    const { data: reviews, error } = await query

    if (error) {
      console.error('[REVIEW] 조회 실패:', error)
      return NextResponse.json(
        { success: false, error: '후기 목록 조회에 실패했습니다.' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      reviews: reviews || [],
      message: '후기 목록 조회 성공'
    })

  } catch (error) {
    console.error('후기 목록 조회 실패:', error)
    return NextResponse.json(
      { success: false, error: '후기 목록 조회에 실패했습니다.' },
      { status: 500 }
    )
  }
}
