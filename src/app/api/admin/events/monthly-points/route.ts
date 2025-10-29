import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// 월별 포인트 이벤트 참가자 조회
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const period = searchParams.get('period') || 'january-2026'

    const supabase = createClient()

    // 참가자 조회
    const { data, error } = await supabase
      .from('monthly_points_event_participants')
      .select(`
        id,
        user_id,
        monthly_points,
        total_points_rank,
        is_raffle_winner,
        prize_type,
        users!inner (
          id,
          full_name,
          email
        )
      `)
      .eq('event_period', period)
      .order('monthly_points', { ascending: false })

    if (error) {
      throw error
    }

    // 데이터 포맷팅
    const participants = data.map((item: any, index: number) => ({
      id: item.id,
      userId: item.user_id,
      userName: item.users?.full_name || '익명',
      userEmail: item.users?.email || '',
      monthlyPoints: item.monthly_points || 0,
      totalPointsRank: item.total_points_rank,
      isWinner: item.is_raffle_winner,
      prizeType: item.prize_type,
      rank: index + 1
    }))

    return NextResponse.json({
      success: true,
      participants,
      period,
      totalCount: participants.length,
      winnerCount: participants.filter((p: any) => p.isWinner).length
    })

  } catch (error) {
    console.error('참가자 조회 오류:', error)
    return NextResponse.json(
      { error: '참가자 조회 중 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}

