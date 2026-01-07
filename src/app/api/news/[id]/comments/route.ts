import { NextRequest, NextResponse } from 'next/server'
import { supabaseServer } from '@/lib/supabaseServer'

// K-매거진 뉴스 댓글 조회
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: newsId } = await params
    
    console.log('[NEWS_COMMENTS_GET] 댓글 조회:', newsId)
    
    if (!supabaseServer) {
      return NextResponse.json(
        { error: '데이터베이스 연결이 설정되지 않았습니다.' },
        { status: 500 }
      )
    }

    // 1. 뉴스가 존재하는지 확인
    const { data: news, error: newsError } = await supabaseServer
      .from('korean_news')
      .select('id, title')
      .eq('id', newsId)
      .single()

    if (newsError || !news) {
      console.error('[NEWS_COMMENTS_GET] 뉴스를 찾을 수 없음:', newsError)
      return NextResponse.json(
        { error: '뉴스를 찾을 수 없습니다.' },
        { status: 404 }
      )
    }

    // 2. 댓글 조회 (korean_news에 연결된 댓글)
    const { data: comments, error: commentsError } = await supabaseServer
      .from('comments')
      .select(`
        id,
        content,
        like_count,
        dislike_count,
        created_at,
        updated_at,
        parent_id,
        is_deleted,
        author_id
      `)
      .eq('post_id', newsId)
      .eq('is_deleted', false)
      .order('created_at', { ascending: true })

    if (commentsError) {
      console.error('[NEWS_COMMENTS_GET] 댓글 조회 오류:', commentsError)
      return NextResponse.json(
        { error: '댓글을 조회할 수 없습니다.' },
        { status: 500 }
      )
    }

    // 사용자 정보를 별도로 조회하여 추가
    if (comments && comments.length > 0) {
      const authorIds = [...new Set(comments.map((c: any) => c.author_id).filter(Boolean))]
      
      if (authorIds.length > 0) {
        const { data: users } = await supabaseServer
          .from('users')
          .select('id, full_name, nickname, avatar_url')
          .in('id', authorIds)
        
        const userMap = new Map(users?.map((u: any) => [u.id, u]) || [])
        
        comments.forEach((comment: any) => {
          comment.users = userMap.get(comment.author_id) || null
        })
      }
      
      // 현재 사용자의 투표 상태도 조회
      const authHeader = request.headers.get('Authorization')
      if (authHeader) {
        const token = authHeader.split(' ')[1]
        const { data: { user: authUser }, error: authError } = await supabaseServer.auth.getUser(token)
        
        if (!authError && authUser) {
          const commentIds = comments.map((c: any) => c.id)
          
          const { data: userVotes } = await supabaseServer
            .from('comment_reactions')
            .select('comment_id, reaction_type')
            .eq('user_id', authUser.id)
            .in('comment_id', commentIds)
          
          const voteMap = new Map(userVotes?.map((v: any) => [v.comment_id, v.reaction_type]) || [])
          
          comments.forEach((comment: any) => {
            comment.user_vote = voteMap.get(comment.id) || null
          })
        }
      }
    }

    console.log('[NEWS_COMMENTS_GET] 댓글 조회 성공:', comments?.length || 0, '개')

    return NextResponse.json({
      success: true,
      comments: comments || []
    })

  } catch (error) {
    console.error('[NEWS_COMMENTS_GET] 댓글 조회 오류:', error)
    return NextResponse.json(
      { 
        error: '서버 오류가 발생했습니다.',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

// K-매거진 뉴스 댓글 작성
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: newsId } = await params
    const body = await request.json()
    const { content, parent_comment_id, parent_id } = body
    
    // parent_id와 parent_comment_id 둘 다 지원
    const parentId = parent_id || parent_comment_id
    
    console.log('========================================')
    console.log('[NEWS_COMMENTS_POST] 댓글 작성 시작')
    console.log('[NEWS_COMMENTS_POST] newsId:', newsId)
    console.log('[NEWS_COMMENTS_POST] content:', content)
    console.log('[NEWS_COMMENTS_POST] parent_id:', parentId)
    
    if (!supabaseServer) {
      console.error('[NEWS_COMMENTS_POST] Supabase 연결 실패')
      return NextResponse.json(
        { error: '데이터베이스 연결이 설정되지 않았습니다.' },
        { status: 500 }
      )
    }

    // Authorization 헤더에서 토큰 추출
    const authHeader = request.headers.get('Authorization')
    if (!authHeader) {
      console.error('[NEWS_COMMENTS_POST] Authorization 헤더 없음')
      return NextResponse.json(
        { error: '로그인이 필요합니다.' },
        { status: 401 }
      )
    }

    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authError } = await supabaseServer.auth.getUser(token)

    if (authError || !user) {
      console.error('[NEWS_COMMENTS_POST] 인증 실패:', authError)
      return NextResponse.json(
        { error: '로그인이 필요합니다.' },
        { status: 401 }
      )
    }

    const userId = user.id
    console.log('[NEWS_COMMENTS_POST] userId:', userId)

    // 입력 검증
    if (!content || content.trim().length === 0) {
      console.error('[NEWS_COMMENTS_POST] 댓글 내용이 비어있음')
      return NextResponse.json(
        { error: '댓글 내용을 입력해주세요.' },
        { status: 400 }
      )
    }

    // 1. 뉴스가 존재하는지 확인
    const { data: news, error: newsError } = await supabaseServer
      .from('korean_news')
      .select('id, title')
      .eq('id', newsId)
      .single()

    if (newsError || !news) {
      console.error('[NEWS_COMMENTS_POST] 뉴스를 찾을 수 없음:', newsError)
      return NextResponse.json(
        { error: '뉴스를 찾을 수 없습니다.' },
        { status: 404 }
      )
    }

    console.log('[NEWS_COMMENTS_POST] 뉴스 확인 완료:', news.title)

    // 2. 댓글 데이터 준비
    const commentData: any = {
      post_id: newsId,
      author_id: userId,  // 실제 로그인한 사용자 ID 사용
      content: content.trim(),
      like_count: 0,
      dislike_count: 0,
      is_deleted: false,
      parent_id: parentId || null
    }

    console.log('[NEWS_COMMENTS_POST] 댓글 데이터:', commentData)

    // 3. 댓글 저장
    const { data: newComment, error: insertError } = await supabaseServer
      .from('comments')
      .insert([commentData])
      .select(`
        id,
        content,
        like_count,
        dislike_count,
        created_at,
        updated_at,
        parent_id,
        author_id
      `)
      .single()

    if (insertError) {
      console.error('[NEWS_COMMENTS_POST] 댓글 저장 오류:', insertError)
      console.error('[NEWS_COMMENTS_POST] 오류 상세:', {
        message: insertError.message,
        details: insertError.details,
        hint: insertError.hint,
        code: insertError.code
      })
      return NextResponse.json(
        { 
          error: '댓글 저장에 실패했습니다.',
          details: insertError.message
        },
        { status: 500 }
      )
    }

    // 사용자 정보는 별도로 조회
    if (newComment) {
      const { data: userData } = await supabaseServer
        .from('users')
        .select('id, full_name, nickname, avatar_url')
        .eq('id', userId)
        .single()
      
      if (userData) {
        (newComment as any).users = userData
      }
    }

    console.log('[NEWS_COMMENTS_POST] 댓글 저장 성공:', newComment.id)

    // 포인트 지급 (뉴스 댓글 - 75점 체계)
    let pointsAwarded = 0
    try {
      const { data: pointResult, error: pointError } = await supabaseServer.rpc('add_points_with_limit', {
        p_user_id: userId,
        p_type: 'news_comment',
        p_amount: 2,
        p_description: '뉴스 댓글 작성',
        p_related_id: newComment.id,
        p_related_type: 'comment'
      })

      if (pointError) {
        console.error('[NEWS_COMMENTS_POST] 포인트 적립 실패:', pointError)
      } else if (pointResult) {
        console.log('[NEWS_COMMENTS_POST] 포인트 적립 성공: +2점')
        pointsAwarded = 2
      }
    } catch (pointError) {
      console.error('[NEWS_COMMENTS_POST] 포인트 적립 예외:', pointError)
    }

    // 4. korean_news의 comment_count 업데이트
    const { data: currentNews, error: countError } = await supabaseServer
      .from('korean_news')
      .select('comment_count')
      .eq('id', newsId)
      .single()

    const newCommentCount = (currentNews?.comment_count || 0) + 1

    const { error: updateError } = await supabaseServer
      .from('korean_news')
      .update({ comment_count: newCommentCount })
      .eq('id', newsId)

    if (updateError) {
      console.error('[NEWS_COMMENTS_POST] comment_count 업데이트 오류:', updateError)
      // 댓글은 저장되었으므로 에러를 반환하지 않음
    } else {
      console.log('[NEWS_COMMENTS_POST] comment_count 업데이트 성공:', newCommentCount)
    }

    console.log('[NEWS_COMMENTS_POST] 댓글 작성 완료!')
    console.log('========================================')

    return NextResponse.json({
      success: true,
      comment: newComment,
      pointsAwarded: pointsAwarded
    })

  } catch (error) {
    console.error('[NEWS_COMMENTS_POST] 댓글 작성 오류:', error)
    console.error('[NEWS_COMMENTS_POST] 오류 스택:', error instanceof Error ? error.stack : 'No stack')
    console.error('[NEWS_COMMENTS_POST] 오류 타입:', typeof error)
    console.error('[NEWS_COMMENTS_POST] 오류 상세:', {
      name: error instanceof Error ? error.name : 'Unknown',
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined
    })
    return NextResponse.json(
      {
        error: '서버 오류가 발생했습니다.',
        details: error instanceof Error ? error.message : String(error),
        type: error instanceof Error ? error.name : typeof error
      },
      { status: 500 }
    )
  }
}
