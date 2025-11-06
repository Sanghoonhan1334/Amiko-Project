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

    // 포인트 지급 규칙 (75점 체계)
    const pointRules: { [key: string]: number } = {
      'attendance_check': 10,      // 출석 체크
      'comment_post': 1,           // 댓글 작성 (max 5)
      'likes': 1,                  // 좋아요 (max 10)
      'freeboard_post': 2,         // 자유게시판 작성
      'story_post': 3,             // 스토리 작성
      'fanart_upload': 5,          // 팬아트 업로드
      'idol_photo_upload': 5,      // 아이돌 사진 업로드
      'fanart_likes': 1,           // 팬아트 좋아요 (max 10)
      'idol_photo_likes': 1,       // 아이돌 사진 좋아요 (max 10)
      'poll_vote': 3,              // 투표 참여 (max 3)
      'news_comment': 2,           // 뉴스 댓글 (max 5)
      'share': 3                   // 공유 (max 5)
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
          error: '일일 포인트 한도(75점) 또는 해당 활동의 일일 제한 횟수를 초과했습니다.',
          maxPoints: 75
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
