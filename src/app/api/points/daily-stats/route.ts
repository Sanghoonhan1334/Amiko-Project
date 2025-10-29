import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// 일일 활동 통계 조회
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    const date = searchParams.get('date') || new Date().toISOString().split('T')[0]

    if (!userId) {
      return NextResponse.json(
        { error: 'userId가 필요합니다.' },
        { status: 400 }
      )
    }

    // Supabase 클라이언트 생성
    const supabase = createClient()

    // 일일 활동 조회
    const { data: dailyActivity, error: activityError } = await supabase
      .rpc('get_daily_activity', { p_user_id: userId, p_date: date })

    if (activityError) {
      console.error('일일 활동 조회 실패:', activityError)
      return NextResponse.json(
        { error: '일일 활동 조회 실패' },
        { status: 500 }
      )
    }

    // 사용자 포인트 조회
    const { data: userPoints, error: pointsError } = await supabase
      .from('user_points')
      .select('total_points, monthly_points, available_points')
      .eq('user_id', userId)
      .single()

    if (pointsError && pointsError.code !== 'PGRST116') {
      console.error('포인트 조회 실패:', pointsError)
    }

    // 활동별 포인트 계산
    const activityPoints = {
      attendance: (dailyActivity[0]?.attendance_count || 0) * 10,
      comments: (dailyActivity[0]?.comment_count || 0) * 1,
      likes: (dailyActivity[0]?.likes_count || 0) * 1,
      freeboard: (dailyActivity[0]?.freeboard_post_count || 0) * 2,
      stories: (dailyActivity[0]?.story_post_count || 0) * 3,
      fanartUpload: (dailyActivity[0]?.fanart_upload_count || 0) * 5,
      idolPhotoUpload: (dailyActivity[0]?.idol_photo_upload_count || 0) * 5,
      fanartLikes: (dailyActivity[0]?.fanart_likes_count || 0) * 1,
      idolPhotoLikes: (dailyActivity[0]?.idol_photo_likes_count || 0) * 1,
      pollVotes: (dailyActivity[0]?.poll_vote_count || 0) * 3,
      newsComments: (dailyActivity[0]?.news_comment_count || 0) * 2,
      share: (dailyActivity[0]?.share_count || 0) * 3
    }

    // 오늘 획득한 총 포인트
    const todayTotalPoints = Object.values(activityPoints).reduce((sum, points) => sum + points, 0)

    return NextResponse.json({
      success: true,
      userId,
      date,
      stats: {
        activities: {
          attendance: { count: dailyActivity[0]?.attendance_count || 0, points: activityPoints.attendance },
          comments: { count: dailyActivity[0]?.comment_count || 0, max: 5, points: activityPoints.comments },
          likes: { count: dailyActivity[0]?.likes_count || 0, max: 10, points: activityPoints.likes },
          freeboard: { count: dailyActivity[0]?.freeboard_post_count || 0, points: activityPoints.freeboard },
          stories: { count: dailyActivity[0]?.story_post_count || 0, max: 2, points: activityPoints.stories },
          fanartUpload: { count: dailyActivity[0]?.fanart_upload_count || 0, max: 1, points: activityPoints.fanartUpload },
          idolPhotoUpload: { count: dailyActivity[0]?.idol_photo_upload_count || 0, max: 1, points: activityPoints.idolPhotoUpload },
          fanartLikes: { count: dailyActivity[0]?.fanart_likes_count || 0, max: 10, points: activityPoints.fanartLikes },
          idolPhotoLikes: { count: dailyActivity[0]?.idol_photo_likes_count || 0, max: 10, points: activityPoints.idolPhotoLikes },
          pollVotes: { count: dailyActivity[0]?.poll_vote_count || 0, max: 3, points: activityPoints.pollVotes },
          newsComments: { count: dailyActivity[0]?.news_comment_count || 0, max: 5, points: activityPoints.newsComments },
          share: { count: dailyActivity[0]?.share_count || 0, max: 5, points: activityPoints.share }
        },
        todayTotalPoints,
        maxDailyPoints: 75,
        progress: (todayTotalPoints / 75 * 100).toFixed(1),
        userPoints: {
          totalPoints: userPoints?.total_points || 0,
          monthlyPoints: userPoints?.monthly_points || 0,
          availablePoints: userPoints?.available_points || 0
        }
      }
    })

  } catch (error) {
    console.error('일일 통계 조회 오류:', error)
    return NextResponse.json(
      { error: '일일 통계 조회 중 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}

