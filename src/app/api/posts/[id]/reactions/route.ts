import { NextRequest, NextResponse } from 'next/server'
import { supabaseServer } from '@/lib/supabaseServer'

// 게시글 좋아요/싫어요 토글
export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const params = await context.params
  try {
    if (!supabaseServer) {
      return NextResponse.json(
        { error: '데이터베이스 연결이 설정되지 않았습니다.' },
        { status: 500 }
      )
    }

    const postId = params.id
    const body = await request.json()
    const { reaction_type } = body // 'like' 또는 'dislike'

    // 인증 확인
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
        { error: '인증에 실패했습니다.' },
        { status: 401 }
      )
    }

    // 입력 검증
    if (!reaction_type || !['like', 'dislike'].includes(reaction_type)) {
      return NextResponse.json(
        { error: '올바른 반응 타입을 선택해주세요.' },
        { status: 400 }
      )
    }

    // 게시글 존재 확인 및 작성자 정보 가져오기
    const { data: post, error: postError } = await supabaseServer
      .from('posts')
      .select('id, user_id, title')
      .eq('id', postId)
      .eq('status', 'published')
      .single()

    if (postError || !post) {
      return NextResponse.json(
        { error: '게시글을 찾을 수 없습니다.' },
        { status: 404 }
      )
    }

    const postAuthorId = (post as any).user_id

    // 기존 반응 확인
    const { data: existingReaction, error: reactionError } = await supabaseServer
      .from('post_reactions')
      .select('reaction_type')
      .eq('post_id', postId)
      .eq('user_id', user.id)
      .single()

    let action = 'added' // 'added', 'updated', 'removed'
    let newReactionType = reaction_type

    if (reactionError && reactionError.code !== 'PGRST116') {
      // PGRST116은 "no rows returned" 에러
      console.error('[POST_REACTION] 기존 반응 조회 실패:', reactionError)
      return NextResponse.json(
        { error: '반응 조회에 실패했습니다.' },
        { status: 500 }
      )
    }

    if (existingReaction) {
      console.log('[POST_REACTION] 기존 반응 발견:', (existingReaction as any).reaction_type)
      
      if ((existingReaction as any).reaction_type === reaction_type) {
        // 같은 반응이면 제거
        console.log('[POST_REACTION] 같은 반응 제거 중...')
        const { error: deleteError } = await supabaseServer
          .from('post_reactions')
          .delete()
          .eq('post_id', postId)
          .eq('user_id', user.id)

        if (deleteError) {
          console.error('[POST_REACTION] 반응 삭제 실패:', deleteError)
          return NextResponse.json(
            { error: '반응 삭제에 실패했습니다.' },
            { status: 500 }
          )
        }

        action = 'removed'
        newReactionType = null
        console.log('[POST_REACTION] 반응 제거 완료')
      } else {
        // 다른 반응이면 업데이트
        console.log('[POST_REACTION] 반응 변경 중:', (existingReaction as any).reaction_type, '->', reaction_type)
        const { error: updateError } = await (supabaseServer as any)
          .from('post_reactions')
          .update({ reaction_type })
          .eq('post_id', postId)
          .eq('user_id', user.id)

        if (updateError) {
          console.error('[POST_REACTION] 반응 업데이트 실패:', updateError)
          return NextResponse.json(
            { error: '반응 업데이트에 실패했습니다.' },
            { status: 500 }
          )
        }

        action = 'updated'
        console.log('[POST_REACTION] 반응 변경 완료')
      }
    } else {
      // 새로운 반응 추가
      console.log('[POST_REACTION] 새로운 반응 추가 중:', reaction_type)
      const { error: insertError } = await (supabaseServer as any)
        .from('post_reactions')
        .insert({
          post_id: postId,
          user_id: user.id,
          reaction_type
        })

      if (insertError) {
        console.error('[POST_REACTION] 반응 추가 실패:', insertError)
        return NextResponse.json(
          { error: '반응 추가에 실패했습니다.' },
          { status: 500 }
        )
      }

      action = 'added'
      console.log('[POST_REACTION] 반응 추가 완료')
    }

    // 수동으로 카운트 계산 (트리거가 작동하지 않을 경우를 대비)
    // Manually calculate counts (in case trigger doesn't work)
    const { data: likeCount } = await supabaseServer
      .from('post_reactions')
      .select('id', { count: 'exact' })
      .eq('post_id', postId)
      .eq('reaction_type', 'like')

    const { data: dislikeCount } = await supabaseServer
      .from('post_reactions')
      .select('id', { count: 'exact' })
      .eq('post_id', postId)
      .eq('reaction_type', 'dislike')

    const actualLikeCount = likeCount?.length || 0
    const actualDislikeCount = dislikeCount?.length || 0

    console.log('[POST_REACTION] 실제 계산된 카운트:', {
      like_count: actualLikeCount,
      dislike_count: actualDislikeCount
    })

    // 게시글 테이블의 카운트도 업데이트
    // Update post table counts as well
    await (supabaseServer as any)
      .from('posts')
      .update({
        like_count: actualLikeCount,
        dislike_count: actualDislikeCount
      })
      .eq('id', postId)

    // 좋아요가 추가되었고, 본인 게시글이 아닌 경우 알림 발송
    if (action === 'added' && reaction_type === 'like' && postAuthorId !== user.id) {
      try {
        // 알림 설정 확인
        const { data: notificationSettings } = await supabaseServer
          .from('notification_settings')
          .select('like_notifications_enabled, push_enabled')
          .eq('user_id', postAuthorId)
          .single()

        // 알림 설정이 켜져있고 푸시가 활성화된 경우에만 발송
        if (notificationSettings?.like_notifications_enabled !== false && notificationSettings?.push_enabled !== false) {
          // 좋아요를 누른 사용자 이름 가져오기
          const { data: likerUser } = await supabaseServer
            .from('users')
            .select('korean_name, spanish_name, full_name')
            .eq('id', user.id)
            .single()

          const likerName = likerUser?.korean_name || likerUser?.spanish_name || likerUser?.full_name || '누군가'

          // 푸시 알림 발송 (비동기, 실패해도 좋아요는 성공 처리)
          fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/notifications/send-push`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              userId: postAuthorId,
              title: '새로운 좋아요',
              body: `${likerName}님이 내 글에 좋아요를 달았습니다`,
              data: {
                type: 'post_liked',
                postId: postId,
                postTitle: (post as any).title || '',
                url: `/community/posts/${postId}`
              },
              tag: `post_liked_${postId}`
            })
          }).catch(err => {
            console.error('[POST_REACTION] 푸시 알림 발송 실패:', err)
            // 알림 실패는 무시하고 계속 진행
          })
        }
      } catch (notificationError) {
        console.error('[POST_REACTION] 알림 처리 중 오류:', notificationError)
        // 알림 오류는 무시하고 계속 진행
      }
    }

    return NextResponse.json({
      message: `반응이 ${action === 'removed' ? '제거' : action === 'updated' ? '변경' : '추가'}되었습니다.`,
      action,
      reaction_type: newReactionType,
      counts: {
        like_count: actualLikeCount,
        dislike_count: actualDislikeCount
      }
    })

  } catch (error) {
    console.error('[POST_REACTION] 서버 에러:', error)
    return NextResponse.json(
      { error: '서버 에러가 발생했습니다.' },
      { status: 500 }
    )
  }
}

// 사용자의 게시글 반응 상태 조회
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const params = await context.params
  try {
    if (!supabaseServer) {
      return NextResponse.json(
        { error: '데이터베이스 연결이 설정되지 않았습니다.' },
        { status: 500 }
      )
    }

    const postId = params.id

    // 인증 확인
    const authHeader = request.headers.get('authorization')
    if (!authHeader) {
      return NextResponse.json({
        user_reaction: null
      })
    }

    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authError } = await supabaseServer.auth.getUser(token)

    if (authError || !user) {
      return NextResponse.json({
        user_reaction: null
      })
    }

    // 사용자의 반응 조회
    const { data: reaction, error } = await supabaseServer
      .from('post_reactions')
      .select('reaction_type')
      .eq('post_id', postId)
      .eq('user_id', user.id)
      .single()

    if (error && error.code !== 'PGRST116') {
      console.error('[POST_REACTION_GET] 반응 조회 실패:', error)
      return NextResponse.json(
        { error: '반응 조회에 실패했습니다.' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      user_reaction: (reaction as any)?.reaction_type || null
    })

  } catch (error) {
    console.error('[POST_REACTION_GET] 서버 에러:', error)
    return NextResponse.json(
      { error: '서버 에러가 발생했습니다.' },
      { status: 500 }
    )
  }
}
