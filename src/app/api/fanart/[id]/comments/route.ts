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

    // 댓글 조회 (user_id 포함)
    const { data: allComments, error: commentsError } = await supabase
      .from('fan_art_comments')
      .select('id, user_id, content, created_at, parent_comment_id, post_id')
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

    // 각 댓글의 사용자 정보를 별도로 가져오기 (user_profiles 우선, users fallback)
    const commentsWithProfiles = await Promise.all(
      allComments.map(async (comment) => {
        let userName = null
        let avatarUrl = null

        // 먼저 user_profiles 확인
        const { data: profile } = await supabase
          .from('user_profiles')
          .select('display_name, avatar_url')
          .eq('user_id', comment.user_id)
          .single()

        if (profile && profile.display_name) {
          userName = profile.display_name.includes('#') 
            ? profile.display_name.split('#')[0] 
            : profile.display_name
          avatarUrl = profile.avatar_url
        }

        // user_profiles에 없으면 users 테이블 조회
        if (!userName) {
          const { data: userData } = await supabase
            .from('users')
            .select('nickname, korean_name, spanish_name, full_name, profile_image, avatar_url')
            .eq('id', comment.user_id)
            .single()

          if (userData) {
            userName = userData.korean_name || userData.spanish_name || userData.full_name || 'Usuario'
            avatarUrl = userData.profile_image || userData.avatar_url
          }
        }

        return {
          ...comment,
          user_profiles: {
            display_name: userName || 'Usuario',
            avatar_url: avatarUrl
          }
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

    // 인증 상태 확인 (SMS/WhatsApp/Phone 인증 중 하나라도 있어야 댓글 작성 가능)
    const { data: userData, error: userDataError } = await supabaseServer
      .from('users')
      .select('phone_verified, sms_verified_at, phone_verified_at, wa_verified_at, kakao_linked_at, is_verified, verification_completed, email_verified_at, korean_name, spanish_name, nickname, full_name, user_type, university, major, occupation, company')
      .eq('id', user.id)
      .single()

    if (!userDataError && userData) {
      const userType = userData.user_type || 'student'
      const hasVerification = !!(
        userData.is_verified ||
        userData.verification_completed ||
        userData.email_verified_at ||
        userData.sms_verified_at ||
        userData.phone_verified_at ||
        userData.wa_verified_at ||
        userData.kakao_linked_at ||
        (userData.korean_name) ||
        (userData.spanish_name) ||
        (userType === 'student' && userData.full_name && userData.university && userData.major) ||
        (userType === 'general' && userData.full_name && (userData.occupation || userData.company))
      )

      if (!hasVerification) {
        console.error('🔍 [FANART_COMMENT] 인증되지 않은 사용자:', user.id)
        return NextResponse.json(
          { error: '댓글을 작성하려면 인증이 필요합니다.' },
          { status: 403 }
        )
      }
    } else {
      console.error('🔍 [FANART_COMMENT] 사용자 정보 조회 실패:', userDataError)
      return NextResponse.json(
        { error: '사용자 정보를 확인할 수 없습니다.' },
        { status: 500 }
      )
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

    // 포인트 지급 (팬아트 댓글 작성 - 75점 체계)
    let pointsAwarded = 0
    try {
      const { data: pointResult, error: pointError } = await supabaseServer.rpc('add_points_with_limit', {
        p_user_id: user.id,
        p_type: 'comment_post',
        p_amount: 1,
        p_description: '팬아트 댓글 작성',
        p_related_id: data.id,
        p_related_type: 'comment'
      })

      if (pointError) {
        console.error('[FAN_ART_COMMENTS] 포인트 적립 실패:', pointError)
      } else if (pointResult) {
        console.log('[FAN_ART_COMMENTS] 포인트 적립 성공: +1점')
        pointsAwarded = 1
      }
    } catch (pointError) {
      console.error('[FAN_ART_COMMENTS] 포인트 적립 예외:', pointError)
    }

    // 사용자 정보 가져오기 (user_profiles 우선, users fallback)
    let userName = null
    let avatarUrl = null
    
    // 먼저 user_profiles 테이블에서 조회
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
    
    // user_profiles에 없으면 users 테이블 조회
    if (!userName) {
      const { data: userData } = await supabaseServer
        .from('users')
        .select('nickname, korean_name, spanish_name, full_name, profile_image, avatar_url')
        .eq('id', user.id)
        .single()
      
      if (userData) {
        userName = userData.korean_name || userData.spanish_name || userData.full_name || 'Usuario'
        avatarUrl = userData.profile_image || userData.avatar_url
      }
    }

    return NextResponse.json({
      ...data,
      user_profiles: {
        display_name: userName || 'Usuario',
        avatar_url: avatarUrl
      },
      pointsAwarded: pointsAwarded
    })
  } catch (error) {
    console.error('[FAN_ART_COMMENTS] 전체 오류:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

