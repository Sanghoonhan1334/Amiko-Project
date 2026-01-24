import { NextRequest, NextResponse } from 'next/server'
import { supabaseServer } from '@/lib/supabaseServer'

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const params = await context.params
  try {
    const postId = params.id
    const authHeader = request.headers.get('authorization')

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({
        success: false,
        error: '인증이 필요합니다.'
      }, { status: 401 })
    }

    const token = authHeader.replace('Bearer ', '')

    // 토큰에서 사용자 정보 추출 (간단한 구현)
    // 실제로는 JWT 토큰을 디코딩해야 합니다
    const { data: { user }, error: userError } = await supabaseServer.auth.getUser(token)

    if (userError || !user) {
      return NextResponse.json({
        success: false,
        error: '유효하지 않은 토큰입니다.'
      }, { status: 401 })
    }

    // 사용자의 투표 정보 조회
    const { data: vote, error: voteError } = await supabaseServer
      .from('post_votes')
      .select('vote_type')
      .eq('post_id', postId)
      .eq('user_id', user.id)
      .single()

    if (voteError && voteError.code !== 'PGRST116') {
      console.error('투표 정보 조회 오류:', voteError)
      return NextResponse.json({
        success: false,
        error: '투표 정보를 조회할 수 없습니다.'
      }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      vote_type: vote?.vote_type || null
    })

  } catch (error) {
    console.error('투표 정보 조회 오류:', error)
    return NextResponse.json({
      success: false,
      error: '서버 오류가 발생했습니다.'
    }, { status: 500 })
  }
}

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const params = await context.params
  try {
    const postId = params.id
    const authHeader = request.headers.get('authorization')

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({
        success: false,
        error: '인증이 필요합니다.'
      }, { status: 401 })
    }

    const token = authHeader.replace('Bearer ', '')

    // 토큰에서 사용자 정보 추출
    const { data: { user }, error: userError } = await supabaseServer.auth.getUser(token)

    if (userError || !user) {
      return NextResponse.json({
        success: false,
        error: '유효하지 않은 토큰입니다.'
      }, { status: 401 })
    }

    const { vote_type } = await request.json()

    if (!vote_type || !['like', 'dislike'].includes(vote_type)) {
      return NextResponse.json({
        success: false,
        error: '유효하지 않은 투표 타입입니다.'
      }, { status: 400 })
    }

    // 게시글 존재 확인 및 작성자 정보 가져오기
    const { data: post, error: postError } = await supabaseServer
      .from('gallery_posts')
      .select('id, user_id, title')
      .eq('id', postId)
      .eq('is_deleted', false)
      .single()

    if (postError || !post) {
      return NextResponse.json({
        success: false,
        error: '게시글을 찾을 수 없습니다.'
      }, { status: 404 })
    }

    const postAuthorId = (post as any).user_id

    // 기존 투표 확인
    const { data: existingVote, error: existingVoteError } = await supabaseServer
      .from('post_votes')
      .select('vote_type')
      .eq('post_id', postId)
      .eq('user_id', user.id)
      .single()

    let newVoteType = vote_type
    let likeCountChange = 0
    let dislikeCountChange = 0

    if (existingVoteError && existingVoteError.code !== 'PGRST116') {
      console.error('기존 투표 조회 오류:', existingVoteError)
      return NextResponse.json({
        success: false,
        error: '투표 정보를 조회할 수 없습니다.'
      }, { status: 500 })
    }

    if (existingVote) {
      // 기존 투표가 있는 경우
      if (existingVote.vote_type === vote_type) {
        // 같은 투표를 다시 누르면 취소
        newVoteType = null
        if (vote_type === 'like') {
          likeCountChange = -1
        } else {
          dislikeCountChange = -1
        }
      } else {
        // 다른 투표로 변경
        if (vote_type === 'like') {
          likeCountChange = 1
          dislikeCountChange = -1
        } else {
          likeCountChange = -1
          dislikeCountChange = 1
        }
      }
    } else {
      // 새로운 투표
      if (vote_type === 'like') {
        likeCountChange = 1
      } else {
        dislikeCountChange = 1
      }
    }

    // 트랜잭션으로 투표 처리
    const { error: transactionError } = await supabaseServer.rpc('handle_post_vote', {
      p_post_id: postId,
      p_user_id: user.id,
      p_vote_type: newVoteType,
      p_like_change: likeCountChange,
      p_dislike_change: dislikeCountChange
    })

    if (transactionError) {
      console.error('투표 처리 오류:', transactionError)
      return NextResponse.json({
        success: false,
        error: '투표 처리 중 오류가 발생했습니다.'
      }, { status: 500 })
    }

    // 업데이트된 카운트 조회
    const { data: updatedPost, error: updatedPostError } = await supabaseServer
      .from('gallery_posts')
      .select('like_count, dislike_count')
      .eq('id', postId)
      .single()

    if (updatedPostError) {
      console.error('게시글 카운트 조회 오류:', updatedPostError)
      return NextResponse.json({
        success: false,
        error: '게시글 정보를 조회할 수 없습니다.'
      }, { status: 500 })
    }

    // 좋아요가 추가되었고, 본인 게시글이 아닌 경우 알림 발송
    if (newVoteType === 'like' && postAuthorId !== user.id) {
      console.log('[VOTE_API] Like notification condition met:', { newVoteType, postAuthorId, userId: user.id })

      try {
        // 알림 설정 확인
        const { data: notificationSettings } = await supabaseServer
          .from('notification_settings')
          .select('interaction_notifications_enabled, push_notifications')
          .eq('user_id', postAuthorId)
          .single()

        console.log('[VOTE_API] Notification settings:', notificationSettings)

        // 알림 설정이 켜져있고 푸시가 활성화된 경우에만 발송
        if (notificationSettings?.interaction_notifications_enabled !== false && notificationSettings?.push_notifications !== false) {
          console.log('[VOTE_API] Notification settings allow sending')
          // 좋아요를 누른 사용자 이름 가져오기
          const { data: likerUser } = await supabaseServer
            .from('users')
            .select('korean_name, spanish_name, full_name')
            .eq('id', user.id)
            .single()

          const likerName = likerUser?.korean_name || likerUser?.spanish_name || likerUser?.full_name || '누군가'

          // Get post author's language preference
          const { data: authorProfile } = await supabaseServer
            .from('users')
            .select('language')
            .eq('id', postAuthorId)
            .single()

          const authorLanguage = authorProfile?.language || 'es' // Default to Spanish

          // Create notification with proper translations
          let notificationTitle: string
          let notificationMessage: string

          if (authorLanguage === 'ko') {
            notificationTitle = '새로운 좋아요'
            notificationMessage = `${likerName}님이 "${(post as any).title?.substring(0, 30) || '게시물'}"에 좋아요를 눌렀습니다.`
          } else {
            notificationTitle = 'Nuevo like'
            notificationMessage = `A ${likerName} le gustó tu post "${(post as any).title?.substring(0, 30) || 'Publicación'}"`
          }

          // 알림 생성
          const notificationPayload = {
            user_id: postAuthorId,
            type: 'like',
            title: notificationTitle,
            message: notificationMessage,
            data: {
              postId: postId,
              related_id: postId // For backward compatibility
            }
          }

          console.log('[VOTE_API] 알림 생성 시도:', notificationPayload)

          const { data: notificationData, error: notificationError } = await supabaseServer
            .from('notifications')
            .insert(notificationPayload)
            .select()

          if (notificationError) {
            console.error('[VOTE_API] 알림 생성 실패:', notificationError)
          } else {
            console.log('[VOTE_API] 알림 생성 성공:', notificationData?.id)

            // 푸시 알림 발송 시도
            try {
              console.log('[VOTE_API] Sending push notification to user:', postAuthorId)

              // Use localhost in development, ngrok in production
              const baseUrl = process.env.NODE_ENV === 'development'
                ? 'http://localhost:3000'
                : (process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000')

              const pushResponse = await fetch(`${baseUrl}/api/notifications/send-push`, {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                  userId: postAuthorId,
                  title: notificationPayload.title,
                  body: notificationPayload.message,
                  data: {
                    type: 'like',
                    postId: postId,
                    postTitle: (post as any).title?.substring(0, 30) || '게시물',
                    likerName: likerName,
                    url: `/community/posts/${postId}`
                  },
                  tag: `post_liked_${postId}`
                })
              })

              console.log('[VOTE_API] Push response status:', pushResponse.status)

              if (pushResponse.ok) {
                const pushResult = await pushResponse.json()
                console.log('[VOTE_API] Push notification sent successfully:', pushResult)
              } else {
                const pushError = await pushResponse.text()
                console.error('[VOTE_API] Push notification failed:', pushResponse.status, pushError)
              }
            } catch (pushError) {
              console.error('[VOTE_API] Push notification exception:', pushError)
            }
          }
        }
      } catch (notificationError) {
        console.error('[VOTE_API] 알림 처리 중 오류:', notificationError)
        // 알림 오류는 무시하고 계속 진행
      }
    }

    return NextResponse.json({
      success: true,
      vote_type: newVoteType,
      like_count: updatedPost.like_count,
      dislike_count: updatedPost.dislike_count
    })

  } catch (error) {
    console.error('투표 처리 오류:', error)
    return NextResponse.json({
      success: false,
      error: '서버 오류가 발생했습니다.'
    }, { status: 500 })
  }
}
