import { NextRequest, NextResponse } from 'next/server'
import { supabaseServer } from '@/lib/supabaseServer'

export async function POST(request: NextRequest) {
  try {
    const { postId, commentId, commentAuthorId } = await request.json()

    console.log('[TEST_COMMENT_NOTIFICATION] Triggering comment notification:', { postId, commentId, commentAuthorId })

    // Get post data
    const { data: postData, error: postError } = await supabaseServer
      .from('gallery_posts')
      .select('user_id, title')
      .eq('id', postId)
      .single()

    if (postError || !postData) {
      console.error('[TEST_COMMENT_NOTIFICATION] Post not found:', postError)
      return NextResponse.json({ error: 'Post not found' }, { status: 404 })
    }

    // Get comment author name
    const { data: commentUser } = await supabaseServer
      .from('users')
      .select('korean_name, spanish_name, full_name')
      .eq('id', commentAuthorId)
      .single()

    const commentAuthorName = commentUser?.korean_name || commentUser?.spanish_name || commentUser?.full_name || '익명'

    // Get post author's language preference
    const { data: authorProfile } = await supabaseServer
      .from('users')
      .select('language')
      .eq('id', postData.user_id)
      .single()

    const authorLanguage = authorProfile?.language || 'es'

    // Check notification settings
    const { data: notificationSettings } = await supabaseServer
      .from('notification_settings')
      .select('interaction_notifications_enabled, push_notifications')
      .eq('user_id', postData.user_id)
      .single()

    console.log('[TEST_COMMENT_NOTIFICATION] Notification settings:', notificationSettings)

    if (notificationSettings?.interaction_notifications_enabled !== false && notificationSettings?.push_notifications !== false) {
      // Create notification
      let notificationTitle: string
      let notificationMessage: string

      if (authorLanguage === 'ko') {
        notificationTitle = '새로운 댓글이 달렸습니다'
        notificationMessage = `${commentAuthorName}님이 "${postData.title?.substring(0, 30) || '게시물'}"에 댓글을 남겼습니다.`
      } else {
        notificationTitle = 'Nuevo comentario'
        notificationMessage = `${commentAuthorName} comentó en tu publicación "${postData.title?.substring(0, 30) || 'Publicación'}"`
      }

      const notificationPayload = {
        user_id: postData.user_id,
        type: 'comment',
        title: notificationTitle,
        message: notificationMessage,
        data: {
          postId: postId,
          commentId: commentId,
          commentAuthor: commentAuthorName,
          postTitle: postData.title?.substring(0, 30) || '게시물',
          url: `/posts/${postId}#comment-${commentId}`
        }
      }

      const { data: notificationData, error: notificationError } = await supabaseServer
        .from('notifications')
        .insert(notificationPayload)
        .select()
        .single()

      if (notificationError) {
        console.error('[TEST_COMMENT_NOTIFICATION] Notification creation failed:', notificationError)
        return NextResponse.json({ error: 'Notification creation failed' }, { status: 500 })
      }

      console.log('[TEST_COMMENT_NOTIFICATION] Notification created:', notificationData.id)

      // Try to send push notification
      try {
        const pushResponse = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/notifications/send-push`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            userId: postData.user_id,
            title: notificationPayload.title,
            body: notificationPayload.message,
            data: notificationPayload.data
          })
        })

        if (pushResponse.ok) {
          console.log('[TEST_COMMENT_NOTIFICATION] Push notification sent')
        } else {
          console.log('[TEST_COMMENT_NOTIFICATION] Push notification failed')
        }
      } catch (pushError) {
        console.error('[TEST_COMMENT_NOTIFICATION] Push notification error:', pushError)
      }

      return NextResponse.json({ success: true, notificationId: notificationData.id })
    } else {
      console.log('[TEST_COMMENT_NOTIFICATION] Notifications disabled for user')
      return NextResponse.json({ success: false, reason: 'notifications_disabled' })
    }

  } catch (error) {
    console.error('[TEST_COMMENT_NOTIFICATION] Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
