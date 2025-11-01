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

    // 먼저 댓글만 조회 (user_profiles는 별도로 가져오기)
    const { data: allComments, error: commentsError } = await supabase
      .from('fan_art_comments')
      .select('*')
      .eq('post_id', id)
      .order('created_at', { ascending: false })

    if (commentsError) {
      console.error('Failed to fetch comments:', commentsError)
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
    console.error('Error in GET /api/fanart/[id]/comments:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// 댓글 작성
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    if (!supabaseServer) {
      return NextResponse.json({ error: 'Server not configured' }, { status: 500 })
    }

    const { id } = await params

    const authHeader = request.headers.get('Authorization')
    if (!authHeader) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authError } = await supabaseServer.auth.getUser(token)

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { content, parent_comment_id } = body

    if (!content || !content.trim()) {
      return NextResponse.json({ error: 'Content is required' }, { status: 400 })
    }

    // 먼저 댓글을 기본 정보만으로 삽입
    const insertData: any = {
      post_id: id,
      user_id: user.id,
      content: content.trim(),
    }

    // parent_comment_id가 제공된 경우 검증 후 추가
    if (parent_comment_id) {
      const { data: parentComment, error: parentError } = await supabaseServer
        .from('fan_art_comments')
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

      // parent_comment_id 추가
      insertData.parent_comment_id = parent_comment_id
    }

    const { data, error } = await supabaseServer
      .from('fan_art_comments')
      .insert(insertData)
      .select()
      .single()

    if (error) {
      console.error('[FAN_ART_COMMENTS] 댓글 작성 실패:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // user_profiles 정보 별도로 가져오기
    let userProfile = null
    try {
      const { data: profile } = await supabaseServer
        .from('user_profiles')
        .select('display_name, avatar_url')
        .eq('user_id', user.id)
        .single()
      
      userProfile = profile
    } catch (err) {
      console.log('[FAN_ART_COMMENTS] 프로필 조회 실패:', err)
    }

    return NextResponse.json({
      ...data,
      user_profiles: userProfile
    })
  } catch (error) {
    console.error('[FAN_ART_COMMENTS] 전체 오류:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

