import { NextRequest, NextResponse } from 'next/server'
import { supabaseServer } from '@/lib/supabaseServer'

// 인기글/핫글 목록 조회
export async function GET(request: NextRequest) {
  try {
    if (!supabaseServer) {
      return NextResponse.json(
        { error: '데이터베이스 연결이 설정되지 않았습니다.' },
        { status: 500 }
      )
    }

    const { searchParams } = new URL(request.url)
    const filter = searchParams.get('filter') || 'hot'
    const limit = parseInt(searchParams.get('limit') || '20')
    const offset = parseInt(searchParams.get('offset') || '0')

    console.log('[POPULAR_POSTS] 인기글 조회:', { filter, limit, offset })

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
      .eq('is_deleted', false)

    // 필터에 따른 조건 추가
    switch (filter) {
      case 'hot':
        query = query.eq('is_hot', true)
        break
      case 'popular':
        // is_popular 컬럼이 없으므로 like_count 기준으로 인기글 판단
        query = query.gt('like_count', 5)
        break
      case 'all':
        // is_popular 컬럼이 없으므로 is_hot 또는 like_count 기준으로 판단
        query = query.or('is_hot.eq.true,like_count.gt.5')
        break
      default:
        query = query.eq('is_hot', true)
    }

    // 정렬: 핫글 우선, 그 다음 인기도 순
    query = query.order('is_hot', { ascending: false })
      .order('is_pinned', { ascending: false })
      .order('like_count', { ascending: false })
      .order('comment_count', { ascending: false })
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    const { data: posts, error: postsError } = await query

    if (postsError) {
      console.error('[POPULAR_POSTS] 게시물 조회 오류:', postsError)
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

    console.log(`[POPULAR_POSTS] 조회 완료: ${posts?.length || 0}개 게시물`)

    return NextResponse.json({
      success: true,
      posts: posts || [],
      userVotes,
      filter,
      total: posts?.length || 0
    })

  } catch (error) {
    console.error('[POPULAR_POSTS] 인기글 조회 오류:', error)
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}
