import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('Supabase 환경 변수가 설정되지 않았습니다:', {
    url: !!supabaseUrl,
    key: !!supabaseKey
  })
}

const supabase = createClient(supabaseUrl!, supabaseKey!)

// 커뮤니티 활동 포인트 지급
export async function POST(request: NextRequest) {
  try {
    console.log('포인트 지급 API 호출 시작')
    const { userId, activityType, postId, title } = await request.json()
    console.log('요청 데이터:', { userId, activityType, postId, title })
    
    if (!userId || !activityType) {
      return NextResponse.json(
        { error: 'userId and activityType are required' },
        { status: 400 }
      )
    }

    // 포인트 지급 규칙
    const pointRules: { [key: string]: number } = {
      'question_post': 5,      // 질문 작성
      'question_answer': 10,   // 답변 작성
      'story_post': 3,         // 스토리 작성
      'freeboard_post': 2      // 자유게시판 작성
    }

    const points = pointRules[activityType]
    if (!points) {
      return NextResponse.json(
        { error: 'Invalid activity type' },
        { status: 400 }
      )
    }

    // 일일 한도 확인
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
        { 
          error: '일일 커뮤니티 포인트 한도(20점)를 초과했습니다.',
          currentPoints: currentCommunityPoints,
          maxPoints: maxDailyCommunityPoints
        },
        { status: 400 }
      )
    }

    // 포인트 히스토리 추가
    const { data: historyData, error: historyError } = await supabase
      .from('points_history')
      .insert({
        user_id: userId,
        points: points,
        type: activityType,
        description: `${title || activityType} 작성으로 ${points}포인트 획득`,
        related_id: postId
      })
      .select()
      .single()

    if (historyError) {
      console.error('포인트 히스토리 삽입 실패:', historyError)
      throw historyError
    }

    // 일일 한도 업데이트
    await supabase
      .from('daily_points_limit')
      .upsert({
        user_id: userId,
        date: today,
        community_points: currentCommunityPoints + points
      })

    // 알림 생성
    await supabase
      .from('notifications')
      .insert({
        user_id: userId,
        type: 'point_earned',
        title: '포인트 획득! 🎉',
        message: `${points}포인트를 획득했습니다! (${title || activityType})`,
        data: { points, type: activityType, postId }
      })

    return NextResponse.json({
      success: true,
      points: points,
      totalCommunityPoints: currentCommunityPoints + points,
      pointsHistory: historyData
    })

  } catch (error) {
    console.error('Community points error:', error)
    return NextResponse.json(
      { 
        error: 'Failed to award points',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
