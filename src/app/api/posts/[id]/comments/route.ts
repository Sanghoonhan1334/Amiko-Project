import { NextRequest, NextResponse } from 'next/server'
import { supabaseServer } from '@/lib/supabaseServer'

// 댓글 목록 조회
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const params = await context.params
  try {
    if (!supabaseServer) {
      return NextResponse.json(
        { error: '데이터베이스 연결이 설정되지 않았습니다.' },
        { status: 500 }
      )
    }

    const postId = params.id
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const offset = (page - 1) * limit

    // 게시글 존재 확인
    const { data: post, error: postError } = await supabaseServer
      .from('posts')
      .select('id')
      .eq('id', postId)
      .eq('status', 'published')
      .single()

    if (postError || !post) {
      return NextResponse.json(
        { error: '게시글을 찾을 수 없습니다.' },
        { status: 404 }
      )
    }

    // 댓글 조회 (대댓글 포함)
    const { data: comments, error, count } = await supabaseServer
      .from('comments')
      .select(`
        id,
        content,
        parent_id,
        like_count,
        dislike_count,
        created_at,
        updated_at,
        author:users!comments_author_id_fkey (
          id,
          full_name,
          profile_image
        )
      `)
      .eq('post_id', postId)
      .eq('status', 'published')
      .order('created_at', { ascending: true })
      .range(offset, offset + limit - 1)

    if (error) {
      console.error('[COMMENTS_LIST] 댓글 목록 조회 실패:', error)
      return NextResponse.json(
        { error: '댓글 목록을 불러오는데 실패했습니다.' },
        { status: 500 }
      )
    }

    // 댓글 작성자 정보 디버깅 로그
    if (comments && comments.length > 0) {
      console.log('[COMMENTS_LIST] 첫 번째 댓글 작성자 정보:', {
        commentId: (comments[0] as any).id,
        authorId: (comments[0] as any).author?.id,
        authorFullName: (comments[0] as any).author?.full_name,
        authorProfileImage: (comments[0] as any).author?.profile_image
      })
    }

    // 댓글과 대댓글 구조화
    const structuredComments = comments?.reduce((acc: any[], comment: any) => {
      if (!comment.parent_id) {
        // 부모 댓글
        acc.push({
          ...comment,
          replies: []
        })
      } else {
        // 대댓글
        const parentIndex = acc.findIndex(parent => parent.id === comment.parent_id)
        if (parentIndex !== -1) {
          acc[parentIndex].replies.push(comment)
        }
      }
      return acc
    }, []) || []

    return NextResponse.json({
      comments: structuredComments,
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit)
      }
    })

  } catch (error) {
    console.error('[COMMENTS_LIST] 서버 에러:', error)
    return NextResponse.json(
      { error: '서버 에러가 발생했습니다.' },
      { status: 500 }
    )
  }
}

// 댓글 작성
export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const params = await context.params
  try {
    if (!supabaseServer) {
      return NextResponse.json(
        { error: '데이터베이스 연결이 설정되지 않았습니다.' },
        { status: 500 }
      )
    }

    const postId = params.id
    const body = await request.json()
    const { content, parent_id } = body

    // 인증 확인
    const authHeader = request.headers.get('authorization')
    if (!authHeader) {
      return NextResponse.json(
        { error: '인증이 필요합니다.' },
        { status: 401 }
      )
    }

    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authError } = await supabaseServer.auth.getUser(token)

    if (authError || !user) {
      return NextResponse.json(
        { error: '인증에 실패했습니다.' },
        { status: 401 }
      )
    }

    // 게시글 존재 확인
    const { data: post, error: postError } = await supabaseServer
      .from('posts')
      .select('id')
      .eq('id', postId)
      .eq('status', 'published')
      .single()

    if (postError || !post) {
      return NextResponse.json(
        { error: '게시글을 찾을 수 없습니다.' },
        { status: 404 }
      )
    }

    // 입력 검증
    if (!content || content.trim().length === 0) {
      return NextResponse.json(
        { error: '댓글 내용을 입력해주세요.' },
        { status: 400 }
      )
    }

    if (content.length > 1000) {
      return NextResponse.json(
        { error: '댓글은 1,000자 이하로 입력해주세요.' },
        { status: 400 }
      )
    }

    // 부모 댓글 존재 확인 (대댓글인 경우)
    if (parent_id) {
      const { data: parentComment, error: parentError } = await supabaseServer
        .from('comments')
        .select('id')
        .eq('id', parent_id)
        .eq('post_id', postId)
        .eq('status', 'published')
        .single()

      if (parentError || !parentComment) {
        return NextResponse.json(
          { error: '부모 댓글을 찾을 수 없습니다.' },
          { status: 404 }
        )
      }
    }

    // 댓글 생성
    const { data: comment, error } = await (supabaseServer as any)
      .from('comments')
      .insert({
        post_id: postId,
        author_id: user.id,
        content: content.trim(),
        parent_id: parent_id || null,
        status: 'published'
      })
      .select(`
        id,
        content,
        parent_id,
        like_count,
        dislike_count,
        created_at,
        author:users!comments_author_id_fkey (
          id,
          full_name,
          profile_image
        )
      `)
      .single()

    if (error) {
      console.error('[COMMENT_CREATE] 댓글 생성 실패:', error)
      return NextResponse.json(
        { error: '댓글 작성에 실패했습니다.' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      message: '댓글이 성공적으로 작성되었습니다.',
      comment
    }, { status: 201 })

  } catch (error) {
    console.error('[COMMENT_CREATE] 서버 에러:', error)
    return NextResponse.json(
      { error: '서버 에러가 발생했습니다.' },
      { status: 500 }
    )
  }
}
