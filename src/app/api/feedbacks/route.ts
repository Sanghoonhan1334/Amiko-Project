import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )
    
    const body = await request.json()
    const { booking_id, rating, feedback } = body
    
    // 유효성 검사
    if (!booking_id || !rating) {
      return NextResponse.json(
        { error: '필수 필드가 누락되었습니다.' },
        { status: 400 }
      )
    }
    
    if (rating < 1 || rating > 5) {
      return NextResponse.json(
        { error: '평점은 1~5 사이여야 합니다.' },
        { status: 400 }
      )
    }
    
    // 토큰에서 사용자 정보 추출
    const authHeader = request.headers.get('Authorization')
    if (!authHeader) {
      return NextResponse.json(
        { error: '인증이 필요합니다.' },
        { status: 401 }
      )
    }
    
    const token = authHeader.replace('Bearer ', '')
    const decodedToken = decodeURIComponent(token)
    
    const { data: { user }, error: authError } = await supabase.auth.getUser(decodedToken)
    if (authError || !user) {
      return NextResponse.json(
        { error: '인증이 필요합니다.' },
        { status: 401 }
      )
    }
    
    // 예약 존재 여부 확인
    const { data: booking, error: bookingError } = await supabase
      .from('bookings')
      .select('user_id')
      .eq('id', booking_id)
      .single()
    
    if (bookingError || !booking) {
      return NextResponse.json(
        { error: '예약 정보를 찾을 수 없습니다.' },
        { status: 404 }
      )
    }
    
    // 피드백 저장 (feedbacks 테이블이 있다면, 없으면 bookings 테이블의 notes 사용)
    const { error: insertError } = await supabase
      .from('bookings')
      .update({
        notes: JSON.stringify({
          feedback: feedback || '',
          rating: rating,
          submitted_at: new Date().toISOString()
        }),
        status: 'completed',
        updated_at: new Date().toISOString()
      })
      .eq('id', booking_id)
    
    if (insertError) {
      console.error('[FEEDBACK] 저장 실패:', insertError)
      return NextResponse.json(
        { error: '피드백 저장에 실패했습니다.' },
        { status: 500 }
      )
    }
    
    return NextResponse.json({ 
      success: true,
      message: '피드백이 제출되었습니다.'
    })
    
  } catch (error) {
    console.error('[FEEDBACK] 오류:', error)
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}

