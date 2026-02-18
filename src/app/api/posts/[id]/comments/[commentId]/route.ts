import { NextRequest, NextResponse } from 'next/server'
import { supabaseServer } from '@/lib/supabaseServer'

// 댓글 삭제
export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string, commentId: string }> }
) {
  const params = await context.params
  try {
    if (!supabaseServer) {
      return NextResponse.json(
        { error: '데이터베이스 연결이 설정되지 않았습니다.' },
        { status: 500 }
      )
    }

    const { id: postId, commentId } = params

    console.log('[COMMENT_DELETE] 댓글 삭제:', { postId, commentId })

    // Authorization 헤더에서 토큰 추출
    const authHeader = request.headers.get('Authorization')
    if (!authHeader) {
      console.error('[COMMENT_DELETE] Authorization 헤더 없음')
      return NextResponse.json({ error: '인증이 필요합니다.' }, { status: 401 })
    }

    const token = authHeader.split(' ')[1]
    const { data: { user }, error: authError } = await supabaseServer.auth.getUser(token)

    if (authError || !user) {
      console.error('[COMMENT_DELETE] 인증 실패:', authError?.message)
      return NextResponse.json({ error: '인증이 필요합니다.' }, { status: 401 })
    }

    // 운영자 권한 확인
    const { data: adminData } = await supabaseServer
      .from('admin_users')
      .select('id, is_active')
      .eq('user_id', user.id)
      .eq('is_active', true)
      .single()

    const isOperator = !!adminData

    // 댓글 작성자 확인
    const { data: comment, error: commentError } = await supabaseServer
      .from('post_comments')
      .select('user_id, post_id')
      .eq('id', commentId)
      .eq('is_deleted', false)
      .single()

    if (commentError || !comment) {
      console.error('[COMMENT_DELETE] 댓글 조회 실패:', commentError)
      return NextResponse.json({ error: '댓글을 찾을 수 없습니다.' }, { status: 404 })
    }

    // 권한 체크: 작성자 본인이거나 운영자만 삭제 가능
    if (comment.user_id !== user.id && !isOperator) {
      console.log('[COMMENT_DELETE] 권한 없음:', { commentUserId: comment.user_id, userId: user.id, isOperator })
      return NextResponse.json({ error: '댓글을 삭제할 권한이 없습니다.' }, { status: 403 })
    }

    // 댓글 소프트 삭제
    const { error: deleteError } = await supabaseServer
      .from('post_comments')
      .update({ is_deleted: true })
      .eq('id', commentId)

    if (deleteError) {
      console.error('[COMMENT_DELETE] 댓글 삭제 실패:', deleteError)
      return NextResponse.json({ error: '댓글 삭제에 실패했습니다.' }, { status: 500 })
    }

    // 게시글의 댓글 수 감소
    const { error: updateError } = await supabaseServer.rpc('decrement_comment_count', {
      post_id: postId
    })

    if (updateError) {
      console.error('[COMMENT_DELETE] 댓글 수 감소 실패:', updateError)
      // 댓글은 삭제되었으므로 에러를 반환하지 않음
    }

    console.log('[COMMENT_DELETE] 댓글 삭제 성공')

    return NextResponse.json(
      { success: true, message: '댓글이 성공적으로 삭제되었습니다.' },
      { status: 200 }
    )
  } catch (error: any) {
    console.error('[COMMENT_DELETE] 서버 오류:', error)
    return NextResponse.json(
      { error: '댓글 삭제에 실패했습니다.', details: error.message },
      { status: 500 }
    )
  }
}

