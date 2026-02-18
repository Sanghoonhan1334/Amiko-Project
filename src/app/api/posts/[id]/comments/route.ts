import { NextRequest, NextResponse } from 'next/server'
import { supabaseServer } from '@/lib/supabaseServer'

// 댓글 목록 조회
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

    // 사용자 정보 조회 (user_profiles 우선, users fallback)
    const usersMap: { [key: string]: any } = {}

    if (userIds.length > 0) {
      await Promise.all(userIds.map(async (userId) => {
        let userName = null
        let avatarUrl = null

        // 먼저 user_profiles 테이블에서 조회
        const { data: profileData, error: profileError } = await supabaseServer
          .from('user_profiles')
          .select('display_name, avatar_url')
          .eq('user_id', userId)
          .single()

        // user_profiles에 데이터가 있고 display_name이 있으면 우선 사용
        if (!profileError && profileData && profileData.display_name && profileData.display_name.trim() !== '') {
          // # 이후 부분 제거 (예: "parkg9832#c017" → "parkg9832")
          userName = profileData.display_name.includes('#')
            ? profileData.display_name.split('#')[0]
            : profileData.display_name

          avatarUrl = profileData.avatar_url

          // avatar_url을 공개 URL로 변환
          if (avatarUrl && avatarUrl.trim() !== '' && !avatarUrl.startsWith('http')) {
            const { data: { publicUrl } } = supabaseServer.storage
              .from('profile-images')
              .getPublicUrl(avatarUrl)
            avatarUrl = publicUrl
          }
        }

        // user_profiles에 데이터가 없거나 display_name이 없으면 users 테이블 조회
        if (!userName) {
          const { data: userData, error: usersError } = await supabaseServer
            .from('users')
            .select('id, full_name, korean_name, spanish_name, nickname, avatar_url, profile_image')
            .eq('id', userId)
            .single()

          if (!usersError && userData) {
            // 우선순위: korean_name > spanish_name > full_name > 익명
            userName = userData.korean_name || userData.spanish_name || userData.full_name || '익명'
            avatarUrl = userData.profile_image || userData.avatar_url
          }
        }

        usersMap[userId] = {
          id: userId,
          full_name: userName || '익명',
          profile_image: avatarUrl
        }
      }))
    }

    // 댓글 데이터 변환
    const transformedComments = comments?.map(comment => {
      const user = usersMap[comment.user_id] || { id: comment.user_id, full_name: '익명', avatar_url: null, profile_image: null }
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

    const { id: postId } = params
    const body = await request.json()
    const { content, parent_comment_id } = body

    console.log('[COMMENTS_POST] 댓글 작성:', { postId, content: content?.substring(0, 50), parent_comment_id })

    // Authorization 헤더에서 토큰 추출
    const authHeader = request.headers.get('Authorization')
    let authUser = null

    if (!authHeader) {
      console.error('[COMMENTS_POST] Authorization 헤더 없음')
      return NextResponse.json({ error: '인증이 필요합니다.' }, { status: 401 })
    }

    const token = authHeader.split(' ')[1]
    const { data: { user }, error: authError } = await supabaseServer.auth.getUser(token)

    if (authError || !user) {
      console.error('[COMMENTS_POST] 인증 실패:', authError?.message)
      return NextResponse.json({ error: '인증이 필요합니다.' }, { status: 401 })
    }

    authUser = user

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

    // 사용자 정보 조회 (user_profiles 우선, users fallback) - 알림 생성에 필요
    let userName = null
    let avatarUrl = null

    // 먼저 user_profiles 테이블에서 조회
    const { data: profileData, error: profileError } = await supabaseServer
      .from('user_profiles')
      .select('display_name, avatar_url')
      .eq('user_id', newComment.user_id)
      .single()

    // user_profiles에 데이터가 있고 display_name이 있으면 우선 사용
    if (!profileError && profileData && profileData.display_name && profileData.display_name.trim() !== '') {
      // # 이후 부분 제거 (예: "parkg9832#c017" → "parkg9832")
      userName = profileData.display_name.includes('#')
        ? profileData.display_name.split('#')[0]
        : profileData.display_name

      avatarUrl = profileData.avatar_url

      // avatar_url을 공개 URL로 변환
      if (avatarUrl && avatarUrl.trim() !== '' && !avatarUrl.startsWith('http')) {
        const { data: { publicUrl } } = supabaseServer.storage
          .from('profile-images')
          .getPublicUrl(avatarUrl)
        avatarUrl = publicUrl
      }
    }

    // user_profiles에 데이터가 없거나 display_name이 없으면 users 테이블 조회
    if (!userName) {
      const { data: userData, error: usersError } = await supabaseServer
        .from('users')
        .select('id, full_name, korean_name, spanish_name, nickname, avatar_url, profile_image')
        .eq('id', newComment.user_id)
        .single()

      if (!usersError && userData) {
        // 우선순위: korean_name > spanish_name > full_name > 익명
        userName = userData.korean_name || userData.spanish_name || userData.full_name || '익명'
        avatarUrl = userData.profile_image || userData.avatar_url
      }
    }

    // 게시물 정보 조회 (작성자에게 알림 보내기 위해)
    console.log('[COMMENTS_POST] 게시물 정보 조회 시작:', postId)
    const { data: postData, error: postError } = await supabaseServer
      .from('gallery_posts')
      .select('user_id, title')
      .eq('id', postId)
      .single()

    console.log('[COMMENTS_POST] 게시물 조회 결과:', {
      postError: postError?.message,
      postData: postData ? { user_id: postData.user_id, title: postData.title?.substring(0, 30) } : null,
      commentUserId: newComment.user_id,
      isSameUser: postData?.user_id === newComment.user_id
    })

    // 게시물 작성자에게 알림 생성 (댓글 작성자가 게시물 작성자와 다른 경우만)
    // 인증 여부와 관계없이 알림 생성
    if (!postError && postData && postData.user_id && postData.user_id !== newComment.user_id) {
      console.log('[COMMENTS_POST] 알림 생성 조건 통과:', {
        hasPostData: !!postData,
        hasPostUserId: !!postData.user_id,
        isDifferentUser: postData.user_id !== newComment.user_id
      })
      try {
        // 알림 설정 확인
        const { data: notificationSettings } = await supabaseServer
          .from('notification_settings')
          .select('interaction_notifications_enabled, push_notifications')
          .eq('user_id', postData.user_id)
          .single()

        console.log('[COMMENTS_POST] Notification settings:', notificationSettings)

        // 알림 설정이 켜져있고 푸시가 활성화된 경우에만 발송
        if (notificationSettings?.interaction_notifications_enabled !== false && notificationSettings?.push_notifications !== false) {
          console.log('[COMMENTS_POST] Notification settings allow sending')

          // 댓글 작성자 이름 사용 (위에서 조회한 userName)
          const commentAuthorName = userName || '익명'

        console.log('[COMMENTS_POST] 알림 생성 시도:', {
          postAuthor: postData.user_id,
          commentAuthor: newComment.user_id,
          commentAuthorName,
          postTitle: postData.title
        })

        // Get post author's language preference
        const { data: authorProfile } = await supabaseServer
          .from('users')
          .select('language')
          .eq('id', postData.user_id)
          .single()

        const authorLanguage = authorProfile?.language || 'es' // Default to Spanish

        // Create notification with proper translations
        let notificationTitle: string
        let notificationMessage: string

        if (authorLanguage === 'ko') {
          notificationTitle = '새로운 댓글이 달렸습니다'
          notificationMessage = `${commentAuthorName}님이 "${postData.title?.substring(0, 30) || '게시물'}"에 댓글을 남겼습니다.`
        } else {
          notificationTitle = 'Nuevo comentario'
          notificationMessage = `${commentAuthorName} comentó en tu publicación "${postData.title?.substring(0, 30) || 'Publicación'}"`
        }

        // 알림 생성 (인증 여부와 관계없이 생성)
        const notificationPayload = {
          user_id: postData.user_id, // 게시물 작성자
          type: 'comment',
          title: notificationTitle,
          message: notificationMessage,
          data: {
            post_id: postId,
            comment_id: newComment.id,
            comment_author_id: newComment.user_id
          }
        }

        console.log('[COMMENTS_POST] 알림 생성 페이로드:', notificationPayload)

        const { data: notificationData, error: notificationError } = await supabaseServer
          .from('notifications')
          .insert(notificationPayload)
          .select()
          .single()

        if (notificationError) {
          console.error('[COMMENTS_POST] 알림 생성 실패:', {
            error: notificationError,
            code: notificationError.code,
            message: notificationError.message,
            details: notificationError.details,
            hint: notificationError.hint
          })
          // 알림 생성 실패해도 댓글은 생성됨
        } else {
          console.log('[COMMENTS_POST] 알림 생성 성공:', {
            id: notificationData?.id,
            user_id: notificationData?.user_id,
            type: notificationData?.type,
            is_read: notificationData?.is_read
          })

          // 푸시 알림 발송 시도
          try {
            console.log('[COMMENTS_POST] 푸시 알림 발송 시도:', {
              userId: postData.user_id,
              title: notificationPayload.title,
              message: notificationPayload.message
            })

            // Use localhost in development, app URL in production
            const baseUrl = process.env.NODE_ENV === 'development'
              ? 'http://localhost:3000'
              : (process.env.NEXT_PUBLIC_APP_URL || 'https://helloamiko.com')

            const pushResponse = await fetch(`${baseUrl}/api/notifications/send-push`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                userId: postData.user_id,
                title: notificationPayload.title,
                body: notificationPayload.message,
                data: {
                  type: 'comment',
                  postId: postId,
                  commentId: newComment.id,
                  commentAuthor: commentAuthorName,
                  postTitle: postData.title?.substring(0, 30) || '게시물',
                  url: `/posts/${postId}#comment-${newComment.id}`
                }
              })
            })

            if (pushResponse.ok) {
              const pushResult = await pushResponse.json()
              console.log('[COMMENTS_POST] 푸시 알림 발송 성공:', pushResult)
            } else {
              const pushError = await pushResponse.text()
              console.error('[COMMENTS_POST] 푸시 알림 발송 실패:', pushResponse.status, pushError)
            }
          } catch (pushError) {
            console.error('[COMMENTS_POST] 푸시 알림 발송 예외:', pushError)
            // 푸시 알림 실패해도 댓글은 생성됨
          }
        }
        } else {
          console.log('[COMMENTS_POST] Notification settings do not allow sending')
        }
      } catch (notificationErr) {
        console.error('[COMMENTS_POST] 알림 생성 예외:', notificationErr)
        // 알림 생성 실패해도 댓글은 생성됨
      }
    } else {
      if (postError) {
        console.error('[COMMENTS_POST] 게시물 조회 실패:', postError)
      } else if (!postData) {
        console.warn('[COMMENTS_POST] 게시물 데이터 없음')
      } else if (!postData.user_id) {
        console.warn('[COMMENTS_POST] 게시물 작성자 ID 없음')
      } else if (postData.user_id === newComment.user_id) {
        console.log('[COMMENTS_POST] 댓글 작성자가 게시물 작성자와 동일 - 알림 생성 안 함')
      }
    }

    // 게시글의 댓글 수 업데이트
    const { error: updateError } = await supabaseServer.rpc('increment_comment_count', {
      post_id: postId
    })

    if (updateError) {
      console.error('[COMMENTS_POST] 댓글 수 업데이트 실패:', updateError)
      // 댓글은 생성되었으므로 에러를 반환하지 않음
    }

    // 포인트 지급 (댓글 작성 - 75점 체계)
    let pointsAwarded = 0
    try {
      const { data: pointResult, error: pointError } = await supabaseServer.rpc('add_points_with_limit', {
        p_user_id: newComment.user_id,
        p_type: 'comment_post',
        p_amount: 1,
        p_description: '댓글 작성',
        p_related_id: newComment.id,
        p_related_type: 'comment'
      })

      if (pointError) {
        console.error('[COMMENTS_POST] 포인트 적립 실패:', pointError)
        // 포인트 적립 실패해도 댓글은 생성됨
      } else if (pointResult) {
        console.log('[COMMENTS_POST] 포인트 적립 성공: +1점')
        pointsAwarded = 1
      } else {
        console.log('[COMMENTS_POST] 일일 한도 초과 또는 횟수 제한')
      }
    } catch (pointError) {
      console.error('[COMMENTS_POST] 포인트 적립 예외:', pointError)
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
        id: newComment.user_id,
        full_name: userName || '익명',
        profile_image: avatarUrl
      }
    }

    return NextResponse.json(
      {
        success: true,
        comment: transformedComment,
        message: '댓글이 성공적으로 작성되었습니다.',
        pointsAwarded: pointsAwarded // 포인트 지급 정보 추가
      },
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

