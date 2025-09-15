import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// 포인트 조회
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    
    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 })
    }

    // 사용자 포인트 조회
    const { data: userPoints, error: pointsError } = await supabase
      .from('user_points')
      .select('*')
      .eq('user_id', userId)
      .single()

    if (pointsError && pointsError.code !== 'PGRST116') {
      throw pointsError
    }

    // 포인트 히스토리 조회 (최근 10개)
    const { data: pointsHistory, error: historyError } = await supabase
      .from('points_history')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(10)

    if (historyError) {
      throw historyError
    }

    // 랭킹 조회 (총 포인트 기준)
    const { data: ranking, error: rankingError } = await supabase
      .from('user_points')
      .select('user_id, total_points')
      .order('total_points', { ascending: false })
      .limit(100)

    if (rankingError) {
      throw rankingError
    }

    // 현재 사용자의 랭킹 찾기
    const userRank = ranking.findIndex((user: any) => user.user_id === userId) + 1

    return NextResponse.json({
      userPoints: userPoints || { available_points: 0, total_points: 0 },
      pointsHistory: pointsHistory || [],
      ranking: {
        position: userRank || 0,
        totalUsers: ranking.length
      }
    })

  } catch (error) {
    console.error('Points fetch error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch points' },
      { status: 500 }
    )
  }
}

// 포인트 추가/차감
export async function POST(request: NextRequest) {
  try {
    const { userId, points, type, description, relatedId } = await request.json()
    
    if (!userId || !points || !type) {
      return NextResponse.json(
        { error: 'userId, points, and type are required' },
        { status: 400 }
      )
    }

    // 일일 한도 확인 (커뮤니티 활동의 경우)
    if (['question_post', 'question_answer', 'story_post', 'freeboard_post'].includes(type)) {
      const today = new Date().toISOString().split('T')[0]
      
      const { data: dailyLimit, error: limitError } = await supabase
        .from('daily_points_limit')
        .select('community_points')
        .eq('user_id', userId)
        .eq('date', today)
        .single()

      if (limitError && limitError.code !== 'PGRST116') {
        throw limitError
      }

      const currentCommunityPoints = dailyLimit?.community_points || 0
      const maxDailyCommunityPoints = 20

      if (currentCommunityPoints + points > maxDailyCommunityPoints) {
        return NextResponse.json(
          { error: '일일 커뮤니티 포인트 한도(20점)를 초과했습니다.' },
          { status: 400 }
        )
      }

      // 일일 한도 업데이트
      await supabase
        .from('daily_points_limit')
        .upsert({
          user_id: userId,
          date: today,
          community_points: currentCommunityPoints + points
        })
    }

    // 포인트 히스토리 추가
    const { data: historyData, error: historyError } = await supabase
      .from('points_history')
      .insert({
        user_id: userId,
        points: points,
        type: type,
        description: description,
        related_id: relatedId
      })
      .select()
      .single()

    if (historyError) {
      throw historyError
    }

    // 알림 생성
    if (points > 0) {
      await supabase
        .from('notifications')
        .insert({
          user_id: userId,
          type: 'point_earned',
          title: '포인트 획득!',
          message: `${points}포인트를 획득했습니다! (${description || type})`,
          data: { points, type }
        })
    }

    return NextResponse.json({
      success: true,
      pointsHistory: historyData
    })

  } catch (error) {
    console.error('Points update error:', error)
    return NextResponse.json(
      { error: 'Failed to update points' },
      { status: 500 }
    )
  }
}