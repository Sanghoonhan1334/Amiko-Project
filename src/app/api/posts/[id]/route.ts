import { NextRequest, NextResponse } from 'next/server'
import { supabaseServer } from '@/lib/supabaseServer'

// 개별 게시글 조회
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

    const postId = params.id
    console.log('[POST_GET] 개별 게시글 조회:', postId)

    // 게시글 조회
    const { data: post, error: postError } = await supabaseServer
      .from('gallery_posts')
      .select(`
        id,
        title,
        content,
        images,
        category,
        view_count,
        like_count,
        dislike_count,
        comment_count,
        is_pinned,
        is_hot,
        created_at,
        updated_at,
        user_id,
        gallery_id
      `)
      .eq('id', postId)
      .eq('is_deleted', false)
      .single()

    if (postError) {
      console.error('[POST_GET] 게시글 조회 실패:', postError)
      return NextResponse.json(
        { error: '게시글을 찾을 수 없습니다.' },
        { status: 404 }
      )
    }

    if (!post) {
      return NextResponse.json(
        { error: '게시글을 찾을 수 없습니다.' },
        { status: 404 }
      )
    }

    // 조회수 증가
    await supabaseServer
      .from('gallery_posts')
      .update({ view_count: (post.view_count || 0) + 1 })
      .eq('id', postId)

    // 사용자 정보 조회
    let author = null
    if (post.user_id) {
      const { data: userData } = await supabaseServer
        .from('users')
        .select('id, full_name, nickname, profile_image, avatar_url')
        .eq('id', post.user_id)
        .single()
      
      if (userData) {
        author = {
          id: userData.id,
          full_name: userData.full_name || '익명',
          nickname: userData.nickname,
          profile_image: userData.profile_image || userData.avatar_url
        }
      }
    }

    // 갤러리 정보 조회
    let gallery = null
    if (post.gallery_id) {
      const { data: galleryData } = await supabaseServer
        .from('galleries')
        .select('id, slug, name_ko, name_es')
        .eq('id', post.gallery_id)
        .single()
      
      if (galleryData) {
        gallery = galleryData
      }
    }

    // 응답 데이터 구성
    const responseData = {
      id: post.id,
      title: post.title,
      content: post.content,
      images: post.images || [],
      category: post.category || '자유게시판',
      view_count: (post.view_count || 0) + 1, // 증가된 조회수
      like_count: post.like_count || 0,
      dislike_count: post.dislike_count || 0,
      comment_count: post.comment_count || 0,
      is_pinned: post.is_pinned || false,
      is_hot: post.is_hot || false,
      created_at: post.created_at,
      updated_at: post.updated_at,
      author: author || {
        id: post.user_id || 'unknown',
        full_name: '익명',
        profile_image: null
      },
      gallery: gallery || {
        id: post.gallery_id || 'unknown',
        slug: 'free',
        name_ko: '자유게시판',
        name_es: 'Foro Libre'
      }
    }

    console.log('[POST_GET] 게시글 조회 성공:', {
      id: responseData.id,
      title: responseData.title,
      author: responseData.author.full_name,
      gallery: responseData.gallery.name_ko
    })

    return NextResponse.json({
      success: true,
      post: responseData
    })

  } catch (error) {
    console.error('[POST_GET] 서버 오류:', error)
    return NextResponse.json(
      { error: '게시글 조회에 실패했습니다.' },
      { status: 500 }
    )
  }
}

// 게시글 수정
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

    const postId = params.id
    const body = await request.json()
    const { title, content, images, category } = body

    console.log('[POST_PUT] 게시글 수정:', { postId, title: title?.substring(0, 50) })

    // 게시글 수정
    const { data: updatedPost, error: updateError } = await supabaseServer
      .from('gallery_posts')
      .update({
        title: title?.trim(),
        content: content?.trim(),
        images: images || [],
        category: category || '자유게시판',
        updated_at: new Date().toISOString()
      })
      .eq('id', postId)
      .eq('is_deleted', false)
      .select('id, title, updated_at')
      .single()

    if (updateError) {
      console.error('[POST_PUT] 게시글 수정 실패:', updateError)
      return NextResponse.json(
        { error: '게시글 수정에 실패했습니다.' },
        { status: 500 }
      )
    }

    console.log('[POST_PUT] 게시글 수정 성공:', updatedPost)

    return NextResponse.json({
      success: true,
      post: updatedPost,
      message: '게시글이 성공적으로 수정되었습니다.'
    })

  } catch (error) {
    console.error('[POST_PUT] 서버 오류:', error)
    return NextResponse.json(
      { error: '게시글 수정에 실패했습니다.' },
      { status: 500 }
    )
  }
}

// 게시글 삭제
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

    const postId = params.id
    console.log('[POST_DELETE] 게시글 삭제:', postId)

    // 게시글 삭제 (소프트 삭제)
    const { data: deletedPost, error: deleteError } = await supabaseServer
      .from('gallery_posts')
      .update({
        is_deleted: true,
        updated_at: new Date().toISOString()
      })
      .eq('id', postId)
      .select('id, title')
      .single()

    if (deleteError) {
      console.error('[POST_DELETE] 게시글 삭제 실패:', deleteError)
      return NextResponse.json(
        { error: '게시글 삭제에 실패했습니다.' },
        { status: 500 }
      )
    }

    console.log('[POST_DELETE] 게시글 삭제 성공:', deletedPost)

    return NextResponse.json({
      success: true,
      message: '게시글이 성공적으로 삭제되었습니다.'
    })

  } catch (error) {
    console.error('[POST_DELETE] 서버 오류:', error)
    return NextResponse.json(
      { error: '게시글 삭제에 실패했습니다.' },
      { status: 500 }
    )
  }
}