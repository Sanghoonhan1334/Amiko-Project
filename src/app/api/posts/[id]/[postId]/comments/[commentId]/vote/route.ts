import { NextRequest, NextResponse } from 'next/server'
import { supabaseServer } from '@/lib/supabaseServer'

// 댓글 투표 (좋아요/싫어요)
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string; commentId: string } }
) {
  try {
    if (!supabaseServer) {
      return NextResponse.json(
        { error: '데이터베이스 연결이 설정되지 않았습니다.' },
        { status: 500 }
      )
    }

    const { id: postId, commentId } = params
    const body = await request.json()
    const { vote_type } = body

    console.log('[COMMENT_VOTE] 댓글 투표:', { postId, commentId, vote_type })

    // Authorization 헤더에서 토큰 추출
    const authHeader = request.headers.get('Authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: '인증이 필요합니다.' },
        { status: 401 }
      )
    }

    const token = authHeader.substring(7)
    
    // 토큰으로 사용자 인증
    const { data: { user }, error: authError } = await supabaseServer.auth.getUser(token)
    
    if (authError || !user) {
      return NextResponse.json(
        { error: '유효하지 않은 토큰입니다.' },
        { status: 401 }
      )
    }

    // 댓글 존재 확인
    const { data: comment, error: commentError } = await supabaseServer
      .from('post_comments')
      .select('id, like_count, dislike_count')
      .eq('id', commentId)
      .eq('post_id', postId)
      .eq('is_deleted', false)
      .single()

    if (commentError || !comment) {
      return NextResponse.json(
        { error: '댓글을 찾을 수 없습니다.' },
        { status: 404 }
      )
    }

    // 기존 투표 확인
    const { data: existingVote, error: voteError } = await supabaseServer
      .from('comment_votes')
      .select('vote_type')
      .eq('comment_id', commentId)
      .eq('user_id', user.id)
      .single()

    let newVoteType: 'like' | 'dislike' | null = null
    let newLikeCount = comment.like_count || 0
    let newDislikeCount = comment.dislike_count || 0

    if (existingVote) {
      // 기존 투표가 있는 경우
      if (existingVote.vote_type === vote_type) {
        // 같은 투표를 다시 누르면 취소
        await supabaseServer
          .from('comment_votes')
          .delete()
          .eq('comment_id', commentId)
          .eq('user_id', user.id)

        if (vote_type === 'like') {
          newLikeCount = Math.max(0, newLikeCount - 1)
        } else {
          newDislikeCount = Math.max(0, newDislikeCount - 1)
        }
      } else {
        // 다른 투표로 변경
        await supabaseServer
          .from('comment_votes')
          .update({ vote_type })
          .eq('comment_id', commentId)
          .eq('user_id', user.id)

        newVoteType = vote_type

        if (vote_type === 'like') {
          newLikeCount += 1
          if (existingVote.vote_type === 'dislike') {
            newDislikeCount = Math.max(0, newDislikeCount - 1)
          }
        } else {
          newDislikeCount += 1
          if (existingVote.vote_type === 'like') {
            newLikeCount = Math.max(0, newLikeCount - 1)
          }
        }
      }
    } else {
      // 새로운 투표
      await supabaseServer
        .from('comment_votes')
        .insert({
          comment_id: commentId,
          user_id: user.id,
          vote_type
        })

      newVoteType = vote_type

      if (vote_type === 'like') {
        newLikeCount += 1
      } else {
        newDislikeCount += 1
      }
    }

    // 댓글의 좋아요/싫어요 수 업데이트
    const { error: updateError } = await supabaseServer
      .from('post_comments')
      .update({
        like_count: newLikeCount,
        dislike_count: newDislikeCount,
        updated_at: new Date().toISOString()
      })
      .eq('id', commentId)

    if (updateError) {
      console.error('[COMMENT_VOTE] 댓글 업데이트 실패:', updateError)
      return NextResponse.json(
        { error: '댓글 투표 업데이트에 실패했습니다.' },
        { status: 500 }
      )
    }

    console.log('[COMMENT_VOTE] 댓글 투표 성공:', {
      commentId,
      voteType: newVoteType,
      likeCount: newLikeCount,
      dislikeCount: newDislikeCount
    })

    return NextResponse.json({
      success: true,
      vote_type: newVoteType,
      like_count: newLikeCount,
      dislike_count: newDislikeCount
    })

  } catch (error) {
    console.error('[COMMENT_VOTE] 서버 오류:', error)
    return NextResponse.json(
      { error: '댓글 투표 처리에 실패했습니다.' },
      { status: 500 }
    )
  }
}

// 댓글 투표 정보 조회
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string; commentId: string } }
) {
  try {
    if (!supabaseServer) {
      return NextResponse.json(
        { error: '데이터베이스 연결이 설정되지 않았습니다.' },
        { status: 500 }
      )
    }

    const { id: postId, commentId } = params

    // Authorization 헤더에서 토큰 추출
    const authHeader = request.headers.get('Authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: '인증이 필요합니다.' },
        { status: 401 }
      )
    }

    const token = authHeader.substring(7)
    
    // 토큰으로 사용자 인증
    const { data: { user }, error: authError } = await supabaseServer.auth.getUser(token)
    
    if (authError || !user) {
      return NextResponse.json(
        { error: '유효하지 않은 토큰입니다.' },
        { status: 401 }
      )
    }

    // 사용자의 투표 정보 조회
    const { data: vote, error: voteError } = await supabaseServer
      .from('comment_votes')
      .select('vote_type')
      .eq('comment_id', commentId)
      .eq('user_id', user.id)
      .single()

    if (voteError && voteError.code !== 'PGRST116') {
      console.error('[COMMENT_VOTE_GET] 투표 정보 조회 실패:', voteError)
      return NextResponse.json(
        { error: '투표 정보 조회에 실패했습니다.' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      vote_type: vote?.vote_type || null
    })

  } catch (error) {
    console.error('[COMMENT_VOTE_GET] 서버 오류:', error)
    return NextResponse.json(
      { error: '투표 정보 조회에 실패했습니다.' },
      { status: 500 }
    )
  }
}
