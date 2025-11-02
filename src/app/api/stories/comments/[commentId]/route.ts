import { NextRequest, NextResponse } from 'next/server'
import { supabaseServer } from '@/lib/supabaseServer'

// 스토리 댓글 삭제
export async function DELETE(
  request: NextRequest,
  { params }: { params: { commentId: string } }
) {
  try {
    if (!supabaseServer) {
      return NextResponse.json(
        { error: 'Database connection not available' },
        { status: 500 }
      )
    }

    const commentId = params.commentId

    // 인증 확인
    const authHeader = request.headers.get('Authorization')
    if (!authHeader) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authError } = await supabaseServer.auth.getUser(token)

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // 댓글 정보 조회
    const { data: comment, error: commentError } = await supabaseServer
      .from('story_comments')
      .select('user_id')
      .eq('id', commentId)
      .single()

    if (commentError || !comment) {
      return NextResponse.json(
        { error: 'Comment not found' },
        { status: 404 }
      )
    }

    // 권한 확인: 작성자 본인 또는 관리자만 삭제 가능
    const { data: userData } = await supabaseServer
      .from('users')
      .select('is_admin')
      .eq('id', user.id)
      .single()

    const isAdmin = userData?.is_admin === true
    const isAuthor = comment.user_id === user.id

    if (!isAuthor && !isAdmin) {
      return NextResponse.json(
        { error: 'Forbidden: You can only delete your own comments or must be an admin' },
        { status: 403 }
      )
    }

    // 댓글 삭제 (소프트 삭제 또는 실제 삭제)
    const { error: deleteError } = await supabaseServer
      .from('story_comments')
      .delete()
      .eq('id', commentId)

    if (deleteError) {
      console.error('Error deleting comment:', deleteError)
      return NextResponse.json(
        { error: 'Failed to delete comment' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Comment deleted successfully'
    })

  } catch (error) {
    console.error('Error in DELETE /api/stories/comments/[commentId]:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

