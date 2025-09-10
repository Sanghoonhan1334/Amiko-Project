import { NextRequest, NextResponse } from 'next/server'
import { supabaseServer } from '@/lib/supabaseServer'

// 게시물 목록 조회
export async function GET(request: NextRequest) {
  try {
    if (!supabaseServer) {
      return NextResponse.json(
        { error: '데이터베이스 연결이 설정되지 않았습니다.' },
        { status: 500 }
      )
    }

    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type') // question, story, freeboard, news
    const category = searchParams.get('category')
    const language = searchParams.get('language')
    const sort = searchParams.get('sort') || 'latest' // latest, popular, views
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
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
    if (category) {
      query = query.eq('category', category)
    }
    if (language) {
      query = query.eq('language', language)
    }

    // 정렬 적용
    switch (sort) {
      case 'latest':
        query = query.order('created_at', { ascending: false })
        break
      case 'popular':
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
      console.error('[POSTS API] 조회 실패:', error)
      return NextResponse.json(
        { error: '게시물 조회에 실패했습니다.' },
        { status: 500 }
      )
    }

    // 총 게시물 수 조회 (페이지네이션용)
    let countQuery = supabaseServer
      .from('posts')
      .select('id', { count: 'exact', head: true })

    if (type) countQuery = countQuery.eq('type', type)
    if (category) countQuery = countQuery.eq('category', category)
    if (language) countQuery = countQuery.eq('language', language)

    const { count, error: countError } = await countQuery

    if (countError) {
      console.error('[POSTS API] 카운트 조회 실패:', countError)
    }

    return NextResponse.json({
      posts: posts || [],
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit),
        hasMore: (count || 0) > offset + limit
      }
    })

  } catch (error) {
    console.error('[POSTS API] 오류:', error)
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}

// 새 게시물 생성
export async function POST(request: NextRequest) {
  try {
    if (!supabaseServer) {
      return NextResponse.json(
        { error: '데이터베이스 연결이 설정되지 않았습니다.' },
        { status: 500 }
      )
    }

    const { type, title, content, category, tags, language = 'ko' } = await request.json()

    // 입력 검증
    if (!type || !title || !content) {
      return NextResponse.json(
        { error: '필수 필드가 누락되었습니다.' },
        { status: 400 }
      )
    }

    if (!['question', 'story', 'freeboard', 'news'].includes(type)) {
      return NextResponse.json(
        { error: '잘못된 게시물 타입입니다.' },
        { status: 400 }
      )
    }

    // 실제 사용자 ID 가져오기 (Supabase Auth에서)
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

    // 게시물 생성
    const { data: post, error } = await supabaseServer
      .from('posts')
      .insert({
        user_id: user.id,
        type,
        title,
        content,
        category,
        tags: tags || [],
        language
      })
      .select(`
        *,
        user_profiles!inner(display_name, avatar_url, is_korean, level, badges)
      `)
      .single()

    if (error) {
      console.error('[POSTS API] 생성 실패:', error)
      return NextResponse.json(
        { error: '게시물 생성에 실패했습니다.' },
        { status: 500 }
      )
    }

    // 포인트 적립 (게시물 타입별로 다른 포인트)
    const pointAmount = type === 'freeboard' ? 2 : 5
    const pointDescription = type === 'freeboard' ? '자유게시판 게시물 작성' : 
                           type === 'question' ? '질문 게시물 작성' :
                           type === 'story' ? '스토리 게시물 작성' : '뉴스 게시물 작성'

    // 포인트 적립 함수 호출
    const { error: pointError } = await supabaseServer.rpc('add_points_with_limit', {
      p_user_id: user.id,
      p_type: `${type}_post`,
      p_amount: pointAmount,
      p_description: pointDescription,
      p_related_id: post.id,
      p_related_type: 'post'
    })

    if (pointError) {
      console.error('[POSTS API] 포인트 적립 실패:', pointError)
      // 포인트 적립 실패해도 게시물은 생성됨
    }

    return NextResponse.json({
      post: {
        ...post,
        comment_count: 0,
        like_count: 0
      }
    }, { status: 201 })

  } catch (error) {
    console.error('[POSTS API] 오류:', error)
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}
