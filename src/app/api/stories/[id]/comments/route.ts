import { NextRequest, NextResponse } from 'next/server'
import { supabaseServer } from '@/lib/supabaseServer'

// 댓글 조회
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    if (!supabaseServer) {
      return NextResponse.json(
        { error: '데이터베이스 연결이 설정되지 않았습니다.' },
        { status: 500 }
      )
    }

    const { id: storyId } = params

    // 댓글 조회
    const { data: comments, error } = await supabaseServer
      .from('story_comments')
      .select('id, user_id, content, created_at, updated_at')
      .eq('story_id', storyId)
      .order('created_at', { ascending: true })

    if (error) {
      console.error('[STORY_COMMENTS_GET] 댓글 조회 실패:', error)
      return NextResponse.json(
        { error: '댓글을 불러오는데 실패했습니다.', details: error.message },
        { status: 500 }
      )
    }

    // 사용자 정보 조회
    const userIds = [...new Set(comments?.map(c => c.user_id).filter(Boolean))]
    let usersMap: { [key: string]: any } = {}

    if (userIds.length > 0) {
      const { data: users } = await supabaseServer
        .from('users')
        .select('id, full_name, profile_image, avatar_url')
        .in('id', userIds)

      if (users) {
        usersMap = users.reduce((acc, user) => {
          acc[user.id] = user
          return acc
        }, {} as { [key: string]: any })
      }
    }

    // 댓글 데이터 변환
    const transformedComments = comments?.map(comment => {
      const user = usersMap[comment.user_id] || { id: comment.user_id, full_name: '알 수 없음' }
      return {
        id: comment.id,
        content: comment.content,
        created_at: comment.created_at,
        updated_at: comment.updated_at,
        author: {
          id: user.id,
          full_name: user.full_name,
          profile_image: user.profile_image || user.avatar_url
        }
      }
    }) || []

    return NextResponse.json({
      success: true,
      comments: transformedComments
    })
  } catch (error: any) {
    console.error('[STORY_COMMENTS_GET] 서버 오류:', error)
    return NextResponse.json(
      { error: '댓글을 불러오는데 실패했습니다.', details: error.message },
      { status: 500 }
    )
  }
}

// 댓글 작성
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    if (!supabaseServer) {
      return NextResponse.json(
        { error: '데이터베이스 연결이 설정되지 않았습니다.' },
        { status: 500 }
      )
    }

    const { id: storyId } = params
    const body = await request.json()
    const { content } = body

    // 인증 토큰 확인
    const authHeader = request.headers.get('Authorization')
    let userId = null

    if (authHeader) {
      const token = authHeader.replace('Bearer ', '')
      const { data: { user }, error: authError } = await supabaseServer.auth.getUser(token)

      if (authError || !user) {
        return NextResponse.json({ error: '인증이 필요합니다.' }, { status: 401 })
      }
      userId = user.id
    } else {
      return NextResponse.json({ error: '인증이 필요합니다.' }, { status: 401 })
    }

    // 유효성 검사
    if (!content || content.trim() === '') {
      return NextResponse.json({ error: '댓글 내용을 입력해주세요.' }, { status: 400 })
    }

    // 댓글 삽입
    const { data: newComment, error: insertError } = await supabaseServer
      .from('story_comments')
      .insert({
        story_id: storyId,
        user_id: userId,
        content: content.trim()
      })
      .select('id, user_id, content, created_at, updated_at')
      .single()

    if (insertError) {
      console.error('[STORY_COMMENTS_POST] 댓글 작성 실패:', insertError)
      return NextResponse.json(
        { error: '댓글 작성에 실패했습니다.', details: insertError.message },
        { status: 500 }
      )
    }

    // 사용자 정보 조회
    const { data: user } = await supabaseServer
      .from('users')
      .select('id, full_name, profile_image, avatar_url')
      .eq('id', newComment.user_id)
      .single()

    // 스토리의 댓글 수 업데이트
    await supabaseServer.rpc('increment_story_comment_count', {
      story_id_param: storyId
    })

    // 댓글 데이터 변환
    const transformedComment = {
      id: newComment.id,
      content: newComment.content,
      created_at: newComment.created_at,
      updated_at: newComment.updated_at,
      author: {
        id: user?.id || newComment.user_id,
        full_name: user?.full_name || '알 수 없음',
        profile_image: user?.profile_image || user?.avatar_url
      }
    }

    return NextResponse.json({
      success: true,
      comment: transformedComment,
      message: '댓글이 작성되었습니다.'
    })
  } catch (error: any) {
    console.error('[STORY_COMMENTS_POST] 서버 오류:', error)
    return NextResponse.json(
      { error: '댓글 작성에 실패했습니다.', details: error.message },
      { status: 500 }
    )
  }
}

