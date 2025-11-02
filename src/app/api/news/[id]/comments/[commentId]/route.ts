import { NextRequest, NextResponse } from 'next/server'
import { supabaseServer } from '@/lib/supabaseServer'

// K-매거진 뉴스 댓글 삭제
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string, commentId: string } }
) {
  try {
    if (!supabaseServer) {
      return NextResponse.json(
        { error: '데이터베이스 연결이 설정되지 않았습니다.' },
        { status: 500 }
      )
    }

    const { id: newsId, commentId } = params

    console.log('[NEWS_COMMENT_DELETE] 뉴스 댓글 삭제:', { newsId, commentId })

    // Authorization 헤더에서 토큰 추출
    const authHeader = request.headers.get('Authorization')
    
    if (!authHeader) {
      console.error('[NEWS_COMMENT_DELETE] Authorization 헤더 없음')
      return NextResponse.json({ error: '인증이 필요합니다.' }, { status: 401 })
    }

    const token = authHeader.split(' ')[1]
    const { data: { user }, error: authError } = await supabaseServer.auth.getUser(token)

    if (authError || !user) {
      console.error('[NEWS_COMMENT_DELETE] 인증 실패:', authError?.message)
      return NextResponse.json({ error: '인증이 필요합니다.' }, { status: 401 })
    }

    // 댓글 작성자 확인
    const { data: comment, error: commentError } = await supabaseServer
      .from('comments')
      .select('author_id')
      .eq('id', commentId)
      .single()

    if (commentError || !comment) {
      console.error('[NEWS_COMMENT_DELETE] 댓글 조회 실패:', commentError)
      return NextResponse.json({ error: '댓글을 찾을 수 없습니다.' }, { status: 404 })
    }

    // 운영자 권한 확인
    const { data: adminData } = await supabaseServer
      .from('admin_users')
      .select('id, is_active')
      .eq('user_id', user.id)
      .eq('is_active', true)
      .single()

    const isOperator = !!adminData

    // 작성자 또는 운영자만 삭제 가능
    if (comment.author_id !== user.id && !isOperator) {
      console.log('[NEWS_COMMENT_DELETE] 권한 없음:', { commentAuthorId: comment.author_id, userId: user.id, isOperator })
      return NextResponse.json({ error: '댓글을 삭제할 권한이 없습니다.' }, { status: 403 })
    }

    // 댓글 삭제 (soft delete)
    const { error: deleteError } = await supabaseServer
      .from('comments')
      .update({ is_deleted: true })
      .eq('id', commentId)

    if (deleteError) {
      console.error('[NEWS_COMMENT_DELETE] 댓글 삭제 실패:', deleteError)
      return NextResponse.json({ error: '댓글 삭제에 실패했습니다.' }, { status: 500 })
    }

    // 게시물의 댓글 수 업데이트
    const { error: updateError } = await supabaseServer.rpc('update_post_comment_count', {
      post_id: newsId
    })

    if (updateError) {
      console.error('[NEWS_COMMENT_DELETE] 댓글 수 업데이트 실패:', updateError)
      // 댓글은 삭제되었으므로 에러를 반환하지 않음
    }

    console.log('[NEWS_COMMENT_DELETE] 댓글 삭제 성공')

    return NextResponse.json({
      success: true,
      message: '댓글이 성공적으로 삭제되었습니다.'
    })

  } catch (error: any) {
    console.error('[NEWS_COMMENT_DELETE] 서버 오류:', error)
    return NextResponse.json(
      { error: '댓글 삭제에 실패했습니다.', details: error.message },
      { status: 500 }
    )
  }
}

// K-매거진 뉴스 댓글 수정
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string, commentId: string } }
) {
  try {
    if (!supabaseServer) {
      return NextResponse.json(
        { error: '데이터베이스 연결이 설정되지 않았습니다.' },
        { status: 500 }
      )
    }

    const { id: newsId, commentId } = params
    const { content } = await request.json()

    console.log('[NEWS_COMMENT_UPDATE] 뉴스 댓글 수정:', { newsId, commentId, content: content?.substring(0, 50) })

    // Authorization 헤더에서 토큰 추출
    const authHeader = request.headers.get('Authorization')
    
    if (!authHeader) {
      console.error('[NEWS_COMMENT_UPDATE] Authorization 헤더 없음')
      return NextResponse.json({ error: '인증이 필요합니다.' }, { status: 401 })
    }

    const token = authHeader.split(' ')[1]
    const { data: { user }, error: authError } = await supabaseServer.auth.getUser(token)

    if (authError || !user) {
      console.error('[NEWS_COMMENT_UPDATE] 인증 실패:', authError?.message)
      return NextResponse.json({ error: '인증이 필요합니다.' }, { status: 401 })
    }

    // 유효성 검사
    if (!content || content.trim() === '') {
      return NextResponse.json({ error: '댓글 내용을 입력해주세요.' }, { status: 400 })
    }

    // 댓글 작성자 확인
    const { data: comment, error: commentError } = await supabaseServer
      .from('comments')
      .select('author_id')
      .eq('id', commentId)
      .single()

    if (commentError || !comment) {
      console.error('[NEWS_COMMENT_UPDATE] 댓글 조회 실패:', commentError)
      return NextResponse.json({ error: '댓글을 찾을 수 없습니다.' }, { status: 404 })
    }

    // 작성자만 수정 가능
    if (comment.author_id !== authUser.id) {
      return NextResponse.json({ error: '댓글을 수정할 권한이 없습니다.' }, { status: 403 })
    }

    // 댓글 수정
    const { data: updatedComment, error: updateError } = await supabaseServer
      .from('comments')
      .update({ 
        content: content.trim(),
        updated_at: new Date().toISOString()
      })
      .eq('id', commentId)
      .select('id, author_id, content, like_count, dislike_count, created_at, updated_at, parent_id')
      .single()

    if (updateError) {
      console.error('[NEWS_COMMENT_UPDATE] 댓글 수정 실패:', updateError)
      return NextResponse.json({ error: '댓글 수정에 실패했습니다.' }, { status: 500 })
    }

    // 사용자 정보 조회
    const { data: authorData } = await supabaseServer
      .from('users')
      .select('id, full_name, avatar_url, profile_image')
      .eq('id', updatedComment.author_id)
      .single()

    // 댓글 데이터 변환
    const transformedComment = {
      id: updatedComment.id,
      content: updatedComment.content,
      like_count: updatedComment.like_count || 0,
      dislike_count: updatedComment.dislike_count || 0,
      created_at: updatedComment.created_at,
      updated_at: updatedComment.updated_at,
      parent_comment_id: updatedComment.parent_id,
      author: {
        id: authorData?.id || updatedComment.author_id,
        full_name: authorData?.full_name || '알 수 없음',
        profile_image: authorData?.profile_image || authorData?.avatar_url || null
      }
    }

    console.log('[NEWS_COMMENT_UPDATE] 댓글 수정 성공')

    return NextResponse.json({
      success: true,
      comment: transformedComment,
      message: '댓글이 성공적으로 수정되었습니다.'
    })

  } catch (error: any) {
    console.error('[NEWS_COMMENT_UPDATE] 서버 오류:', error)
    return NextResponse.json(
      { error: '댓글 수정에 실패했습니다.', details: error.message },
      { status: 500 }
    )
  }
}
