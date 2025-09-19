import { NextRequest, NextResponse } from 'next/server'
import { supabaseServer } from '@/lib/supabaseServer'

// 특정 갤러리의 게시물 목록 조회
export async function GET(
  request: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    if (!supabaseServer) {
      return NextResponse.json(
        { error: '데이터베이스 연결이 설정되지 않았습니다.' },
        { status: 500 }
      )
    }

    const { slug } = params
    const { searchParams } = new URL(request.url)
    const sortBy = searchParams.get('sort') || 'latest'
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')

    console.log('[GALLERY_POSTS] 게시물 조회 시작:', { slug, sortBy, page, limit })

    // 먼저 갤러리 정보 조회
    const { data: gallery, error: galleryError } = await supabaseServer
      .from('galleries')
      .select('id, slug, name_ko, icon, color')
      .eq('slug', slug)
      .eq('is_active', true)
      .single()

    if (galleryError || !gallery) {
      console.error('[GALLERY_POSTS] 갤러리 조회 실패:', galleryError)
      return NextResponse.json(
        { error: '갤러리를 찾을 수 없습니다.' },
        { status: 404 }
      )
    }

    // 정렬 옵션 설정
    let orderBy = 'created_at'
    let ascending = false

    switch (sortBy) {
      case 'popular':
        orderBy = 'like_count'
        break
      case 'hot':
        orderBy = 'comment_count'
        break
      case 'latest':
      default:
        orderBy = 'created_at'
        break
    }

    // 게시물 조회 (삭제되지 않은 것만)
    const { data: posts, error: postsError } = await supabaseServer
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
        )
      `)
      .eq('gallery_id', gallery.id)
      .eq('is_deleted', false)
      .order('is_pinned', { ascending: false }) // 고정글을 맨 위로
      .order(orderBy, { ascending })

    if (postsError) {
      console.error('[GALLERY_POSTS] 게시물 조회 실패:', postsError)
      return NextResponse.json(
        { error: '게시물을 불러오는데 실패했습니다.' },
        { status: 500 }
      )
    }

    console.log('[GALLERY_POSTS] 게시물 조회 성공:', posts?.length || 0, '개')

    return NextResponse.json({
      success: true,
      gallery,
      posts: posts || [],
      pagination: {
        page,
        limit,
        total: posts?.length || 0,
        hasMore: (posts?.length || 0) >= limit
      }
    })

  } catch (error) {
    console.error('[GALLERY_POSTS] 게시물 조회 오류:', error)
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}
