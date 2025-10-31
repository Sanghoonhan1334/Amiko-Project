import { NextRequest, NextResponse } from 'next/server'
import { supabaseServer } from '@/lib/supabaseServer'

// 스토리 댓글 목록 조회
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

    console.log('[STORY_COMMENTS_GET] 댓글 조회:', storyId)

    // 스토리 댓글 조회
    const { data: comments, error } = await supabaseServer
      .from('story_comments')
      .select(`
        id,
        story_id,
        user_id,
        content,
        created_at,
        updated_at
      `)
      .eq('story_id', storyId)
      .order('created_at', { ascending: true })

    if (error) {
      console.error('[STORY_COMMENTS_GET] 댓글 조회 실패:', error)
      return NextResponse.json(
        { error: '댓글을 불러오는데 실패했습니다.' },
        { status: 500 }
      )
    }

    // 사용자 정보 조회 (실제 데이터베이스에서 가져오기)
    const userIds = [...new Set(comments?.map(c => c.user_id).filter(Boolean))]
    let usersMap: { [key: string]: any } = {}
    
    if (userIds.length > 0) {
      const { data: users, error: usersError } = await supabaseServer
        .from('users')
        .select('id, full_name, avatar_url, profile_image')
        .in('id', userIds)

      if (!usersError && users) {
        usersMap = users.reduce((acc, user) => {
          acc[user.id] = {
            id: user.id,
            full_name: user.full_name || `사용자${user.id.slice(-4)}`,
            profile_image: user.profile_image || user.avatar_url,
            avatar_url: user.avatar_url || user.profile_image
          }
          return acc
        }, {} as { [key: string]: any })
      }
    }

    // 댓글 좋아요 수 조회 (임시로 0으로 설정)
    const commentIds = comments?.map(c => c.id) || []
    let commentLikesMap: { [key: string]: number } = {}
    let userLikesMap: { [key: string]: boolean } = {}
    
    // 모든 댓글의 좋아요 수를 0으로 초기화
    commentIds.forEach(commentId => {
      commentLikesMap[commentId] = 0
      userLikesMap[commentId] = false
    })

    // 댓글 데이터 변환
    const transformedComments = comments?.map(comment => {
      const user = usersMap[comment.user_id] || { 
        id: comment.user_id, 
        full_name: '사용자', 
        avatar_url: null, 
        profile_image: null 
      }
      return {
        id: comment.id,
        story_id: comment.story_id,
        content: comment.content,
        created_at: comment.created_at,
        updated_at: comment.updated_at,
        likes_count: commentLikesMap[comment.id] || 0,
        is_liked: userLikesMap[comment.id] || false,
        author: {
          id: user.id,
          full_name: user.full_name,
          profile_image: user.profile_image || user.avatar_url
        }
      }
    }) || []

    console.log('[STORY_COMMENTS_GET] 댓글 조회 성공:', transformedComments.length)

    return NextResponse.json({
      success: true,
      comments: transformedComments
    })

  } catch (error: any) {
    console.error('[STORY_COMMENTS_GET] 서버 오류:', error)
    return NextResponse.json(
      { error: '댓글을 불러오는데 실패했습니다.' },
      { status: 500 }
    )
  }
}

// 스토리 댓글 작성
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

    console.log('[STORY_COMMENTS_POST] 댓글 작성:', { storyId, content: content?.substring(0, 50) })

    // 입력 검증
    if (!content || content.trim().length === 0) {
      return NextResponse.json(
        { error: '댓글 내용을 입력해주세요.' },
        { status: 400 }
      )
    }

    if (content.length > 500) {
      return NextResponse.json(
        { error: '댓글은 500자 이하로 입력해주세요.' },
        { status: 400 }
      )
    }

    // Authorization 헤더에서 토큰 추출
    const authHeader = request.headers.get('Authorization')
    let authUser = null

    if (authHeader) {
      const token = authHeader.split(' ')[1]
      const { data: { user }, error: authError } = await supabaseServer.auth.getUser(token)

      if (authError || !user) {
        console.error('[STORY_COMMENTS_POST] 인증 실패:', authError?.message)
        return NextResponse.json({ error: '인증이 필요합니다.' }, { status: 401 })
      }

      authUser = user
    } else {
      return NextResponse.json({ error: '인증이 필요합니다.' }, { status: 401 })
    }

    console.log('[STORY_COMMENTS_POST] 사용자 인증 성공:', authUser.id)

    // 스토리 존재 확인
    const { data: story, error: storyError } = await supabaseServer
      .from('stories')
      .select('id, user_id')
      .eq('id', storyId)
      .single()

    if (storyError || !story) {
      console.error('[STORY_COMMENTS_POST] 스토리 조회 실패:', storyError)
      return NextResponse.json(
        { error: '스토리를 찾을 수 없습니다.' },
        { status: 404 }
      )
    }

    // 댓글 생성
    const { data: comment, error: commentError } = await supabaseServer
      .from('story_comments')
      .insert({
        story_id: storyId,
        user_id: authUser.id,
        content: content.trim()
      })
      .select(`
        id,
        story_id,
        user_id,
        content,
        created_at,
        updated_at
      `)
      .single()

    if (commentError) {
      console.error('[STORY_COMMENTS_POST] 댓글 생성 실패:', commentError)
      return NextResponse.json(
        { error: '댓글 작성에 실패했습니다.' },
        { status: 500 }
      )
    }

    console.log('[STORY_COMMENTS_POST] 댓글 생성 성공:', comment.id)

    // 댓글 수 증가
    console.log('[STORY_COMMENTS_POST] 댓글 수 증가 시도:', storyId)
    const { error: incrementError } = await supabaseServer.rpc('increment_story_comment_count', {
      story_id_param: storyId
    })

    if (incrementError) {
      console.error('[STORY_COMMENTS_POST] 댓글 수 증가 실패:', incrementError)
    } else {
      console.log('[STORY_COMMENTS_POST] 댓글 수 증가 성공:', storyId)
    }

    // 댓글 작성자의 사용자 정보 조회
    const { data: userInfo, error: userInfoError } = await supabaseServer
      .from('users')
      .select('id, full_name, avatar_url, profile_image')
      .eq('id', authUser.id)
      .single()

    const authorInfo = userInfo ? {
      id: userInfo.id,
      full_name: userInfo.full_name || `사용자${authUser.id.slice(-4)}`,
      profile_image: userInfo.profile_image || userInfo.avatar_url
    } : {
      id: authUser.id,
      full_name: `사용자${authUser.id.slice(-4)}`,
      profile_image: null
    }

    const transformedComment = {
      id: comment.id,
      story_id: comment.story_id,
      content: comment.content,
      created_at: comment.created_at,
      updated_at: comment.updated_at,
      author: authorInfo
    }

    return NextResponse.json({
      success: true,
      comment: transformedComment
    })

  } catch (error: any) {
    console.error('[STORY_COMMENTS_POST] 서버 오류:', error)
    return NextResponse.json(
      { error: '댓글 작성 중 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}