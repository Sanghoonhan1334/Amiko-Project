import { NextRequest, NextResponse } from 'next/server'
import { supabaseServer } from '@/lib/supabaseServer'

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const commentId = params.id
    const authHeader = request.headers.get('authorization')
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({
        success: false,
        error: '인증이 필요합니다.'
      }, { status: 401 })
    }

    const token = authHeader.replace('Bearer ', '')
    
    // 토큰에서 사용자 정보 추출
    const { data: { user }, error: userError } = await supabaseServer.auth.getUser(token)
    
    if (userError || !user) {
      return NextResponse.json({
        success: false,
        error: '유효하지 않은 토큰입니다.'
      }, { status: 401 })
    }

    const { vote_type } = await request.json()
    
    if (!vote_type || !['like', 'dislike'].includes(vote_type)) {
      return NextResponse.json({
        success: false,
        error: '유효하지 않은 투표 타입입니다.'
      }, { status: 400 })
    }

    // 기존 투표 확인
    const { data: existingVote, error: existingVoteError } = await supabaseServer
      .from('comment_votes')
      .select('vote_type')
      .eq('comment_id', commentId)
      .eq('user_id', user.id)
      .single()

    let newVoteType = vote_type
    let likeCountChange = 0
    let dislikeCountChange = 0

    if (existingVoteError && existingVoteError.code !== 'PGRST116') {
      console.error('기존 투표 조회 오류:', existingVoteError)
      return NextResponse.json({
        success: false,
        error: '투표 정보를 조회할 수 없습니다.'
      }, { status: 500 })
    }

    if (existingVote) {
      // 기존 투표가 있는 경우
      if (existingVote.vote_type === vote_type) {
        // 같은 투표를 다시 누르면 취소
        newVoteType = null
        if (vote_type === 'like') {
          likeCountChange = -1
        } else {
          dislikeCountChange = -1
        }
      } else {
        // 다른 투표로 변경
        if (vote_type === 'like') {
          likeCountChange = 1
          dislikeCountChange = -1
        } else {
          likeCountChange = -1
          dislikeCountChange = 1
        }
      }
    } else {
      // 새로운 투표
      if (vote_type === 'like') {
        likeCountChange = 1
      } else {
        dislikeCountChange = 1
      }
    }

    // 트랜잭션으로 투표 처리
    const { error: transactionError } = await supabaseServer.rpc('handle_comment_vote', {
      p_comment_id: commentId,
      p_user_id: user.id,
      p_vote_type: newVoteType,
      p_like_change: likeCountChange,
      p_dislike_change: dislikeCountChange
    })

    if (transactionError) {
      console.error('댓글 투표 처리 오류:', transactionError)
      return NextResponse.json({
        success: false,
        error: '투표 처리 중 오류가 발생했습니다.'
      }, { status: 500 })
    }

    // 업데이트된 카운트 조회
    const { data: updatedComment, error: commentError } = await supabaseServer
      .from('post_comments')
      .select('like_count, dislike_count')
      .eq('id', commentId)
      .single()

    if (commentError) {
      console.error('댓글 카운트 조회 오류:', commentError)
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
    console.error('댓글 투표 처리 오류:', error)
    return NextResponse.json({
      success: false,
      error: '서버 오류가 발생했습니다.'
    }, { status: 500 })
  }
}