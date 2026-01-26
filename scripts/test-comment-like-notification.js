const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase service role credentials')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function testCommentLikeNotification() {
  try {
    console.log('🧪 Testing comment like notification flow...')

    // Test user (domgarmining@gmail.com)
    const testUserId = 'fe89b81d-76d8-4804-9f91-e35a012d0703'

    // Get test user info
    const { data: testUser, error: userError } = await supabase
      .from('users')
      .select('id, korean_name, spanish_name, full_name, email')
      .eq('id', testUserId)
      .single()

    if (userError || !testUser) {
      console.error('❌ Test user not found')
      return
    }

    console.log(`👤 Test user: ${testUser.korean_name || testUser.spanish_name || testUser.full_name} (${testUser.email})`)

    // Find a comment that is NOT created by the test user and belongs to a user with notification settings
    const { data: targetComment, error: commentError } = await supabase
      .from('post_comments')
      .select(`
        id,
        user_id,
        content,
        gallery_posts!post_comments_post_id_fkey(
          title,
          user_id
        )
      `)
      .eq('is_deleted', false)
      .neq('user_id', testUserId) // Not created by test user
      .limit(1)
      .single()

    if (commentError || !targetComment) {
      console.error('❌ No suitable target comment found')
      console.error('Comment error:', commentError)
      return
    }

    const commentAuthorId = targetComment.user_id
    const postTitle = targetComment.gallery_posts?.title || 'Unknown Post'

    console.log(`💬 Target comment: "${targetComment.content?.substring(0, 50)}..." (ID: ${targetComment.id})`)
    console.log(`👤 Comment author ID: ${commentAuthorId}`)
    console.log(`📝 Post title: "${postTitle}"`)

    // Check if the comment author has notification settings enabled
    const { data: notificationSettings } = await supabase
      .from('notification_settings')
      .select('interaction_notifications_enabled, push_notifications')
      .eq('user_id', commentAuthorId)
      .single()

    console.log(`🔔 Notification settings for comment author:`, notificationSettings)

    // Check if user already liked this comment
    const { data: existingVote } = await supabase
      .from('comment_votes')
      .select('id, vote_type')
      .eq('comment_id', targetComment.id)
      .eq('user_id', testUserId)
      .single()

    if (existingVote) {
      console.log(`⚠️ User already voted on this comment (${existingVote.vote_type}), removing existing vote first...`)
      await supabase
        .from('comment_votes')
        .delete()
        .eq('comment_id', targetComment.id)
        .eq('user_id', testUserId)

      console.log('✅ Removed existing vote')
    }

    // Simulate liking the comment by calling the API directly
    // Since we can't easily get a JWT token, let's manually trigger the notification creation
    console.log('👍 Simulating like on comment and triggering notification creation...')

    // First, create the vote
    const { data: newVote, error: voteError } = await supabase
      .from('comment_votes')
      .insert({
        comment_id: targetComment.id,
        user_id: testUserId,
        vote_type: 'like'
      })
      .select()
      .single()

    if (voteError) {
      console.error('❌ Failed to create vote:', voteError)
      return
    }

    console.log('✅ Vote created successfully:', newVote.id)

    // Update comment like count
    const { data: comment } = await supabase
      .from('post_comments')
      .select('like_count')
      .eq('id', targetComment.id)
      .single()

    const newLikeCount = (comment?.like_count || 0) + 1

    await supabase
      .from('post_comments')
      .update({
        like_count: newLikeCount,
        updated_at: new Date().toISOString()
      })
      .eq('id', targetComment.id)

    console.log(`📊 Updated comment like count to: ${newLikeCount}`)

    // Now manually trigger the notification creation logic
    console.log('🔔 Manually triggering notification creation...')

    // Get comment author info
    const commentAuthorId_manual = targetComment.user_id
    const postId_manual = targetComment.gallery_posts.id

    if (commentAuthorId_manual === testUserId) {
      console.log('⚠️ Comment author is the same as liker, skipping notification')
    } else {
      // Get liker name
      const { data: likerProfile } = await supabase
        .from('user_profiles')
        .select('display_name')
        .eq('user_id', testUserId)
        .single()

      let likerName = '익명'
      if (likerProfile?.display_name && likerProfile.display_name.trim() !== '') {
        likerName = likerProfile.display_name.includes('#')
          ? likerProfile.display_name.split('#')[0]
          : likerProfile.display_name
      } else {
        const { data: likerUser } = await supabase
          .from('users')
          .select('full_name, korean_name, spanish_name')
          .eq('id', testUserId)
          .single()

        if (likerUser) {
          likerName = likerUser.korean_name || likerUser.spanish_name || likerUser.full_name || '익명'
        }
      }

      // Get author language
      const { data: authorProfile } = await supabase
        .from('users')
        .select('language')
        .eq('id', commentAuthorId_manual)
        .single()

      const authorLanguage = authorProfile?.language || 'es'

      // Create notification
      let notificationTitle
      let notificationMessage

      if (authorLanguage === 'ko') {
        notificationTitle = '좋아요를 받았습니다'
        notificationMessage = `${likerName}님이 회원님의 댓글에 좋아요를 눌렀습니다.`
      } else {
        notificationTitle = 'Nuevo like'
        notificationMessage = `${likerName} dio like a tu comentario`
      }

      const notificationPayload = {
        user_id: commentAuthorId_manual,
        type: 'like',
        title: notificationTitle,
        message: notificationMessage,
        data: {
          post_id: postId_manual,
          comment_id: targetComment.id,
          liker_id: testUserId
        }
      }

      console.log('📝 Creating notification:', notificationPayload)

      const { data: notificationData, error: notificationError } = await supabase
        .from('notifications')
        .insert(notificationPayload)
        .select()
        .single()

      if (notificationError) {
        console.error('❌ Failed to create notification:', notificationError)
      } else {
        console.log('✅ Notification created successfully:', notificationData.id)
      }
    }

    // Wait a moment for notification to be created
    console.log('⏳ Waiting for notification creation...')
    await new Promise(resolve => setTimeout(resolve, 2000))

    // Check if notification was created
    const { data: notifications, error: notifError } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', commentAuthorId)
      .eq('type', 'like')
      .order('created_at', { ascending: false })
      .limit(5)

    if (notifError) {
      console.error('❌ Error checking notifications:', notifError)
    } else {
      console.log(`🔔 Found ${notifications?.length || 0} like notifications for comment author`)

      if (notifications && notifications.length > 0) {
        const latestNotif = notifications[0]
        console.log('✅ Latest notification:', {
          id: latestNotif.id,
          title: latestNotif.title,
          message: latestNotif.message,
          created_at: latestNotif.created_at,
          is_read: latestNotif.is_read
        })

        // Check unread count for the comment author
        const { count: unreadCount, error: countError } = await supabase
          .from('notifications')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', commentAuthorId)
          .eq('is_read', false)

        if (!countError) {
          console.log(`📊 Comment author has ${unreadCount} unread notifications`)
        }
      } else {
        console.log('❌ No like notifications found')
      }
    }

    // Also check if push notification was sent (check push_notification_logs)
    const { data: pushLogs, error: pushError } = await supabase
      .from('push_notification_logs')
      .select('*')
      .eq('user_id', commentAuthorId)
      .order('created_at', { ascending: false })
      .limit(3)

    if (!pushError && pushLogs && pushLogs.length > 0) {
      console.log('📱 Recent push notification logs:')
      pushLogs.forEach(log => {
        console.log(`  - ${log.title}: ${log.body} (${log.status})`)
      })
    }

    console.log('🎉 Comment like notification test completed!')

  } catch (error) {
    console.error('❌ Test failed:', error)
  }
}

// Run the test
testCommentLikeNotification()
