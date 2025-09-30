import { NextRequest, NextResponse } from 'next/server'
import { supabaseServer } from '@/lib/supabaseServer'

// 특정 게시물 조회
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

    console.log('[POST_DETAIL] 게시물 조회 시작:', id)

    // 게시물 조회 (삭제되지 않은 것만)
    const { data: post, error } = await supabaseServer
      .from('gallery_posts')
      .select(`
        id,
        title,
        content,
        images,
        view_count,
        like_count,
        dislike_count,
        comment_count,
        is_pinned,
        is_hot,
        created_at,
        updated_at,
        user:users!gallery_posts_user_id_fkey (
          id,
          full_name,
          avatar_url
        ),
        gallery:galleries!gallery_posts_gallery_id_fkey (
          id,
          slug,
          name_ko,
          icon,
          color
        )
      `)
      .eq('id', id)
      .eq('is_deleted', false)
      .single()

    if (error || !post) {
      console.error('[POST_DETAIL] 게시물 조회 실패:', error)
      return NextResponse.json(
        { error: '게시물을 찾을 수 없습니다.' },
        { status: 404 }
      )
    }

    // 조회수 증가
    await supabaseServer
      .from('gallery_posts')
      .update({ view_count: post.view_count + 1 })
      .eq('id', id)

    console.log('[POST_DETAIL] 게시물 조회 성공:', post.title)

    return NextResponse.json({
      success: true,
      post: {
        ...post,
        view_count: post.view_count + 1 // 증가된 조회수 반영
      }
    })

  } catch (error) {
    console.error('[POST_DETAIL] 게시물 조회 오류:', error)
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}

// 게시물 수정
export async function PUT(
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
    const { title, content, images } = body

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

    console.log('[POST_UPDATE] 게시물 수정 시작:', { id, userId: authUser.id })

    // 게시물 소유자 확인
    const { data: existingPost, error: fetchError } = await supabaseServer
      .from('gallery_posts')
      .select('user_id')
      .eq('id', id)
      .single()

    if (fetchError || !existingPost) {
      return NextResponse.json(
        { error: '게시물을 찾을 수 없습니다.' },
        { status: 404 }
      )
    }

    if (existingPost.user_id !== authUser.id) {
      return NextResponse.json(
        { error: '게시물을 수정할 권한이 없습니다.' },
        { status: 403 }
      )
    }

    // 게시물 수정
    const { data: updatedPost, error: updateError } = await supabaseServer
      .from('gallery_posts')
      .update({
        title,
        content,
        images: images || [],
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select(`
        id,
        title,
        content,
        images,
        view_count,
        like_count,
        dislike_count,
        comment_count,
        is_pinned,
        is_hot,
        created_at,
        updated_at,
        user:users!gallery_posts_user_id_fkey (
          id,
          full_name,
          avatar_url
        )
      `)
      .single()

    if (updateError) {
      console.error('[POST_UPDATE] 게시물 수정 실패:', updateError)
      return NextResponse.json(
        { error: '게시물 수정에 실패했습니다.' },
        { status: 500 }
      )
    }

    console.log('[POST_UPDATE] 게시물 수정 성공:', updatedPost.title)

    return NextResponse.json({
      success: true,
      post: updatedPost
    })

  } catch (error) {
    console.error('[POST_UPDATE] 게시물 수정 오류:', error)
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}

// 게시물 삭제
export async function DELETE(
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

    console.log('[POST_DELETE] 게시물 삭제 시작:', { id, userId: authUser.id })

    // 게시물 소유자 확인
    const { data: existingPost, error: fetchError } = await supabaseServer
      .from('gallery_posts')
      .select('user_id, gallery_id')
      .eq('id', id)
      .single()

    if (fetchError || !existingPost) {
      return NextResponse.json(
        { error: '게시물을 찾을 수 없습니다.' },
        { status: 404 }
      )
    }

    // 운영자 권한 확인
    const adminEmails = ['admin@amiko.com', 'editor@amiko.com', 'manager@amiko.com']
    const adminIds = ['66623263-4c1d-4dce-85a7-cc1b21d01f70']
    const isAdmin = adminEmails.includes(authUser.email) || adminIds.includes(authUser.id)

    // 작성자이거나 운영자만 삭제 가능
    if (existingPost.user_id !== authUser.id && !isAdmin) {
      return NextResponse.json(
        { error: '게시물을 삭제할 권한이 없습니다.' },
        { status: 403 }
      )
    }

    console.log('[POST_DELETE] 삭제 권한 확인:', { 
      isAuthor: existingPost.user_id === authUser.id, 
      isAdmin,
      deletedBy: isAdmin ? 'admin' : 'author'
    })

    // 게시물 삭제 (소프트 삭제)
    const { error: deleteError } = await supabaseServer
      .from('gallery_posts')
      .update({ is_deleted: true })
      .eq('id', id)

    if (deleteError) {
      console.error('[POST_DELETE] 게시물 삭제 실패:', deleteError)
      return NextResponse.json(
        { error: '게시물 삭제에 실패했습니다.' },
        { status: 500 }
      )
    }

    // 갤러리의 게시물 수 감소
    await supabaseServer.rpc('decrement_gallery_post_count', {
      gallery_id: existingPost.gallery_id
    })

    console.log('[POST_DELETE] 게시물 삭제 성공:', id)

    return NextResponse.json({
      success: true,
      message: '게시물이 삭제되었습니다.'
    })

  } catch (error) {
    console.error('[POST_DELETE] 게시물 삭제 오류:', error)
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}