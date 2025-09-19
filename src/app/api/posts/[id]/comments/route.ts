import { NextRequest, NextResponse } from 'next/server'
import { supabaseServer } from '@/lib/supabaseServer'

// 게시물의 댓글 목록 조회
export async function GET(
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

    const { id } = params

    console.log('[COMMENTS] 댓글 조회 시작:', id)

    // 댓글 조회 (삭제되지 않은 것만, 최신순)
    const { data: comments, error } = await supabaseServer
      .from('gallery_comments')
      .select(`
        id,
        content,
        like_count,
        dislike_count,
        created_at,
        updated_at,
        user:users!gallery_comments_user_id_fkey (
          id,
          full_name,
          avatar_url
        )
      `)
      .eq('post_id', id)
      .eq('is_deleted', false)
      .is('parent_id', null) // 대댓글 제외 (일단 기본 댓글만)
      .order('created_at', { ascending: true })

    if (error) {
      console.error('[COMMENTS] 댓글 조회 실패:', error)
      return NextResponse.json(
        { error: '댓글을 불러오는데 실패했습니다.' },
        { status: 500 }
      )
    }

    console.log('[COMMENTS] 댓글 조회 성공:', comments?.length || 0, '개')

    return NextResponse.json({
      success: true,
      comments: comments || []
    })

  } catch (error) {
    console.error('[COMMENTS] 댓글 조회 오류:', error)
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}

// 댓글 작성
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

    const { id } = params
    const body = await request.json()
    const { content, parentId } = body

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

    console.log('[COMMENT_CREATE] 댓글 작성 시작:', { postId: id, userId: authUser.id })

    // 게시물 존재 확인
    const { data: post, error: postError } = await supabaseServer
      .from('gallery_posts')
      .select('id, gallery_id')
      .eq('id', id)
      .eq('is_deleted', false)
      .single()

    if (postError || !post) {
      return NextResponse.json(
        { error: '게시물을 찾을 수 없습니다.' },
        { status: 404 }
      )
    }

    // 댓글 작성
    const { data: newComment, error: commentError } = await supabaseServer
      .from('gallery_comments')
      .insert({
        post_id: id,
        user_id: authUser.id,
        content: content.trim(),
        parent_id: parentId || null
      })
      .select(`
        id,
        content,
        like_count,
        dislike_count,
        created_at,
        updated_at,
        user:users!gallery_comments_user_id_fkey (
          id,
          full_name,
          avatar_url
        )
      `)
      .single()

    if (commentError) {
      console.error('[COMMENT_CREATE] 댓글 작성 실패:', commentError)
      return NextResponse.json(
        { error: '댓글 작성에 실패했습니다.' },
        { status: 500 }
      )
    }

    // 게시물의 댓글 수 증가
    await supabaseServer
      .from('gallery_posts')
      .update({ comment_count: supabaseServer.sql`comment_count + 1` })
      .eq('id', id)

    // 갤러리의 댓글 수 증가
    await supabaseServer.rpc('increment_gallery_comment_count', {
      gallery_id: post.gallery_id
    })

    console.log('[COMMENT_CREATE] 댓글 작성 성공:', newComment.id)

    return NextResponse.json({
      success: true,
      comment: newComment
    })

  } catch (error) {
    console.error('[COMMENT_CREATE] 댓글 작성 오류:', error)
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}