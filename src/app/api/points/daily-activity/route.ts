import { NextRequest, NextResponse } from 'next/server'
import { supabaseServer } from '@/lib/supabaseServer'

export async function GET(request: NextRequest) {
  try {
    if (!supabaseServer) {
      return NextResponse.json(
        { error: '데이터베이스 연결이 설정되지 않았습니다.' },
        { status: 500 }
      )
    }

    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    const date = searchParams.get('date') || new Date().toISOString().split('T')[0]

    if (!userId) {
      return NextResponse.json(
        { error: '사용자 ID가 필요합니다.' },
        { status: 400 }
      )
    }

    // 오늘의 활동 데이터 가져오기
    const { data: activity, error } = await supabaseServer
      .from('daily_activity')
      .select('*')
      .eq('user_id', userId)
      .eq('date', date)
      .single()

    if (error && error.code !== 'PGRST116') {
      console.error('[DAILY ACTIVITY] 조회 실패:', error)
      return NextResponse.json(
        { error: '활동 데이터 조회에 실패했습니다.' },
        { status: 500 }
      )
    }

    // 데이터가 없으면 기본값으로 초기화
    const activityData = activity || {
      attendance_count: 0,
      comment_count: 0,
      likes_count: 0,
      freeboard_post_count: 0,
      story_post_count: 0,
      fanart_upload_count: 0,
      idol_photo_upload_count: 0,
      fanart_likes_count: 0,
      idol_photo_likes_count: 0,
      poll_vote_count: 0,
      news_comment_count: 0,
      share_count: 0,
      total_points: 0
    }

    // 미션 완료 상태 계산
    const missions = {
      attendance: {
        count: activityData.attendance_count,
        max: 1,
        points: 10,
        completed: activityData.attendance_count >= 1
      },
      comments: {
        count: activityData.comment_count,
        max: 5,
        points: 5,
        completed: activityData.comment_count >= 5
      },
      likes: {
        count: activityData.likes_count,
        max: 10,
        points: 10,
        completed: activityData.likes_count >= 10
      },
      freeboardPost: {
        count: activityData.freeboard_post_count,
        max: 1,
        points: 2,
        completed: activityData.freeboard_post_count >= 1
      },
      storyPost: {
        count: activityData.story_post_count,
        max: 1,
        points: 3,
        completed: activityData.story_post_count >= 1
      },
      fanartUpload: {
        count: activityData.fanart_upload_count,
        max: 1,
        points: 5,
        completed: activityData.fanart_upload_count >= 1
      },
      idolPhotoUpload: {
        count: activityData.idol_photo_upload_count,
        max: 1,
        points: 5,
        completed: activityData.idol_photo_upload_count >= 1
      },
      fanartLikes: {
        count: activityData.fanart_likes_count,
        max: 10,
        points: 10,
        completed: activityData.fanart_likes_count >= 10
      },
      idolPhotoLikes: {
        count: activityData.idol_photo_likes_count,
        max: 10,
        points: 10,
        completed: activityData.idol_photo_likes_count >= 10
      },
      pollVote: {
        count: activityData.poll_vote_count,
        max: 3,
        points: 9,
        completed: activityData.poll_vote_count >= 3
      },
      newsComment: {
        count: activityData.news_comment_count,
        max: 5,
        points: 10,
        completed: activityData.news_comment_count >= 5
      },
      share: {
        count: activityData.share_count,
        max: 5,
        points: 15,
        completed: activityData.share_count >= 5
      }
    }

    // 총 포인트 계산
    const totalPoints = Object.values(missions).reduce((sum, mission) => {
      return sum + (mission.completed ? mission.points : 0)
    }, 0)

    return NextResponse.json({
      missions,
      totalPoints,
      earnedPoints: activityData.total_points,
      date
    })

  } catch (error) {
    console.error('[DAILY ACTIVITY] 오류:', error)
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}

