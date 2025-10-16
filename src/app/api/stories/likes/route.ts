import { NextRequest, NextResponse } from 'next/server'
import { supabaseServer } from '@/lib/supabaseServer'

// 사용자의 스토리 좋아요 상태 조회
export async function GET(request: NextRequest) {
  try {
    if (!supabaseServer) {
      return NextResponse.json(
        { error: '데이터베이스 연결이 설정되지 않았습니다.' },
        { status: 500 }
      )
    }

    const { searchParams } = new URL(request.url)
    const storyIds = searchParams.get('storyIds')
    
    if (!storyIds) {
      return NextResponse.json({ likedStories: [] })
    }

    // 인증 토큰 확인
    const authHeader = request.headers.get('Authorization')
    if (!authHeader) {
      return NextResponse.json({ likedStories: [] })
    }

    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authError } = await supabaseServer.auth.getUser(token)

    if (authError || !user) {
      return NextResponse.json({ likedStories: [] })
    }

    const storyIdArray = storyIds.split(',').filter(Boolean)
    
    // 사용자가 좋아요한 스토리 ID 조회
    const { data: likes, error } = await supabaseServer
      .from('story_likes')
      .select('story_id')
      .eq('user_id', user.id)
      .in('story_id', storyIdArray)

    if (error) {
      console.error('[STORY_LIKES_GET] 좋아요 상태 조회 실패:', error)
      return NextResponse.json({ likedStories: [] })
    }

    const likedStoryIds = likes?.map(like => like.story_id) || []

    return NextResponse.json({
      success: true,
      likedStories: likedStoryIds
    })
  } catch (error: any) {
    console.error('[STORY_LIKES_GET] 서버 오류:', error)
    return NextResponse.json(
      { error: '좋아요 상태 조회에 실패했습니다.', details: error.message },
      { status: 500 }
    )
  }
}
