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
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const offset = (page - 1) * limit

    let query = supabaseServer
      .from('posts')
      .select(`
        *,
        user_profiles!inner(display_name, avatar_url, is_korean),
        comments(id),
        reactions(id)
      `)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

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

    const { data: posts, error } = await query

    if (error) {
      console.error('[POSTS API] 조회 실패:', error)
      return NextResponse.json(
        { error: '게시물 조회에 실패했습니다.' },
        { status: 500 }
      )
    }

    // 댓글 수와 좋아요 수 계산
    const postsWithCounts = posts?.map(post => ({
      ...post,
      comment_count: post.comments?.length || 0,
      reaction_count: post.reactions?.length || 0,
      comments: undefined, // 원본 데이터에서 제거
      reactions: undefined // 원본 데이터에서 제거
    }))

    return NextResponse.json({
      posts: postsWithCounts,
      pagination: {
        page,
        limit,
        hasMore: postsWithCounts?.length === limit
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

    // TODO: 실제 사용자 ID 가져오기 (현재는 목업)
    const userId = 'mock-user-id'

    const { data: post, error } = await supabaseServer
      .from('posts')
      .insert({
        user_id: userId,
        type,
        title,
        content,
        category,
        tags: tags || [],
        language
      })
      .select(`
        *,
        user_profiles!inner(display_name, avatar_url, is_korean)
      `)
      .single()

    if (error) {
      console.error('[POSTS API] 생성 실패:', error)
      return NextResponse.json(
        { error: '게시물 생성에 실패했습니다.' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      post: {
        ...post,
        comment_count: 0,
        reaction_count: 0
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
