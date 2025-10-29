import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// 추천인 이벤트 참가자 조회
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const period = searchParams.get('period') || 'january-2026'

    const supabase = createClient()

    // 참가자 조회
    const { data, error } = await supabase
      .from('referral_event_participants')
      .select(`
        id,
        user_id,
        is_winner,
        prize_rank,
        prize_type,
        referrals!inner (
          referral_code
        ),
        users!inner (
          id,
          full_name,
          email
        )
      `)
      .eq('event_period', period)
      .order('created_at', { ascending: false })

    if (error) {
      throw error
    }

    // 데이터 포맷팅
    const participants = data.map((item: any) => ({
      id: item.id,
      userId: item.user_id,
      userName: item.users?.full_name || '익명',
      userEmail: item.users?.email || '',
      isWinner: item.is_winner,
      prizeType: item.prize_type,
      prizeRank: item.prize_rank,
      referralCode: item.referrals?.referral_code || '',
      createdAt: item.created_at
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

