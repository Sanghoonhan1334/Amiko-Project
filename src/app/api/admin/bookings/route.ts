import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function GET() {
  try {
    const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)
    // 모든 예약 내역 조회
    const { data: bookings, error } = await supabase
      .from('bookings')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('[ADMIN BOOKINGS] 조회 실패:', error)
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
      { success: false, error: '예약 목록 조회에 실패했습니다.' },
      { status: 500 }
    )
  }
}
