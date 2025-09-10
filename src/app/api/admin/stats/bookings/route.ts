import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function GET() {
  try {
    const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)
    // 전체 예약 통계
    const { data: totalData, error: totalError } = await supabase
      .from('bookings')
      .select('id, status')

    if (totalError) {
      console.error('[ADMIN] 예약 통계 조회 실패:', totalError)
      return NextResponse.json(
        { success: false, message: '예약 통계 조회에 실패했습니다.' },
        { status: 500 }
      )
    }

    // 총 예약 건수
    const totalBookings = totalData.length

    // 최근 예약 내역 (최근 5건) - price_cents 대신 price 사용
    const { data: recentBookings, error: recentError } = await supabase
      .from('bookings')
      .select('id, topic, start_at, price, status, created_at')
      .order('created_at', { ascending: false })
      .limit(5)

    if (recentError) {
      console.error('[ADMIN] 최근 예약 조회 실패:', recentError)
    }

    return NextResponse.json({
      success: true,
      total: totalBookings,
      recent: recentBookings || []
    })

  } catch (error: unknown) {
    console.error('[ADMIN] 예약 통계 처리 실패:', error)
    return NextResponse.json(
      { success: false, message: '예약 통계 처리 중 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}
