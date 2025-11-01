import { NextRequest, NextResponse } from 'next/server'
import { supabaseServer } from '@/lib/supabaseServer'

// 인기글/핫글 목록 조회
export async function GET(request: NextRequest) {
  try {
    if (!supabaseServer) {
      console.log('[POPULAR_POSTS] Supabase 미연결, 빈 배열 반환')
      return NextResponse.json({ posts: [] })
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
          nickname,
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
    let posts: any[] = []
    
    switch (filter) {
      case 'hot':
        // 1단계: is_hot = true인 게시글 조회 (공지사항 제외)
        const { data: hotPosts, error: hotError } = await supabaseServer
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
            is_notice,
            created_at,
            updated_at,
            category,
            user_id,
            gallery_id
          `)
          .eq('is_deleted', false)
          .eq('is_hot', true)
          .eq('is_notice', false)
          .order('created_at', { ascending: false })
          .limit(limit)
        
        if (hotError) {
          console.error('[POPULAR_POSTS] 핫글 조회 에러:', hotError)
        }
        
        console.log('[POPULAR_POSTS] 1단계 핫글:', hotPosts?.length || 0, '개')
        posts = hotPosts || []
        
        // 2단계: 부족하면 좋아요 많은 글로 채우기 (공지사항 제외)
        if (posts.length < limit) {
          const { data: popularPosts } = await supabaseServer
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
              is_notice,
              created_at,
              updated_at,
              category,
              user_id,
              gallery_id
            `)
            .eq('is_deleted', false)
            .eq('is_notice', false)
            .gt('like_count', 0)
            .order('like_count', { ascending: false })
            .limit(limit - posts.length)
          
          console.log('[POPULAR_POSTS] 2단계 좋아요:', popularPosts?.length || 0, '개')
          const existingIds = new Set(posts.map(p => p.id))
          const newPosts = (popularPosts || []).filter(p => !existingIds.has(p.id))
          posts = [...posts, ...newPosts]
        }
        
        // 3단계: 그래도 부족하면 조회수 많은 글로 채우기 (공지사항 제외)
        if (posts.length < limit) {
          const { data: viewedPosts } = await supabaseServer
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
              is_notice,
              created_at,
              updated_at,
              category,
              user_id,
              gallery_id
            `)
            .eq('is_deleted', false)
            .eq('is_notice', false)
            .order('view_count', { ascending: false })
            .limit(limit - posts.length)
          
          console.log('[POPULAR_POSTS] 3단계 조회수:', viewedPosts?.length || 0, '개')
          const existingIds = new Set(posts.map(p => p.id))
          const newPosts = (viewedPosts || []).filter(p => !existingIds.has(p.id))
          posts = [...posts, ...newPosts]
        }
        
        // 4단계: 그래도 부족하면 최근 게시글로 채우기 (최종 폴백, 공지사항 제외)
        if (posts.length < limit) {
          const { data: recentPosts } = await supabaseServer
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
              is_notice,
              created_at,
              updated_at,
              category,
              user_id,
              gallery_id
            `)
            .eq('is_deleted', false)
            .eq('is_notice', false)
            .order('created_at', { ascending: false })
            .limit(limit - posts.length)
          
          console.log('[POPULAR_POSTS] 4단계 최근글:', recentPosts?.length || 0, '개')
          const existingIds = new Set(posts.map(p => p.id))
          const newPosts = (recentPosts || []).filter(p => !existingIds.has(p.id))
          posts = [...posts, ...newPosts]
        }
        
        console.log(`[POPULAR_POSTS] 최종 조회: ${posts.length}개 (핫글 → 좋아요 → 조회수 → 최근글)`)
        break
        
      case 'popular':
        // is_popular 컬럼이 없으므로 like_count 기준으로 인기글 판단
        query = query.gt('like_count', 5)
        query = query.order('like_count', { ascending: false })
          .order('comment_count', { ascending: false })
          .order('created_at', { ascending: false })
          .range(offset, offset + limit - 1)
        
        const { data: popularResult } = await query
        posts = popularResult || []
        break
        
      case 'all':
        // is_popular 컬럼이 없으므로 is_hot 또는 like_count 기준으로 판단
        query = query.or('is_hot.eq.true,like_count.gt.5')
        query = query.order('is_hot', { ascending: false })
          .order('like_count', { ascending: false })
          .order('comment_count', { ascending: false })
          .order('created_at', { ascending: false })
          .range(offset, offset + limit - 1)
        
        const { data: allResult } = await query
        posts = allResult || []
        break
        
      default:
        query = query.eq('is_hot', true)
        query = query.order('created_at', { ascending: false })
          .range(offset, offset + limit - 1)
        
        const { data: defaultResult } = await query
        posts = defaultResult || []
    }

    const postsError = null // 에러는 각 단계에서 처리됨

    if (postsError) {
      console.error('[POPULAR_POSTS] 게시물 조회 오류:', postsError)
      // 에러가 있어도 빈 배열 반환
      return NextResponse.json({ posts: [], userVotes: {}, total: 0 })
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
    // 에러 발생 시에도 빈 배열 반환 (500 대신 200)
    return NextResponse.json({ posts: [], userVotes: {}, total: 0 })
  }
}
