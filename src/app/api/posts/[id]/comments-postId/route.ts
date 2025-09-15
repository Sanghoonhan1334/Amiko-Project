import { NextRequest, NextResponse } from 'next/server'
import { supabaseServer } from '@/lib/supabaseServer'

// 특정 게시물의 댓글 목록 조회
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    if (!supabaseServer) {
      return NextResponse.json(
        { error: '데이터베이스 연결이 설정되지 않았습니다.' },
        { status: 500 }
      )
    }

    const params = await context.params
    const postId = params.id
    const { searchParams } = new URL(request.url)
    const language = searchParams.get('language') || 'ko'

    // 댓글 조회 (답변만)
    const { data: comments, error } = await supabaseServer
      .from('comments')
      .select(`
        *,
        author:users!inner(id, full_name, profile_image)
      `)
      .eq('post_id', postId)
      .eq('is_deleted', false)
      .eq('language', language)
      .order('created_at', { ascending: true })

    if (error) {
      console.error('[POST_COMMENTS] 댓글 조회 실패:', error)
      return NextResponse.json(
        { error: '댓글 조회에 실패했습니다.' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      comments: comments || []
    })

  } catch (error) {
    console.error('[POST_COMMENTS] 서버 에러:', error)
    return NextResponse.json(
      { error: '서버 에러가 발생했습니다.' },
      { status: 500 }
    )
  }
}

// 특정 게시물에 댓글 생성 (답변)
export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    if (!supabaseServer) {
      return NextResponse.json(
        { error: '데이터베이스 연결이 설정되지 않았습니다.' },
        { status: 500 }
      )
    }

    const params = await context.params
    const postId = params.id
    const { content } = await request.json()

    // 입력 검증
    if (!content || !content.trim()) {
      return NextResponse.json(
        { error: '댓글 내용을 입력해주세요.' },
        { status: 400 }
      )
    }

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
        { error: '유효하지 않은 인증입니다.' },
        { status: 401 }
      )
    }

    // 댓글 생성
    const { data: comment, error } = await supabaseServer
      .from('comments')
      .insert({
        post_id: postId,
        author_id: user.id,
        content: content.trim(),
        language: 'ko',
        is_deleted: false
      } as any)
      .select(`
        *,
        author:users!inner(id, full_name, profile_image)
      `)
      .single()

    if (error) {
      console.error('[POST_COMMENTS] 댓글 생성 실패:', error)
      return NextResponse.json(
        { error: '댓글 작성에 실패했습니다.' },
        { status: 500 }
      )
    }

    console.log('[POST_COMMENTS] 댓글 생성 성공:', comment)

    return NextResponse.json({
      success: true,
      comment: comment
    })

  } catch (error) {
    console.error('[POST_COMMENTS] 서버 에러:', error)
    return NextResponse.json(
      { error: '서버 에러가 발생했습니다.' },
      { status: 500 }
    )
  }
}
