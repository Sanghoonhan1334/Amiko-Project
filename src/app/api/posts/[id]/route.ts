import { NextRequest, NextResponse } from 'next/server'
import { supabaseServer } from '@/lib/supabaseServer'

// 개별 게시글 조회
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

    // 게시글 조회
    const { data: post, error } = await supabaseServer
      .from('posts')
      .select(`
        id,
        title,
        content,
        is_notice,
        is_survey,
        is_verified,
        is_pinned,
        view_count,
        like_count,
        dislike_count,
        comment_count,
        created_at,
        updated_at,
        author:users!posts_author_id_fkey (
          id,
          name,
          profile_image
        ),
        category:board_categories!posts_category_id_fkey (
          id,
          name
        )
      `)
      .eq('id', postId)
      .eq('status', 'published')
      .single()

    if (error || !post) {
      return NextResponse.json(
        { error: '게시글을 찾을 수 없습니다.' },
        { status: 404 }
      )
    }

    // 조회수 증가 (비동기)
    const clientIp = request.headers.get('x-forwarded-for') || 
                   request.headers.get('x-real-ip') || 
                   '127.0.0.1'
    
    // 인증된 사용자인지 확인
    const authHeader = request.headers.get('authorization')
    let userId = null
    if (authHeader) {
      const token = authHeader.replace('Bearer ', '')
      const { data: { user } } = await supabaseServer.auth.getUser(token)
      userId = user?.id || null
    }

    // 조회수 증가 함수 호출
    await supabaseServer.rpc('increment_post_view_count', {
      post_uuid: postId,
      user_uuid: userId,
      user_ip: clientIp
    })

    return NextResponse.json({ post })

  } catch (error) {
    console.error('[POST_GET] 서버 에러:', error)
    return NextResponse.json(
      { error: '서버 에러가 발생했습니다.' },
      { status: 500 }
    )
  }
}

// 게시글 수정
export async function PUT(
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
    const { title, content, category_name, is_notice, is_survey } = body

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

    // 게시글 존재 및 권한 확인
    const { data: existingPost, error: fetchError } = await supabaseServer
      .from('posts')
      .select('author_id')
      .eq('id', postId)
      .eq('status', 'published')
      .single()

    if (fetchError || !existingPost) {
      return NextResponse.json(
        { error: '게시글을 찾을 수 없습니다.' },
        { status: 404 }
      )
    }

    if (existingPost.author_id !== user.id) {
      return NextResponse.json(
        { error: '게시글을 수정할 권한이 없습니다.' },
        { status: 403 }
      )
    }

    // 입력 검증
    if (!title || !content) {
      return NextResponse.json(
        { error: '제목과 내용을 입력해주세요.' },
        { status: 400 }
      )
    }

    if (title.length > 200) {
      return NextResponse.json(
        { error: '제목은 200자 이하로 입력해주세요.' },
        { status: 400 }
      )
    }

    if (content.length > 10000) {
      return NextResponse.json(
        { error: '내용은 10,000자 이하로 입력해주세요.' },
        { status: 400 }
      )
    }

    // 카테고리 ID 조회
    let category_id = null
    if (category_name) {
      const { data: category } = await supabaseServer
        .from('board_categories')
        .select('id')
        .eq('name', category_name)
        .eq('is_active', true)
        .single()

      category_id = category?.id || null
    }

    // 게시글 수정
    const { data: post, error } = await supabaseServer
      .from('posts')
      .update({
        title,
        content,
        category_id,
        is_notice: is_notice || false,
        is_survey: is_survey || false,
        updated_at: new Date().toISOString()
      })
      .eq('id', postId)
      .select(`
        id,
        title,
        content,
        is_notice,
        is_survey,
        is_verified,
        is_pinned,
        view_count,
        like_count,
        dislike_count,
        comment_count,
        created_at,
        updated_at,
        author:users!posts_author_id_fkey (
          id,
          name,
          profile_image
        ),
        category:board_categories!posts_category_id_fkey (
          id,
          name
        )
      `)
      .single()

    if (error) {
      console.error('[POST_UPDATE] 게시글 수정 실패:', error)
      return NextResponse.json(
        { error: '게시글 수정에 실패했습니다.' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      message: '게시글이 성공적으로 수정되었습니다.',
      post
    })

  } catch (error) {
    console.error('[POST_UPDATE] 서버 에러:', error)
    return NextResponse.json(
      { error: '서버 에러가 발생했습니다.' },
      { status: 500 }
    )
  }
}

// 게시글 삭제
export async function DELETE(
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

    // 게시글 존재 및 권한 확인
    const { data: existingPost, error: fetchError } = await supabaseServer
      .from('posts')
      .select('author_id')
      .eq('id', postId)
      .eq('status', 'published')
      .single()

    if (fetchError || !existingPost) {
      return NextResponse.json(
        { error: '게시글을 찾을 수 없습니다.' },
        { status: 404 }
      )
    }

    if (existingPost.author_id !== user.id) {
      return NextResponse.json(
        { error: '게시글을 삭제할 권한이 없습니다.' },
        { status: 403 }
      )
    }

    // 게시글 삭제 (소프트 삭제)
    const { error } = await supabaseServer
      .from('posts')
      .update({ status: 'deleted' })
      .eq('id', postId)

    if (error) {
      console.error('[POST_DELETE] 게시글 삭제 실패:', error)
      return NextResponse.json(
        { error: '게시글 삭제에 실패했습니다.' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      message: '게시글이 성공적으로 삭제되었습니다.'
    })

  } catch (error) {
    console.error('[POST_DELETE] 서버 에러:', error)
    return NextResponse.json(
      { error: '서버 에러가 발생했습니다.' },
      { status: 500 }
    )
  }
}