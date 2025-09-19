import { NextRequest, NextResponse } from 'next/server'
import { supabaseServer } from '@/lib/supabaseServer'

// 인기글/핫글 상태 업데이트 (크론잡용)
export async function POST(request: NextRequest) {
  try {
    if (!supabaseServer) {
      return NextResponse.json(
        { error: '데이터베이스 연결이 설정되지 않았습니다.' },
        { status: 500 }
      )
    }

    console.log('[POPULARITY_UPDATE] 인기글/핫글 업데이트 시작')

    // 최근 24시간 내 게시물들의 인기도 계산
    const { data: recentPosts, error: postsError } = await supabaseServer
      .from('gallery_posts')
      .select(`
        id,
        like_count,
        dislike_count,
        comment_count,
        view_count,
        created_at,
        is_pinned,
        is_hot
      `)
      .eq('is_deleted', false)
      .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())

    if (postsError) {
      console.error('[POPULARITY_UPDATE] 게시물 조회 오류:', postsError)
      return NextResponse.json(
        { error: '게시물 정보를 조회하는데 실패했습니다.' },
        { status: 500 }
      )
    }

    if (!recentPosts || recentPosts.length === 0) {
      return NextResponse.json({
        success: true,
        message: '업데이트할 게시물이 없습니다.',
        updated: 0
      })
    }

    // 인기도 점수 계산 함수
    const calculatePopularityScore = (post: any) => {
      const now = new Date()
      const createdAt = new Date(post.created_at)
      const hoursSinceCreated = (now.getTime() - createdAt.getTime()) / (1000 * 60 * 60)
      
      // 기본 점수 계산
      const likeScore = post.like_count * 2
      const commentScore = post.comment_count * 3
      const viewScore = post.view_count * 0.1
      const dislikePenalty = post.dislike_count * 0.5
      
      // 시간 가중치 (최근일수록 높은 점수)
      const timeWeight = Math.max(0.1, 1 - (hoursSinceCreated / 24))
      
      const totalScore = (likeScore + commentScore + viewScore - dislikePenalty) * timeWeight
      
      return {
        score: totalScore,
        hoursSinceCreated,
        isHot: totalScore >= 50 && hoursSinceCreated <= 6, // 6시간 내 50점 이상
        isPopular: totalScore >= 30 && hoursSinceCreated <= 24 // 24시간 내 30점 이상
      }
    }

    // 각 게시물의 인기도 계산 및 업데이트
    const updates = []
    let hotCount = 0
    let popularCount = 0

    for (const post of recentPosts) {
      const { score, isHot, isPopular } = calculatePopularityScore(post)
      
      // 현재 상태와 다를 때만 업데이트
      if (post.is_hot !== isHot || (isPopular && !post.is_pinned)) {
        updates.push({
          id: post.id,
          is_hot: isHot,
          is_popular: isPopular && !post.is_pinned // 고정글은 인기글에서 제외
        })
        
        if (isHot) hotCount++
        if (isPopular && !post.is_pinned) popularCount++
      }
    }

    // 배치 업데이트 실행
    if (updates.length > 0) {
      for (const update of updates) {
        const { error: updateError } = await supabaseServer
          .from('gallery_posts')
          .update({
            is_hot: update.is_hot,
            is_popular: update.is_popular,
            updated_at: new Date().toISOString()
          })
          .eq('id', update.id)

        if (updateError) {
          console.error(`[POPULARITY_UPDATE] 게시물 ${update.id} 업데이트 오류:`, updateError)
        }
      }
    }

    // 오래된 핫글 상태 해제 (24시간 이상 된 핫글)
    const { error: oldHotError } = await supabaseServer
      .from('gallery_posts')
      .update({ is_hot: false })
      .eq('is_hot', true)
      .lt('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())

    if (oldHotError) {
      console.error('[POPULARITY_UPDATE] 오래된 핫글 해제 오류:', oldHotError)
    }

    console.log(`[POPULARITY_UPDATE] 완료: 핫글 ${hotCount}개, 인기글 ${popularCount}개 업데이트`)

    return NextResponse.json({
      success: true,
      message: '인기글/핫글 상태가 업데이트되었습니다.',
      updated: updates.length,
      hotCount,
      popularCount
    })

  } catch (error) {
    console.error('[POPULARITY_UPDATE] 인기글/핫글 업데이트 오류:', error)
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}
