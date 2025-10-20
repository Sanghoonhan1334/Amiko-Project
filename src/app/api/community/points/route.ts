import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

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

    // Supabase 클라이언트 생성
    const supabase = createClient()

    // 포인트 지급 규칙
    const pointRules: { [key: string]: number } = {
      'question_post': 5,      // 질문 작성
      'question_answer': 10,   // 답변 작성
      'story_post': 3,         // 스토리 작성
      'freeboard_post': 2,     // 자유게시판 작성
      'comment_post': 1        // 댓글 작성
    }

    const points = pointRules[activityType]
    if (!points) {
      return NextResponse.json(
        { error: 'Invalid activity type' },
        { status: 400 }
      )
    }

    // 통합 포인트 함수 사용
    const { data: result, error: pointError } = await supabase
      .rpc('add_points_with_limit', {
        p_user_id: userId,
        p_type: activityType,
        p_amount: points,
        p_description: `${title || activityType} 작성으로 ${points}포인트 획득`,
        p_related_id: postId,
        p_related_type: 'post'
      })

    if (pointError) {
      console.error('포인트 지급 실패:', pointError)
      return NextResponse.json(
        { error: '포인트 지급 중 오류가 발생했습니다.' },
        { status: 500 }
      )
    }

    if (!result) {
      return NextResponse.json(
        { 
          error: '일일 커뮤니티 포인트 한도(20점)를 초과했습니다.',
          maxPoints: 20
        },
        { status: 400 }
      )
    }

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
      message: '포인트가 성공적으로 지급되었습니다.'
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
