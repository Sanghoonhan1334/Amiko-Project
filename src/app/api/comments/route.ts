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
        user_profiles!inner(display_name, avatar_url, is_korean),
        reactions(id)
      `)
      .eq('post_id', postId)
      .is('parent_id', null) // 대댓글 제외
      .order('created_at', { ascending: true })

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

    // 좋아요 수 계산
    const commentsWithCounts = comments?.map((comment: any) => ({
      ...comment,
      reaction_count: comment.reactions?.length || 0,
      reactions: undefined // 원본 데이터에서 제거
    }))

    return NextResponse.json({ comments: commentsWithCounts })

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

    // TODO: 실제 사용자 ID 가져오기 (현재는 목업)
    const userId = 'mock-user-id'

    const { data: comment, error } = await (supabaseServer as any)
      .from('comments')
      .insert({
        post_id: postId,
        user_id: userId,
        content,
        parent_id: parentId || null,
        language
      })
      .select(`
        *,
        user_profiles!inner(display_name, avatar_url, is_korean)
      `)
      .single()

    if (error) {
      console.error('[COMMENTS API] 생성 실패:', error)
      return NextResponse.json(
        { error: '댓글 생성에 실패했습니다.' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      comment: {
        ...comment,
        reaction_count: 0
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
