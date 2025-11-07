import { supabaseServer } from '@/lib/supabaseServer'
import { NextResponse } from 'next/server'

// 댓글 삭제
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string; commentId: string }> }
) {
  try {
    if (!supabaseServer) {
      return NextResponse.json({ error: 'Server not configured' }, { status: 500 })
    }

    const { id, commentId } = await params

    const authHeader = request.headers.get('Authorization')
    if (!authHeader) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authError } = await supabaseServer.auth.getUser(token)

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // 댓글 조회 (본인 확인)
    const { data: comment, error: fetchError } = await supabaseServer
      .from('fan_art_comments')
      .select('user_id')
      .eq('id', commentId)
      .single()

    if (fetchError || !comment) {
      return NextResponse.json({ error: 'Comment not found' }, { status: 404 })
    }

    // 본인 댓글인지 확인
    if (comment.user_id !== user.id) {
      return NextResponse.json({ error: 'Forbidden: Not your comment' }, { status: 403 })
    }

    // 댓글 삭제 (소프트 삭제 또는 하드 삭제)
    const { error: deleteError } = await supabaseServer
      .from('fan_art_comments')
      .delete()
      .eq('id', commentId)

    if (deleteError) {
      console.error('[FAN_ART_COMMENTS_DELETE] 삭제 실패:', deleteError)
      return NextResponse.json({ error: deleteError.message }, { status: 500 })
    }

    console.log('[FAN_ART_COMMENTS_DELETE] 댓글 삭제 성공:', commentId)
    return NextResponse.json({ success: true, message: 'Comment deleted' })

  } catch (error) {
    console.error('[FAN_ART_COMMENTS_DELETE] 전체 오류:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

