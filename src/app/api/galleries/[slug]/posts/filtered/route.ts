import { NextRequest, NextResponse } from 'next/server'
import { supabaseServer } from '@/lib/supabaseServer'

// 필터링된 게시물 목록 조회
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

    const gallerySlug = params.slug
    const { searchParams } = new URL(request.url)
    
    // 필터 파라미터 추출
    const sortBy = searchParams.get('sortBy') || 'latest'
    const timeRange = searchParams.get('timeRange') || 'all'
    const postType = searchParams.get('postType') || 'all'
    const status = searchParams.get('status') || 'all'
    const searchQuery = searchParams.get('searchQuery') || ''
    const limit = parseInt(searchParams.get('limit') || '20')
    const offset = parseInt(searchParams.get('offset') || '0')

    console.log('[FILTERED_POSTS] 필터링된 게시물 조회:', {
      gallerySlug,
      sortBy,
      timeRange,
      postType,
      status,
      searchQuery: searchQuery.substring(0, 20) + '...',
      limit,
      offset
    })

    // 갤러리 존재 확인
    const { data: gallery, error: galleryError } = await supabaseServer
      .from('galleries')
      .select('id, slug, name_ko')
      .eq('slug', gallerySlug)
      .eq('is_active', true)
      .single()

    if (galleryError || !gallery) {
      return NextResponse.json(
        { error: '갤러리를 찾을 수 없습니다.' },
        { status: 404 }
      )
    }

    // 기본 쿼리 구성
    let query = supabaseServer
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
        user:users (
          id,
          full_name,
          avatar_url
        )
      `)
      .eq('gallery_id', gallery.id)
      .eq('is_deleted', false)

    // 시간 범위 필터
    if (timeRange !== 'all') {
      const now = new Date()
      let startDate: Date

      switch (timeRange) {
        case 'today':
          startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate())
          break
        case 'week':
          startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
          break
        case 'month':
          startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
          break
        default:
          startDate = new Date(0)
      }

      query = query.gte('created_at', startDate.toISOString())
    }

    // 게시물 타입 필터
    if (postType === 'with_images') {
      query = query.not('images', 'is', null)
      query = query.gt('images', '{}')
    } else if (postType === 'text_only') {
      query = query.or('images.is.null,images.eq.{}')
    }

    // 상태 필터
    if (status === 'hot') {
      query = query.eq('is_hot', true)
    } else if (status === 'popular') {
      // is_popular 컬럼이 없으므로 like_count 기준으로 인기글 판단
      query = query.gt('like_count', 5)
    } else if (status === 'pinned') {
      query = query.eq('is_pinned', true)
    }

    // 검색 필터
    if (searchQuery.trim()) {
      query = query.or(`title.ilike.%${searchQuery}%,content.ilike.%${searchQuery}%`)
    }

    // 정렬
    switch (sortBy) {
      case 'latest':
        query = query.order('created_at', { ascending: false })
        break
      case 'popular':
        query = query.order('like_count', { ascending: false })
        break
      case 'hot':
        query = query.order('is_hot', { ascending: false })
        break
      case 'most_commented':
        query = query.order('comment_count', { ascending: false })
        break
      case 'most_viewed':
        query = query.order('view_count', { ascending: false })
        break
      default:
        query = query.order('created_at', { ascending: false })
    }

    // 고정글 우선 정렬 (핫글 정렬이 아닌 경우)
    if (sortBy !== 'hot') {
      query = query.order('is_pinned', { ascending: false })
    }

    // 페이지네이션
    query = query.range(offset, offset + limit - 1)

    const { data: posts, error: postsError } = await query

    if (postsError) {
      console.error('[FILTERED_POSTS] 게시물 조회 오류:', postsError)
      return NextResponse.json(
        { error: '게시물을 조회하는데 실패했습니다.' },
        { status: 500 }
      )
    }

    // 사용자 투표 정보 조회 (인증된 경우)
    const authHeader = request.headers.get('Authorization')
    let userVotes: Record<string, 'like' | 'dislike' | null> = {}

    if (authHeader) {
      const token = authHeader.replace('Bearer ', '')
      const { data: { user: authUser }, error: authError } = await supabaseServer.auth.getUser(token)
      
      if (!authError && authUser && posts && posts.length > 0) {
        const postIds = posts.map(post => post.id)
        
        const { data: votes, error: votesError } = await supabaseServer
          .from('gallery_votes')
          .select('post_id, vote_type')
          .eq('user_id', authUser.id)
          .in('post_id', postIds)

        if (!votesError && votes) {
          userVotes = votes.reduce((acc, vote) => {
            acc[vote.post_id] = vote.vote_type as 'like' | 'dislike'
            return acc
          }, {} as Record<string, 'like' | 'dislike' | null>)
        }
      }
    }

    console.log(`[FILTERED_POSTS] 조회 완료: ${posts?.length || 0}개 게시물`)

    return NextResponse.json({
      success: true,
      posts: posts || [],
      userVotes,
      gallery: {
        id: gallery.id,
        slug: gallery.slug,
        name_ko: gallery.name_ko
      },
      filters: {
        sortBy,
        timeRange,
        postType,
        status,
        searchQuery
      },
      total: posts?.length || 0
    })

  } catch (error) {
    console.error('[FILTERED_POSTS] 필터링된 게시물 조회 오류:', error)
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}
