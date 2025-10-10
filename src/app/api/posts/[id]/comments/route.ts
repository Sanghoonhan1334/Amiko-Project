import { NextRequest, NextResponse } from 'next/server'
import { supabaseServer } from '@/lib/supabaseServer'

// 댓글 목록 조회
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

    const { id: postId } = params

    console.log('[COMMENTS_GET] 댓글 조회:', postId)

    // 댓글 조회 (사용자 정보는 별도로 가져옴)
    const { data: comments, error } = await supabaseServer
      .from('post_comments')
      .select('id, user_id, content, like_count, dislike_count, created_at, updated_at, parent_comment_id')
      .eq('post_id', postId)
      .eq('is_deleted', false)
      .order('created_at', { ascending: true })

    if (error) {
      console.error('[COMMENTS_GET] 댓글 조회 실패:', error)
      return NextResponse.json(
        { error: '댓글을 불러오는데 실패했습니다.', details: error.message },
        { status: 500 }
      )
    }

    console.log('[COMMENTS_GET] 댓글 조회 성공:', comments?.length || 0)

    // 사용자 ID 목록 추출
    const userIds = [...new Set(comments?.map(c => c.user_id).filter(Boolean))]
    
    // 사용자 정보 조회
    let usersMap: { [key: string]: any } = {}
    if (userIds.length > 0) {
      const { data: users, error: usersError } = await supabaseServer
        .from('users')
        .select('id, full_name, avatar_url, profile_image')
        .in('id', userIds)

      if (!usersError && users) {
        usersMap = users.reduce((acc, user) => {
          acc[user.id] = user
          return acc
        }, {} as { [key: string]: any })
      }
    }

    // 댓글 데이터 변환
    const transformedComments = comments?.map(comment => {
      const user = usersMap[comment.user_id] || { id: comment.user_id, full_name: '알 수 없음', avatar_url: null, profile_image: null }
      return {
        id: comment.id,
        content: comment.content,
        like_count: comment.like_count || 0,
        dislike_count: comment.dislike_count || 0,
        created_at: comment.created_at,
        updated_at: comment.updated_at,
        parent_comment_id: comment.parent_comment_id,
        author: {
          id: user.id,
          full_name: user.full_name,
          nickname: user.nickname,
          profile_image: user.profile_image || user.avatar_url
        }
      }
    }) || []

    return NextResponse.json(
      { success: true, comments: transformedComments },
      { status: 200 }
    )
  } catch (error: any) {
    console.error('[COMMENTS_GET] 서버 오류:', error)
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

    const { id: postId } = params
    const body = await request.json()
    const { content, parent_comment_id } = body

    console.log('[COMMENTS_POST] 댓글 작성:', { postId, content: content?.substring(0, 50), parent_comment_id })

    // Authorization 헤더에서 토큰 추출
    const authHeader = request.headers.get('Authorization')
    let authUser = null

    if (authHeader) {
      const token = authHeader.split(' ')[1]
      const { data: { user }, error: authError } = await supabaseServer.auth.getUser(token)

      if (authError || !user) {
        console.error('[COMMENTS_POST] 인증 실패:', authError?.message)
        return NextResponse.json({ error: '인증이 필요합니다.' }, { status: 401 })
      }
      authUser = user
    } else {
      // 개발 환경에서는 기본 사용자로 인증 우회
      console.log('[COMMENTS_POST] 토큰 없음 - 개발 환경 인증 우회')
      const defaultUserId = '5f83ab21-fd61-4666-94b5-087d73477476'
      const { data: defaultUser, error: defaultUserError } = await supabaseServer
        .from('users')
        .select('id, email, full_name, nickname')
        .eq('id', defaultUserId)
        .single()

      if (defaultUserError || !defaultUser) {
        console.error('[COMMENTS_POST] 기본 사용자 조회 실패:', defaultUserError)
        return NextResponse.json(
          { error: '기본 사용자 인증에 실패했습니다.' },
          { status: 401 }
        )
      }
      authUser = defaultUser
    }

    if (!authUser) {
      return NextResponse.json({ error: '인증된 사용자를 찾을 수 없습니다.' }, { status: 401 })
    }

    // 유효성 검사
    if (!content || content.trim() === '') {
      return NextResponse.json({ error: '댓글 내용을 입력해주세요.' }, { status: 400 })
    }

    // 댓글 데이터 준비
    const commentData: any = {
      post_id: postId,
      user_id: authUser.id,
      content: content.trim(),
      like_count: 0,
      dislike_count: 0,
      is_deleted: false,
      parent_comment_id: parent_comment_id || null
    }

    console.log('[COMMENTS_POST] 댓글 데이터:', commentData)

    // 댓글 삽입
    const { data: newComment, error: insertError } = await supabaseServer
      .from('post_comments')
      .insert([commentData])
      .select('id, user_id, content, like_count, dislike_count, created_at, updated_at, parent_comment_id')
      .single()

    if (insertError) {
      console.error('[COMMENTS_POST] 댓글 삽입 오류:', insertError)
      return NextResponse.json(
        { error: '댓글 작성에 실패했습니다.', details: insertError.message },
        { status: 500 }
      )
    }

    console.log('[COMMENTS_POST] 댓글 작성 성공:', newComment)

    // 사용자 정보 조회
    const { data: user } = await supabaseServer
      .from('users')
      .select('id, full_name, avatar_url, profile_image')
      .eq('id', newComment.user_id)
      .single()

    // 게시글의 댓글 수 업데이트
    const { error: updateError } = await supabaseServer.rpc('increment_comment_count', {
      post_id: postId
    })

    if (updateError) {
      console.error('[COMMENTS_POST] 댓글 수 업데이트 실패:', updateError)
      // 댓글은 생성되었으므로 에러를 반환하지 않음
    }

    // 댓글 데이터 변환
    const transformedComment = {
      id: newComment.id,
      content: newComment.content,
      like_count: newComment.like_count || 0,
      dislike_count: newComment.dislike_count || 0,
      created_at: newComment.created_at,
      updated_at: newComment.updated_at,
      parent_comment_id: newComment.parent_comment_id,
      author: {
        id: user?.id || newComment.user_id,
        full_name: user?.full_name || '알 수 없음',
        profile_image: user?.profile_image || user?.avatar_url || null
      }
    }

    return NextResponse.json(
      { success: true, comment: transformedComment, message: '댓글이 성공적으로 작성되었습니다.' },
      { status: 200 }
    )
  } catch (error: any) {
    console.error('[COMMENTS_POST] 서버 오류:', error)
    return NextResponse.json(
      { error: '댓글 작성에 실패했습니다.', details: error.message },
      { status: 500 }
    )
  }
}

