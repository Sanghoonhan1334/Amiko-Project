import { NextRequest, NextResponse } from 'next/server'
import { supabaseServer } from '@/lib/supabaseServer'

export async function POST(
  request: NextRequest,
  { params }: { params: { postId: string; commentId: string } }
) {
  try {
    const { postId, commentId } = params

    if (!postId || !commentId) {
      return NextResponse.json({
        success: false,
        error: '게시글 ID와 댓글 ID가 필요합니다.'
      }, { status: 400 })
    }

    // Authorization 헤더에서 토큰 추출
    const authHeader = request.headers.get('Authorization')
    if (!authHeader) {
      return NextResponse.json({
        success: false,
        error: '인증이 필요합니다.'
      }, { status: 401 })
    }

    const token = authHeader.replace('Bearer ', '')
    
    // 토큰에서 사용자 정보 추출
    const { data: { user: tokenUser }, error: authError } = await supabaseServer.auth.getUser(token)
    
    if (authError || !tokenUser) {
      console.error('[COMMENT_VOTE] 인증 실패:', authError)
      return NextResponse.json({
        success: false,
        error: '인증에 실패했습니다.'
      }, { status: 401 })
    }

    // 요청 본문에서 투표 타입 추출
    const { vote_type } = await request.json()

    if (!vote_type || !['like', 'dislike'].includes(vote_type)) {
      return NextResponse.json({
        success: false,
        error: '올바른 투표 타입이 필요합니다. (like 또는 dislike)'
      }, { status: 400 })
    }

    console.log('[COMMENT_VOTE] 댓글 투표 시작:', {
      postId,
      commentId,
      userId: tokenUser.id,
      voteType: vote_type
    })

    // 기존 투표 확인
    const { data: existingVote, error: voteCheckError } = await supabaseServer
      .from('comment_votes')
      .select('id, vote_type')
      .eq('comment_id', commentId)
      .eq('user_id', tokenUser.id)
      .single()

    if (voteCheckError && voteCheckError.code !== 'PGRST116') {
      console.error('[COMMENT_VOTE] 기존 투표 확인 실패:', voteCheckError)
      return NextResponse.json({
        success: false,
        error: '투표 확인 중 오류가 발생했습니다.'
      }, { status: 500 })
    }

    if (existingVote) {
      // 이미 투표한 경우 - 투표 취소 또는 변경
      if (existingVote.vote_type === vote_type) {
        // 같은 투표 타입이면 투표 취소
        const { error: deleteError } = await supabaseServer
          .from('comment_votes')
          .delete()
          .eq('id', existingVote.id)

        if (deleteError) {
          console.error('[COMMENT_VOTE] 투표 취소 실패:', deleteError)
          return NextResponse.json({
            success: false,
            error: '투표 취소에 실패했습니다.'
          }, { status: 500 })
        }

        console.log('[COMMENT_VOTE] 투표 취소 성공')
      } else {
        // 다른 투표 타입이면 투표 변경
        const { error: updateError } = await supabaseServer
          .from('comment_votes')
          .update({ vote_type, updated_at: new Date().toISOString() })
          .eq('id', existingVote.id)

        if (updateError) {
          console.error('[COMMENT_VOTE] 투표 변경 실패:', updateError)
          return NextResponse.json({
            success: false,
            error: '투표 변경에 실패했습니다.'
          }, { status: 500 })
        }

        console.log('[COMMENT_VOTE] 투표 변경 성공')
      }
    } else {
      // 새로운 투표 생성
      const { error: insertError } = await supabaseServer
        .from('comment_votes')
        .insert({
          comment_id: commentId,
          user_id: tokenUser.id,
          vote_type,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })

      if (insertError) {
        console.error('[COMMENT_VOTE] 투표 생성 실패:', insertError)
        return NextResponse.json({
          success: false,
          error: '투표 생성에 실패했습니다.'
        }, { status: 500 })
      }

      console.log('[COMMENT_VOTE] 투표 생성 성공')
    }

    // 댓글의 투표 수 업데이트
    const { data: likeCount } = await supabaseServer
      .from('comment_votes')
      .select('id', { count: 'exact' })
      .eq('comment_id', commentId)
      .eq('vote_type', 'like')

    const { data: dislikeCount } = await supabaseServer
      .from('comment_votes')
      .select('id', { count: 'exact' })
      .eq('comment_id', commentId)
      .eq('vote_type', 'dislike')

    // 댓글 테이블 업데이트
    const { error: updateCommentError } = await supabaseServer
      .from('comments')
      .update({
        like_count: likeCount?.length || 0,
        dislike_count: dislikeCount?.length || 0,
        updated_at: new Date().toISOString()
      })
      .eq('id', commentId)

    if (updateCommentError) {
      console.error('[COMMENT_VOTE] 댓글 투표 수 업데이트 실패:', updateCommentError)
      // 투표는 성공했지만 카운트 업데이트 실패는 심각한 오류는 아님
    }

    return NextResponse.json({
      success: true,
      message: '투표가 완료되었습니다.',
      vote_type: existingVote?.vote_type === vote_type ? null : vote_type,
      like_count: likeCount?.length || 0,
      dislike_count: dislikeCount?.length || 0
    })

  } catch (error) {
    console.error('[COMMENT_VOTE] 서버 오류:', error)
    return NextResponse.json({
      success: false,
      error: '서버 오류가 발생했습니다.'
    }, { status: 500 })
  }
}
