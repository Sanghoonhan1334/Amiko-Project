import { NextRequest, NextResponse } from 'next/server'
import { supabaseServer } from '@/lib/supabaseServer'

// 댓글 목록 조회
export async function GET(request: NextRequest) {
  try {
    if (!supabaseServer) {
      return NextResponse.json(
        { error: '데이터베이스 연결이 설정되지 않았습니다.' },
        { status: 500 }
      )
    }

    const { searchParams } = new URL(request.url)
    const postId = searchParams.get('postId')
    const language = searchParams.get('language')
    const includeReplies = searchParams.get('includeReplies') === 'true'

    if (!postId) {
      return NextResponse.json(
        { error: 'postId가 필요합니다.' },
        { status: 400 }
      )
    }

    let query = supabaseServer
      .from('comments')
      .select(`
        *,
        user_profiles!inner(display_name, avatar_url, is_korean, level, badges)
      `)
      .eq('post_id', postId)
      .eq('is_deleted', false)
      .order('created_at', { ascending: true })

    // 대댓글 포함 여부
    if (!includeReplies) {
      query = query.is('parent_id', null) // 대댓글 제외
    }

    if (language) {
      query = query.eq('language', language)
    }

    const { data: comments, error } = await query

    if (error) {
      console.error('[COMMENTS API] 조회 실패:', error)
      return NextResponse.json(
        { error: '댓글 조회에 실패했습니다.' },
        { status: 500 }
      )
    }

    return NextResponse.json({ comments: comments || [] })

  } catch (error) {
    console.error('[COMMENTS API] 오류:', error)
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}

// 새 댓글 생성
export async function POST(request: NextRequest) {
  try {
    if (!supabaseServer) {
      return NextResponse.json(
        { error: '데이터베이스 연결이 설정되지 않았습니다.' },
        { status: 500 }
      )
    }

    const { postId, content, parentId, language = 'ko' } = await request.json()

    // 입력 검증
    if (!postId || !content) {
      return NextResponse.json(
        { error: '필수 필드가 누락되었습니다.' },
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

    // 댓글 생성
    const { data: comment, error } = await (supabaseServer as any)
      .from('comments')
      .insert({
        post_id: postId,
        user_id: user.id,
        content,
        parent_id: parentId || null,
        language
      })
      .select(`
        *,
        user_profiles!inner(display_name, avatar_url, is_korean, level, badges)
      `)
      .single()

    if (error) {
      console.error('[COMMENTS API] 생성 실패:', error)
      return NextResponse.json(
        { error: '댓글 생성에 실패했습니다.' },
        { status: 500 }
      )
    }

    // 포인트 적립 (댓글 작성)
    const { error: pointError } = await (supabaseServer as any).rpc('add_points_with_limit', {
      p_user_id: user.id,
      p_type: 'comment',
      p_amount: 5,
      p_description: '댓글 작성',
      p_related_id: comment.id,
      p_related_type: 'comment'
    })

    if (pointError) {
      console.error('[COMMENTS API] 포인트 적립 실패:', pointError)
      // 포인트 적립 실패해도 댓글은 생성됨
    }

    return NextResponse.json({
      comment: {
        ...comment,
        like_count: 0
      }
    }, { status: 201 })

  } catch (error) {
    console.error('[COMMENTS API] 오류:', error)
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}
