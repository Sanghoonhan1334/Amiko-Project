import { NextRequest, NextResponse } from 'next/server'
import { supabaseServer } from '@/lib/supabaseServer'

export async function POST(
  request: NextRequest,
  { params }: { params: { commentId: string } }
) {
  try {
    if (!supabaseServer) {
      return NextResponse.json(
        { error: '데이터베이스 연결이 설정되지 않았습니다.' },
        { status: 500 }
      )
    }
    // Authorization 헤더에서 토큰 추출
    const authHeader = request.headers.get('Authorization')
    let authUser = null

    if (authHeader) {
      const token = authHeader.split(' ')[1]
      const { data: { user }, error: authError } = await supabaseServer.auth.getUser(token)

      if (authError || !user) {
        console.error('[COMMENT_LIKE_POST] 인증 실패:', authError?.message)
        return NextResponse.json({ error: '인증이 필요합니다.' }, { status: 401 })
      }

      authUser = user
    } else {
      return NextResponse.json({ error: '인증이 필요합니다.' }, { status: 401 })
    }

    const commentId = params.commentId

    if (!commentId) {
      return NextResponse.json(
        { error: '댓글 ID가 필요합니다.' },
        { status: 400 }
      )
    }

    // 기존 좋아요 확인
    const { data: existingLike, error: checkError } = await supabaseServer
      .from('story_comment_likes')
      .select('id')
      .eq('comment_id', commentId)
      .eq('user_id', authUser.id)
      .single()

    if (checkError && checkError.code !== 'PGRST116') {
      console.error('[COMMENT_LIKE_POST] 기존 좋아요 확인 실패:', checkError)
      return NextResponse.json(
        { error: '좋아요 상태를 확인할 수 없습니다.' },
        { status: 500 }
      )
    }

    const isLiked = !!existingLike

    if (isLiked) {
      // 좋아요 취소
      const { error: deleteError } = await supabaseServer
        .from('story_comment_likes')
        .delete()
        .eq('comment_id', commentId)
        .eq('user_id', authUser.id)

      if (deleteError) {
        console.error('[COMMENT_LIKE_POST] 좋아요 취소 실패:', deleteError)
        return NextResponse.json(
          { error: '좋아요 취소에 실패했습니다.' },
          { status: 500 }
        )
      }
    } else {
      // 좋아요 추가
      const { error: insertError } = await supabaseServer
        .from('story_comment_likes')
        .insert({
          comment_id: commentId,
          user_id: authUser.id
        })

      if (insertError) {
        console.error('[COMMENT_LIKE_POST] 좋아요 추가 실패:', insertError)
        return NextResponse.json(
          { error: '좋아요 추가에 실패했습니다.' },
          { status: 500 }
        )
      }
    }

    return NextResponse.json({
      success: true,
      liked: !isLiked
    })

  } catch (error) {
    console.error('[COMMENT_LIKE_POST] 예상치 못한 오류:', error)
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}
