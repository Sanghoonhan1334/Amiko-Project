import { NextRequest, NextResponse } from 'next/server'
import { supabaseServer } from '@/lib/supabaseServer'

export async function GET(request: NextRequest) {
  try {
    if (!supabaseServer) {
      return NextResponse.json(
        { error: '데이터베이스 연결이 설정되지 않았습니다.' },
        { status: 500 }
      )
    }

    const { searchParams } = new URL(request.url)
    const sort = searchParams.get('sort') || 'latest'
    const type = searchParams.get('type')
    const tag = searchParams.get('tag')
    const userId = searchParams.get('userId')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const offset = (page - 1) * limit

    let query = supabaseServer
      .from('posts')
      .select(`
        *,
        user_profiles!inner(display_name, avatar_url, is_korean, level, badges)
      `)

    // 필터 적용
    if (type) {
      query = query.eq('type', type)
    }
    if (tag) {
      query = query.contains('tags', [tag])
    }
    if (userId) {
      query = query.eq('user_id', userId)
    }

    // 추천글의 경우 3일 이내 글만 표시
    if (sort === 'recommended') {
      const threeDaysAgo = new Date()
      threeDaysAgo.setDate(threeDaysAgo.getDate() - 3)
      query = query.gte('created_at', threeDaysAgo.toISOString())
    }

    // 정렬 적용
    switch (sort) {
      case 'latest':
        query = query.order('created_at', { ascending: false })
        break
      case 'popular':
        query = query.order('like_count', { ascending: false })
        break
      case 'recommended':
        // 추천 알고리즘: 좋아요 * 3 + 조회수 * 0.2 + 댓글수 * 2
        query = query.order('like_count', { ascending: false })
        break
      case 'views':
        query = query.order('view_count', { ascending: false })
        break
      case 'comments':
        query = query.order('comment_count', { ascending: false })
        break
      default:
        query = query.order('created_at', { ascending: false })
    }

    // 페이지네이션 적용
    query = query.range(offset, offset + limit - 1)

    const { data: posts, error } = await query

    if (error) {
      console.error('[FEED API] 조회 실패:', error)
      return NextResponse.json(
        { error: '피드 조회에 실패했습니다.' },
        { status: 500 }
      )
    }

    // 총 게시물 수 조회 (페이지네이션용)
    let countQuery = supabaseServer
      .from('posts')
      .select('id', { count: 'exact', head: true })

    if (type) countQuery = countQuery.eq('type', type)
    if (tag) countQuery = countQuery.contains('tags', [tag])
    if (userId) countQuery = countQuery.eq('user_id', userId)

    const { count, error: countError } = await countQuery

    if (countError) {
      console.error('[FEED API] 카운트 조회 실패:', countError)
    }

    // 데이터 포맷 변환 (기존 목업 데이터 형식과 호환)
    const formattedData = posts?.map((post: any) => ({
      id: post.id,
      type: post.type,
      title: post.title,
      content: post.content,
      preview: post.content.length > 100 ? post.content.substring(0, 100) + '...' : post.content,
      author: post.user_profiles?.display_name || '익명',
      authorType: post.user_profiles?.is_korean ? 'korean' : 'latin',
      tags: post.tags || [],
      likes: post.like_count || 0,
      views: post.view_count || 0,
      comments: post.comment_count || 0,
      created_at: post.created_at,
      is_solved: post.is_solved,
      is_best: post.is_best,
      is_notice: post.is_notice,
      is_pinned: post.is_pinned,
      user_profile: {
        display_name: post.user_profiles?.display_name,
        avatar_url: post.user_profiles?.avatar_url,
        is_korean: post.user_profiles?.is_korean,
        level: post.user_profiles?.level,
        badges: post.user_profiles?.badges || []
      }
    })) || []

    return NextResponse.json({
      data: formattedData,
      page,
      limit,
      total: count || 0,
      totalPages: Math.ceil((count || 0) / limit),
      hasMore: (count || 0) > offset + limit
    })

  } catch (error) {
    console.error('[FEED API] 오류:', error)
    return NextResponse.json(
      { error: '피드 조회 중 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    if (!supabaseServer) {
      return NextResponse.json(
        { error: '데이터베이스 연결이 설정되지 않았습니다.' },
        { status: 500 }
      )
    }

    const { period = 'weekly' } = await request.json()

    // 주간/월간 하이라이트 게시물 조회
    let dateFilter = ''
    if (period === 'weekly') {
      dateFilter = 'created_at >= NOW() - INTERVAL \'7 days\''
    } else if (period === 'monthly') {
      dateFilter = 'created_at >= NOW() - INTERVAL \'30 days\''
    }

    const { data: highlights, error } = await supabaseServer
      .from('posts')
      .select(`
        *,
        user_profiles!inner(display_name, avatar_url, is_korean, level, badges)
      `)
      .eq('is_best', true)
      .order('like_count', { ascending: false })
      .limit(10)

    if (error) {
      console.error('[FEED API] 하이라이트 조회 실패:', error)
      return NextResponse.json(
        { error: '하이라이트 조회에 실패했습니다.' },
        { status: 500 }
      )
    }

    // 데이터 포맷 변환
    const formattedHighlights = highlights?.map((post: any) => ({
      id: post.id,
      ref_type: post.type,
      ref_id: post.id,
      period: period,
      [post.type]: {
        id: post.id,
        type: post.type,
        title: post.title,
        content: post.content,
        author: post.user_profiles?.display_name || '익명',
        authorType: post.user_profiles?.is_korean ? 'korean' : 'latin',
        tags: post.tags || [],
        likes: post.like_count || 0,
        views: post.view_count || 0,
        comments: post.comment_count || 0,
        created_at: post.created_at,
        user_profile: {
          display_name: post.user_profiles?.display_name,
          avatar_url: post.user_profiles?.avatar_url,
          is_korean: post.user_profiles?.is_korean,
          level: post.user_profiles?.level,
          badges: post.user_profiles?.badges || []
        }
      }
    })) || []

    return NextResponse.json({
      highlights: formattedHighlights
    })

  } catch (error) {
    console.error('[FEED API] POST 오류:', error)
    return NextResponse.json(
      { error: '피드 데이터 처리 중 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}
