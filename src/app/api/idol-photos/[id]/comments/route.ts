import { createClient } from '@/lib/supabase/server'
import { supabaseServer } from '@/lib/supabaseServer'
import { NextResponse } from 'next/server'

// 댓글 조회 (답글 포함)
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = createClient()
    const { id } = await params

    // 먼저 댓글만 가져오기
    const { data: allComments, error } = await supabase
      .from('idol_memes_comments')
      .select('*')
      .eq('post_id', id)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Failed to fetch comments:', error)
      return NextResponse.json({ error: 'Failed to fetch comments' }, { status: 500 })
    }

    // 댓글이 없으면 빈 배열 반환
    if (!allComments || allComments.length === 0) {
      return NextResponse.json([])
    }

    // 각 댓글의 사용자 정보를 별도로 가져오기
    const commentsWithProfiles = await Promise.all(
      allComments.map(async (comment) => {
        const { data: profile } = await supabase
          .from('user_profiles')
          .select('display_name, avatar_url')
          .eq('user_id', comment.user_id)
          .single()

        return {
          ...comment,
          user_profiles: profile || null
        }
      })
    )

    // parent_comment_id가 없는 경우 (마이그레이션 전) - 기존 방식
    if (!('parent_comment_id' in commentsWithProfiles[0])) {
      return NextResponse.json(commentsWithProfiles)
    }

    // parent_comment_id가 있는 경우 - 답글 기능 지원
    const topLevelComments = commentsWithProfiles.filter(comment => !comment.parent_comment_id)
    const repliesMap = new Map<string, any[]>()

    // 답글들을 그룹화
    commentsWithProfiles.forEach(comment => {
      if (comment.parent_comment_id) {
        if (!repliesMap.has(comment.parent_comment_id)) {
          repliesMap.set(comment.parent_comment_id, [])
        }
        repliesMap.get(comment.parent_comment_id)!.push(comment)
      }
    })

    // 최상위 댓글에 답글 추가
    const commentsWithReplies = topLevelComments.map(comment => ({
      ...comment,
      replies: repliesMap.get(comment.id) || []
    }))

    return NextResponse.json(commentsWithReplies)
  } catch (error) {
    console.error('Error in GET /api/idol-photos/[id]/comments:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// 댓글 작성
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    console.log('🔍 [IDOL_PHOTOS_COMMENT] POST 요청 시작')
    
    if (!supabaseServer) {
      console.error('🔍 [IDOL_PHOTOS_COMMENT] supabaseServer 없음')
      return NextResponse.json({ error: 'Server not configured' }, { status: 500 })
    }

    const { id } = await params
    console.log('🔍 [IDOL_PHOTOS_COMMENT] post_id:', id)

    const authHeader = request.headers.get('Authorization')
    if (!authHeader) {
      console.error('🔍 [IDOL_PHOTOS_COMMENT] Authorization 헤더 없음')
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authError } = await supabaseServer.auth.getUser(token)

    if (authError || !user) {
      console.error('🔍 [IDOL_PHOTOS_COMMENT] 인증 실패:', authError)
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    console.log('🔍 [IDOL_PHOTOS_COMMENT] 사용자 인증 성공:', user.email)

    const body = await request.json()
    const { content, parent_comment_id } = body

    console.log('🔍 [IDOL_PHOTOS_COMMENT] 댓글 내용:', content)

    if (!content || !content.trim()) {
      console.error('🔍 [IDOL_PHOTOS_COMMENT] 댓글 내용 없음')
      return NextResponse.json({ error: 'Content is required' }, { status: 400 })
    }

    // 삽입할 데이터 준비
    const insertData: any = {
      post_id: id,
      user_id: user.id,
      content: content.trim(),
    }

    // parent_comment_id가 제공된 경우 검증 후 추가
    if (parent_comment_id) {
      const { data: parentComment, error: parentError } = await supabaseServer
        .from('idol_memes_comments')
        .select('id, parent_comment_id')
        .eq('id', parent_comment_id)
        .single()

      if (parentError || !parentComment) {
        return NextResponse.json({ error: 'Parent comment not found' }, { status: 404 })
      }

      // 답글의 답글은 허용하지 않음 (1단계만 허용)
      if (parentComment.parent_comment_id) {
        return NextResponse.json({ 
          error: 'Cannot reply to a reply. Please reply to the original comment.' 
        }, { status: 400 })
      }

      insertData.parent_comment_id = parent_comment_id
    }

    console.log('🔍 [IDOL_PHOTOS_COMMENT] DB 삽입 시작')
    
    const { data: newComment, error } = await supabaseServer
      .from('idol_memes_comments')
      .insert(insertData)
      .select('*')
      .single()

    if (error) {
      console.error('🔍 [IDOL_PHOTOS_COMMENT] DB 삽입 실패:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    console.log('🔍 [IDOL_PHOTOS_COMMENT] 댓글 작성 성공, 포인트 지급 시도')

    // 포인트 지급 (아이돌 사진 댓글 - 75점 체계)
    let pointsAwarded = 0
    try {
      const { data: pointResult, error: pointError } = await supabaseServer.rpc('add_points_with_limit', {
        p_user_id: user.id,
        p_type: 'comment_post',
        p_amount: 1,
        p_description: '아이돌 사진 댓글 작성',
        p_related_id: newComment.id,
        p_related_type: 'comment'
      })

      if (pointError) {
        console.error('[IDOL_PHOTOS_COMMENT] 포인트 적립 실패:', pointError)
      } else if (pointResult) {
        console.log('[IDOL_PHOTOS_COMMENT] 포인트 적립 성공: +1점')
        pointsAwarded = 1
      }
    } catch (pointError) {
      console.error('[IDOL_PHOTOS_COMMENT] 포인트 적립 예외:', pointError)
    }

    // 사용자 정보 가져오기 (user_profiles 우선, users fallback)
    let userName = null
    let avatarUrl = null
    
    const { data: profileData, error: profileError } = await supabaseServer
      .from('user_profiles')
      .select('display_name, avatar_url')
      .eq('user_id', user.id)
      .single()
    
    if (!profileError && profileData && profileData.display_name) {
      userName = profileData.display_name.includes('#') 
        ? profileData.display_name.split('#')[0] 
        : profileData.display_name
      avatarUrl = profileData.avatar_url
    }
    
    if (!userName) {
      const { data: userData } = await supabaseServer
        .from('users')
        .select('nickname, korean_name, spanish_name, full_name, profile_image, avatar_url')
        .eq('user_id', user.id)
        .single()
      
      if (userData) {
        userName = userData.nickname || userData.korean_name || userData.spanish_name || userData.full_name || 'Usuario'
        avatarUrl = userData.profile_image || userData.avatar_url
      }
    }

    const result = {
      ...newComment,
      user_profiles: {
        display_name: userName || 'Usuario',
        avatar_url: avatarUrl
      },
      pointsAwarded: pointsAwarded
    }

    console.log('🔍 [IDOL_PHOTOS_COMMENT] 최종 결과:', result)
    return NextResponse.json(result)
  } catch (error) {
    console.error('🔍 [IDOL_PHOTOS_COMMENT] 예외 발생:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

