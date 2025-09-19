import { NextRequest, NextResponse } from 'next/server'
import { supabaseServer } from '@/lib/supabaseServer'

// 댓글 투표 (추천/비추천)
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    if (!supabaseServer) {
      return NextResponse.json(
        { error: '데이터베이스 연결이 설정되지 않았습니다.' },
        { status: 500 }
      )
    }

    const commentId = params.id
    const body = await request.json()
    const { vote_type } = body

    // Authorization 헤더에서 토큰 추출
    const authHeader = request.headers.get('Authorization')
    if (!authHeader) {
      return NextResponse.json(
        { error: '인증이 필요합니다.' },
        { status: 401 }
      )
    }

    const token = authHeader.replace('Bearer ', '')
    
    // 토큰에서 사용자 정보 추출
    const { data: { user: authUser }, error: authError } = await supabaseServer.auth.getUser(token)
    
    if (authError || !authUser) {
      return NextResponse.json(
        { error: '인증에 실패했습니다.' },
        { status: 401 }
      )
    }

    // 입력 데이터 검증
    if (!vote_type || !['like', 'dislike'].includes(vote_type)) {
      return NextResponse.json(
        { error: '올바른 투표 타입을 선택해주세요.' },
        { status: 400 }
      )
    }

    console.log('[COMMENT_VOTE] 댓글 투표 시작:', { 
      commentId, 
      userId: authUser.id, 
      voteType: vote_type 
    })

    // 댓글 존재 확인
    const { data: comment, error: commentError } = await supabaseServer
      .from('gallery_comments')
      .select('id, user_id')
      .eq('id', commentId)
      .eq('is_deleted', false)
      .single()

    if (commentError || !comment) {
      return NextResponse.json(
        { error: '댓글을 찾을 수 없습니다.' },
        { status: 404 }
      )
    }

    // 자신의 댓글에 투표하는지 확인
    if (comment.user_id === authUser.id) {
      return NextResponse.json(
        { error: '자신의 댓글에는 투표할 수 없습니다.' },
        { status: 400 }
      )
    }

    // 기존 투표 확인
    const { data: existingVote, error: voteError } = await supabaseServer
      .from('gallery_votes')
      .select('id, vote_type')
      .eq('user_id', authUser.id)
      .eq('comment_id', commentId)
      .single()

    if (voteError && voteError.code !== 'PGRST116') {
      console.error('[COMMENT_VOTE] 투표 조회 오류:', voteError)
      return NextResponse.json(
        { error: '투표 정보를 조회하는데 실패했습니다.' },
        { status: 500 }
      )
    }

    let result

    if (existingVote) {
      // 기존 투표가 있는 경우
      if (existingVote.vote_type === vote_type) {
        // 같은 투표를 다시 누른 경우 - 투표 취소
        const { error: deleteError } = await supabaseServer
          .from('gallery_votes')
          .delete()
          .eq('id', existingVote.id)

        if (deleteError) {
          console.error('[COMMENT_VOTE] 투표 삭제 오류:', deleteError)
          return NextResponse.json(
            { error: '투표 취소에 실패했습니다.' },
            { status: 500 }
          )
        }

        // 댓글의 투표 수 업데이트
        const updateField = vote_type === 'like' ? 'like_count' : 'dislike_count'
        const { error: updateError } = await supabaseServer
          .from('gallery_comments')
          .update({ 
            [updateField]: supabaseServer.sql`${updateField} - 1` 
          })
          .eq('id', commentId)

        if (updateError) {
          console.error('[COMMENT_VOTE] 댓글 투표 수 업데이트 오류:', updateError)
        }

        result = { action: 'cancelled', vote_type: null }
      } else {
        // 다른 투표로 변경하는 경우
        const { error: updateError } = await supabaseServer
          .from('gallery_votes')
          .update({ vote_type })
          .eq('id', existingVote.id)

        if (updateError) {
          console.error('[COMMENT_VOTE] 투표 업데이트 오류:', updateError)
          return NextResponse.json(
            { error: '투표 변경에 실패했습니다.' },
            { status: 500 }
          )
        }

        // 댓글의 투표 수 업데이트
        const oldField = existingVote.vote_type === 'like' ? 'like_count' : 'dislike_count'
        const newField = vote_type === 'like' ? 'like_count' : 'dislike_count'
        
        const { error: updateCountError } = await supabaseServer
          .from('gallery_comments')
          .update({ 
            [oldField]: supabaseServer.sql`${oldField} - 1`,
            [newField]: supabaseServer.sql`${newField} + 1`
          })
          .eq('id', commentId)

        if (updateCountError) {
          console.error('[COMMENT_VOTE] 댓글 투표 수 업데이트 오류:', updateCountError)
        }

        result = { action: 'changed', vote_type, previous_vote: existingVote.vote_type }
      }
    } else {
      // 새로운 투표 생성
      const { error: insertError } = await supabaseServer
        .from('gallery_votes')
        .insert({
          user_id: authUser.id,
          comment_id: commentId,
          vote_type
        })

      if (insertError) {
        console.error('[COMMENT_VOTE] 투표 생성 오류:', insertError)
        return NextResponse.json(
          { error: '투표에 실패했습니다.' },
          { status: 500 }
        )
      }

      // 댓글의 투표 수 업데이트
      const updateField = vote_type === 'like' ? 'like_count' : 'dislike_count'
      const { error: updateError } = await supabaseServer
        .from('gallery_comments')
        .update({ 
          [updateField]: supabaseServer.sql`${updateField} + 1` 
        })
        .eq('id', commentId)

      if (updateError) {
        console.error('[COMMENT_VOTE] 댓글 투표 수 업데이트 오류:', updateError)
      }

      result = { action: 'created', vote_type }
    }

    console.log('[COMMENT_VOTE] 댓글 투표 성공:', result)

    return NextResponse.json({
      success: true,
      ...result,
      message: '투표가 성공적으로 처리되었습니다.'
    })

  } catch (error) {
    console.error('[COMMENT_VOTE] 댓글 투표 오류:', error)
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}
