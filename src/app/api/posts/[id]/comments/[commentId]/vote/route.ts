import { NextRequest, NextResponse } from 'next/server'
import { supabaseServer } from '@/lib/supabaseServer'

// 댓글 투표 (좋아요/싫어요)
export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string; commentId: string }> }
) {
  const params = await context.params
  try {
    if (!supabaseServer) {
      return NextResponse.json(
        { error: '데이터베이스 연결이 설정되지 않았습니다.' },
        { status: 500 }
      )
    }

    const { id: postId, commentId } = params
    const body = await request.json()
    const { vote_type } = body

    console.log('[COMMENT_VOTE] 댓글 투표:', { postId, commentId, vote_type })

    // Authorization 헤더에서 토큰 추출
    const authHeader = request.headers.get('Authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: '인증이 필요합니다.' },
        { status: 401 }
      )
    }

    const token = authHeader.substring(7)

    // 토큰으로 사용자 인증
    const { data: { user }, error: authError } = await supabaseServer.auth.getUser(token)

    if (authError || !user) {
      return NextResponse.json(
        { error: '유효하지 않은 토큰입니다.' },
        { status: 401 }
      )
    }

    // 댓글 존재 확인
    const { data: comment, error: commentError } = await supabaseServer
      .from('post_comments')
      .select('id, like_count, dislike_count')
      .eq('id', commentId)
      .eq('post_id', postId)
      .eq('is_deleted', false)
      .single()

    if (commentError || !comment) {
      return NextResponse.json(
        { error: '댓글을 찾을 수 없습니다.' },
        { status: 404 }
      )
    }

    // 기존 투표 확인
    const { data: existingVote, error: voteError } = await supabaseServer
      .from('comment_votes')
      .select('vote_type')
      .eq('comment_id', commentId)
      .eq('user_id', user.id)
      .single()

    let newVoteType: 'like' | 'dislike' | null = null
    let newLikeCount = comment.like_count || 0
    let newDislikeCount = comment.dislike_count || 0

    if (existingVote) {
      // 기존 투표가 있는 경우
      if (existingVote.vote_type === vote_type) {
        // 같은 투표를 다시 누르면 취소
        await supabaseServer
          .from('comment_votes')
          .delete()
          .eq('comment_id', commentId)
          .eq('user_id', user.id)

        if (vote_type === 'like') {
          newLikeCount = Math.max(0, newLikeCount - 1)
        } else {
          newDislikeCount = Math.max(0, newDislikeCount - 1)
        }
      } else {
        // 다른 투표로 변경
        await supabaseServer
          .from('comment_votes')
          .update({ vote_type })
          .eq('comment_id', commentId)
          .eq('user_id', user.id)

        newVoteType = vote_type

        if (vote_type === 'like') {
          newLikeCount += 1
          if (existingVote.vote_type === 'dislike') {
            newDislikeCount = Math.max(0, newDislikeCount - 1)
          }
        } else {
          newDislikeCount += 1
          if (existingVote.vote_type === 'like') {
            newLikeCount = Math.max(0, newLikeCount - 1)
          }
        }
      }
    } else {
      // 새로운 투표
      await supabaseServer
        .from('comment_votes')
        .insert({
          comment_id: commentId,
          user_id: user.id,
          vote_type
        })

      newVoteType = vote_type

      if (vote_type === 'like') {
        newLikeCount += 1
      } else {
        newDislikeCount += 1
      }
    }

    // 댓글의 좋아요/싫어요 수 업데이트
    const { error: updateError } = await supabaseServer
      .from('post_comments')
      .update({
        like_count: newLikeCount,
        dislike_count: newDislikeCount,
        updated_at: new Date().toISOString()
      })
      .eq('id', commentId)

    if (updateError) {
      console.error('[COMMENT_VOTE] 댓글 업데이트 실패:', updateError)
      return NextResponse.json(
        { error: '댓글 투표 업데이트에 실패했습니다.' },
        { status: 500 }
      )
    }

    console.log('[COMMENT_VOTE] 댓글 투표 성공:', {
      commentId,
      voteType: newVoteType,
      likeCount: newLikeCount,
      dislikeCount: newDislikeCount
    })

    // 새로운 좋아요 알림 생성 (좋아요를 눌렀을 때만)
    if (newVoteType === 'like') {
      console.log('[COMMENT_VOTE] 좋아요 알림 생성 시작 - vote_type:', newVoteType)
      try {
        console.log('[COMMENT_VOTE] 좋아요 알림 생성 시도')

        // 댓글 정보 및 작성자 조회
        const { data: commentData, error: commentDataError } = await supabaseServer
          .from('post_comments')
          .select(`
            id,
            user_id,
            gallery_posts!post_comments_post_id_fkey(
              title,
              user_id
            )
          `)
          .eq('id', commentId)
          .single()

        if (commentDataError || !commentData) {
          console.error('[COMMENT_VOTE] 댓글 정보 조회 실패:', commentDataError)
        } else {
          const commentAuthorId = commentData.user_id
          const postTitle = commentData.gallery_posts?.title || '게시물'

          // 댓글 작성자와 좋아요 누른 사람이 다른 경우에만 알림 생성
          if (commentAuthorId && commentAuthorId !== user.id) {
            console.log('[COMMENT_VOTE] 알림 생성 조건 통과:', {
              commentAuthor: commentAuthorId,
              liker: user.id,
              isDifferentUser: commentAuthorId !== user.id
            })

            // 알림 설정 확인
            const { data: notificationSettings, error: settingsError } = await supabaseServer
              .from('notification_settings')
              .select('interaction_notifications_enabled, push_notifications')
              .eq('user_id', commentAuthorId)
              .single()

            console.log('[COMMENT_VOTE] Notification settings:', notificationSettings, 'Error:', settingsError?.message)

            // 알림 설정이 켜져있고 푸시가 활성화된 경우에만 발송
            // 설정이 없거나 조회 실패하면 기본적으로 활성화로 간주
            const hasSettings = !settingsError && notificationSettings
            const interactionEnabled = hasSettings ? notificationSettings.interaction_notifications_enabled !== false : true
            const pushEnabled = hasSettings ? notificationSettings.push_notifications !== false : true

            if (interactionEnabled && pushEnabled) {
              console.log('[COMMENT_VOTE] Notification settings allow sending')

              // 좋아요 누른 사용자 이름 조회
              const { data: likerProfile } = await supabaseServer
                .from('user_profiles')
                .select('display_name')
                .eq('user_id', user.id)
                .single()

              let likerName = '익명'
              if (likerProfile?.display_name && likerProfile.display_name.trim() !== '') {
                likerName = likerProfile.display_name.includes('#')
                  ? likerProfile.display_name.split('#')[0]
                  : likerProfile.display_name
              } else {
                // user_profiles에 없으면 users 테이블에서 조회
                const { data: likerUser } = await supabaseServer
                  .from('users')
                  .select('full_name, korean_name, spanish_name')
                  .eq('id', user.id)
                  .single()

                if (likerUser) {
                  likerName = likerUser.korean_name || likerUser.spanish_name || likerUser.full_name || '익명'
                }
              }

              // 댓글 작성자의 언어 설정 확인
              const { data: authorProfile } = await supabaseServer
                .from('users')
                .select('language')
                .eq('id', commentAuthorId)
                .single()

              const authorLanguage = authorProfile?.language || 'es' // 기본값 스페인어

              // 번역된 알림 생성
              let notificationTitle: string
              let notificationMessage: string

              if (authorLanguage === 'ko') {
                notificationTitle = '좋아요를 받았습니다'
                notificationMessage = `${likerName}님이 회원님의 댓글에 좋아요를 눌렀습니다.`
              } else {
                notificationTitle = 'Nuevo like'
                notificationMessage = `${likerName} dio like a tu comentario`
              }

              // 알림 생성
              const notificationPayload = {
                user_id: commentAuthorId, // 댓글 작성자
                type: 'like',
                title: notificationTitle,
                message: notificationMessage,
                data: {
                  post_id: postId,
                  comment_id: commentId,
                  liker_id: user.id
                }
              }

              console.log('[COMMENT_VOTE] 좋아요 알림 생성 페이로드:', notificationPayload)

              const { data: notificationData, error: notificationError } = await supabaseServer
                .from('notifications')
                .insert(notificationPayload)
                .select()
                .single()

              if (notificationError) {
                console.error('[COMMENT_VOTE] 좋아요 알림 생성 실패:', {
                  error: notificationError,
                  code: notificationError.code,
                  message: notificationError.message,
                  details: notificationError.details,
                  hint: notificationError.hint
                })
              } else {
                console.log('[COMMENT_VOTE] 좋아요 알림 생성 성공:', notificationData.id)
              }
            }
          }
        }
      } catch (notificationError) {
        console.error('[COMMENT_VOTE] 좋아요 알림 생성 예외:', notificationError)
        // 알림 생성 실패해도 투표는 성공으로 처리
      }
    }

    return NextResponse.json({
      success: true,
      vote_type: newVoteType,
      like_count: newLikeCount,
      dislike_count: newDislikeCount
    })

  } catch (error) {
    console.error('[COMMENT_VOTE] 서버 오류:', error)
    return NextResponse.json(
      { error: '댓글 투표 처리에 실패했습니다.' },
      { status: 500 }
    )
  }
}

// 댓글 투표 정보 조회
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string; commentId: string } }
) {
  try {
    if (!supabaseServer) {
      return NextResponse.json(
        { error: '데이터베이스 연결이 설정되지 않았습니다.' },
        { status: 500 }
      )
    }

    const { id: postId, commentId } = params

    // Authorization 헤더에서 토큰 추출
    const authHeader = request.headers.get('Authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: '인증이 필요합니다.' },
        { status: 401 }
      )
    }

    const token = authHeader.substring(7)

    // 토큰으로 사용자 인증
    const { data: { user }, error: authError } = await supabaseServer.auth.getUser(token)

    if (authError || !user) {
      return NextResponse.json(
        { error: '유효하지 않은 토큰입니다.' },
        { status: 401 }
      )
    }

    // 사용자의 투표 정보 조회
    const { data: vote, error: voteError } = await supabaseServer
      .from('comment_votes')
      .select('vote_type')
      .eq('comment_id', commentId)
      .eq('user_id', user.id)
      .single()

    if (voteError && voteError.code !== 'PGRST116') {
      console.error('[COMMENT_VOTE_GET] 투표 정보 조회 실패:', voteError)
      return NextResponse.json(
        { error: '투표 정보 조회에 실패했습니다.' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      vote_type: vote?.vote_type || null
    })

  } catch (error) {
    console.error('[COMMENT_VOTE_GET] 서버 오류:', error)
    return NextResponse.json(
      { error: '투표 정보 조회에 실패했습니다.' },
      { status: 500 }
    )
  }
}
