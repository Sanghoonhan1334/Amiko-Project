import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// 월별 포인트 이벤트 추첨 실행
export async function POST(request: NextRequest) {
  try {
    const { period, pointThreshold = 0 } = await request.json()

    if (!period) {
      return NextResponse.json(
        { error: '이벤트 기간이 필요합니다.' },
        { status: 400 }
      )
    }

    const supabase = createClient()

    // 추첨 함수 실행
    const { error } = await supabase
      .rpc('draw_monthly_points_event_winner', { 
        p_period: period,
        p_point_threshold: pointThreshold
      })

    if (error) {
      console.error('추첨 실행 오류:', error)
      throw error
    }

    return NextResponse.json({
      success: true,
      message: '추첨이 완료되었습니다.'
    })

  } catch (error) {
    console.error('추첨 오류:', error)
    return NextResponse.json(
      { error: '추첨 중 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}

