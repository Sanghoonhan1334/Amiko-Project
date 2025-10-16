import { NextRequest, NextResponse } from 'next/server'
import { supabaseServer } from '@/lib/supabaseServer'

// K-매거진 뉴스 댓글 투표 처리
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string, commentId: string }> }
) {
  try {
    if (!supabaseServer) {
      return NextResponse.json(
        { error: '데이터베이스 연결이 설정되지 않았습니다.' },
        { status: 500 }
      )
    }

    const { id: newsId, commentId } = await params
    const { vote_type } = await request.json()

    console.log('[NEWS_COMMENT_VOTE] 뉴스 댓글 투표:', { newsId, commentId, vote_type })

    // Authorization 헤더에서 토큰 추출
    const authHeader = request.headers.get('Authorization')
    let authUser = null

    if (authHeader) {
      const token = authHeader.split(' ')[1]
      const { data: { user }, error: authError } = await supabaseServer.auth.getUser(token)

      if (authError || !user) {
        console.error('[NEWS_COMMENT_VOTE] 인증 실패:', authError?.message)
        return NextResponse.json({ error: '인증이 필요합니다.' }, { status: 401 })
      }
      authUser = user
    } else {
      // 개발 환경에서는 기본 사용자로 인증 우회
      console.log('[NEWS_COMMENT_VOTE] 토큰 없음 - 개발 환경 인증 우회')
      const defaultUserId = '5f83ab21-fd61-4666-94b5-087d73477476'
      const { data: defaultUser, error: defaultUserError } = await supabaseServer
        .from('users')
        .select('id, email, full_name')
        .eq('id', defaultUserId)
        .single()

      if (defaultUserError || !defaultUser) {
        console.error('[NEWS_COMMENT_VOTE] 기본 사용자 조회 실패:', defaultUserError)
        return NextResponse.json(
          { error: '기본 사용자 인증에 실패했습니다.' },
          { status: 401 }
        )
      }
      authUser = defaultUser
    }

    if (!authUser) {
      return NextResponse.json({ error: '인증된 사용자를 찾을 수 없습니다.' }, { status: 401 })
    }

    if (!vote_type || !['like', 'dislike'].includes(vote_type)) {
      return NextResponse.json({ error: '유효하지 않은 투표 타입입니다.' }, { status: 400 })
    }

    // 기존 투표 확인
    const { data: existingVote, error: existingVoteError } = await supabaseServer
      .from('comment_reactions')
      .select('reaction_type')
      .eq('comment_id', commentId)
      .eq('user_id', authUser.id)
      .single()

    let newVoteType = vote_type
    let likeCountChange = 0
    let dislikeCountChange = 0

    if (existingVoteError && existingVoteError.code !== 'PGRST116') {
      console.error('[NEWS_COMMENT_VOTE] 기존 투표 조회 오류:', existingVoteError)
      return NextResponse.json({
        success: false,
        error: '투표 정보를 조회할 수 없습니다.'
      }, { status: 500 })
    }

    if (existingVote) {
      // 기존 투표가 있는 경우
      if (existingVote.reaction_type === vote_type) {
        // 같은 투표를 다시 누르면 취소
        newVoteType = null
        if (vote_type === 'like') {
          likeCountChange = -1
        } else {
          dislikeCountChange = -1
        }
        
        // 기존 투표 삭제
        await supabaseServer
          .from('comment_reactions')
          .delete()
          .eq('comment_id', commentId)
          .eq('user_id', authUser.id)
      } else {
        // 다른 투표로 변경
        if (vote_type === 'like') {
          likeCountChange = 1
          dislikeCountChange = -1
        } else {
          likeCountChange = -1
          dislikeCountChange = 1
        }
        
        // 기존 투표 업데이트
        await supabaseServer
          .from('comment_reactions')
          .update({ reaction_type: vote_type })
          .eq('comment_id', commentId)
          .eq('user_id', authUser.id)
      }
    } else {
      // 새로운 투표
      if (vote_type === 'like') {
        likeCountChange = 1
      } else {
        dislikeCountChange = 1
      }
      
      // 새 투표 생성
      await supabaseServer
        .from('comment_reactions')
        .insert({
          comment_id: commentId,
          user_id: authUser.id,
          reaction_type: vote_type
        })
    }

    // 댓글의 좋아요/싫어요 수 업데이트
    if (likeCountChange !== 0 || dislikeCountChange !== 0) {
      // 현재 카운트 조회
      const { data: currentComment, error: fetchError } = await supabaseServer
        .from('comments')
        .select('like_count, dislike_count')
        .eq('id', commentId)
        .single()

      if (fetchError) {
        console.error('[NEWS_COMMENT_VOTE] 댓글 조회 오류:', fetchError)
        return NextResponse.json({
          success: false,
          error: '댓글 정보를 조회할 수 없습니다.'
        }, { status: 500 })
      }

      // 새로운 카운트 계산
      const newLikeCount = Math.max(0, (currentComment.like_count || 0) + likeCountChange)
      const newDislikeCount = Math.max(0, (currentComment.dislike_count || 0) + dislikeCountChange)

      // 카운트 업데이트
      const { error: updateError } = await supabaseServer
        .from('comments')
        .update({
          like_count: newLikeCount,
          dislike_count: newDislikeCount
        })
        .eq('id', commentId)

      if (updateError) {
        console.error('[NEWS_COMMENT_VOTE] 댓글 카운트 업데이트 오류:', updateError)
        return NextResponse.json({
          success: false,
          error: '댓글 카운트 업데이트에 실패했습니다.'
        }, { status: 500 })
      }
    }

    // 업데이트된 카운트 조회
    const { data: updatedComment, error: commentError } = await supabaseServer
      .from('comments')
      .select('like_count, dislike_count')
      .eq('id', commentId)
      .single()

    if (commentError) {
      console.error('[NEWS_COMMENT_VOTE] 댓글 카운트 조회 오류:', commentError)
      return NextResponse.json({
        success: false,
        error: '댓글 정보를 조회할 수 없습니다.'
      }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      vote_type: newVoteType,
      like_count: updatedComment.like_count,
      dislike_count: updatedComment.dislike_count
    })

  } catch (error) {
    console.error('[NEWS_COMMENT_VOTE] 투표 처리 오류:', error)
    return NextResponse.json({
      success: false,
      error: '서버 오류가 발생했습니다.'
    }, { status: 500 })
  }
}
