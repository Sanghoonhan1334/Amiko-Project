import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// 포인트 랭킹 조회
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '10')
    const userId = searchParams.get('userId')

    // Supabase 클라이언트 생성
    const supabase = createClient()

    // 통합 랭킹 함수 사용
    const { data: ranking, error: rankingError } = await supabase
      .rpc('get_points_ranking', { p_limit: limit })

    if (rankingError) {
      throw rankingError
    }

      // 현재 사용자의 랭킹 찾기
      let userRank = null
      if (userId) {
        const { data: userRanking, error: userRankingError } = await supabase
          .from('user_points')
          .select(`
            user_id,
            total_points,
            monthly_points,
            available_points,
            users!inner(
              id,
              full_name,
              avatar_url
            )
          `)
          .eq('user_id', userId)
          .single()

        if (!userRankingError && userRanking) {
          // 전체 랭킹에서 사용자 위치 찾기
          const { data: allRanking, error: allRankingError } = await supabase
            .from('user_points')
            .select('user_id, total_points')
            .order('total_points', { ascending: false })

          if (!allRankingError) {
            const userPosition = allRanking.findIndex((user: any) => user.user_id === userId) + 1
            userRank = {
              ...userRanking,
              position: userPosition,
              totalUsers: allRanking.length
            }
          }
        }
      }

    // 랭킹 데이터 포맷팅
    const formattedRanking = ranking.map((item: any, index: number) => ({
      rank: index + 1,
      userId: item.user_id,
      totalPoints: item.total_points,
      availablePoints: item.available_points,
      userName: item.users?.full_name || '익명',
      avatarUrl: item.users?.avatar_url
    }))

    return NextResponse.json({
      ranking: formattedRanking,
      userRank: userRank,
      totalUsers: ranking.length
    })

  } catch (error) {
    console.error('Ranking fetch error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch ranking' },
      { status: 500 }
    )
  }
}
