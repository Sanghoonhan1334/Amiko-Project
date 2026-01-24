const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase service role credentials')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function simulateCommentNotification() {
  try {
    console.log('🧪 Simulating comment notification flow...')

    // Test user (domgarmining@gmail.com)
    const testUserId = 'fe89b81d-76d8-4804-9f91-e35a012d0703'

    // Find a post to comment on (by a user who has FCM tokens)
    const { data: availablePosts, error: postsError } = await supabase
      .from('gallery_posts')
      .select('id, user_id, title')
      .eq('is_deleted', false)
      .neq('user_id', testUserId) // Not owned by test user
      .in('user_id', ['f701b47b-1bdc-4d4d-9c87-fcef36d6d09c']) // Users who have tokens
      .limit(1)

    if (postsError || !availablePosts || availablePosts.length === 0) {
      console.error('❌ No available posts to comment on')
      return
    }

    const targetPost = availablePosts[0]
    console.log(`📝 Simulating comment on post: "${targetPost.title}" (ID: ${targetPost.id})`)
    console.log(`👤 Post author: ${targetPost.user_id}`)

    // Create a comment directly in database
    const commentContent = `Test comment from ${new Date().toISOString()}`
    console.log(`💬 Creating comment: "${commentContent}"`)

    const { data: newComment, error: commentError } = await supabase
      .from('post_comments')
      .insert({
        post_id: targetPost.id,
        user_id: testUserId,
        content: commentContent,
        like_count: 0,
        dislike_count: 0,
        is_deleted: false
      })
      .select('id, user_id, content, created_at')
      .single()

    if (commentError) {
      console.error('❌ Failed to create comment:', commentError)
      return
    }

    console.log(`✅ Comment created: ${newComment.id}`)

    // Manually trigger notification creation by calling the API
    console.log('🔔 Manually triggering notification creation...')
    const notificationResponse = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/notifications/test-comment-notification`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        postId: targetPost.id,
        commentId: newComment.id,
        commentAuthorId: testUserId
      })
    })

    const notificationResult = await notificationResponse.json()
    if (notificationResponse.ok) {
      console.log('✅ Notification creation triggered:', notificationResult)
    } else {
      console.log('⚠️  Notification creation failed:', notificationResponse.status, notificationResult)
    }

    // Check if notification was created
    console.log('🔔 Checking for notification creation...')

    // Wait a moment for the notification to be created
    await new Promise(resolve => setTimeout(resolve, 1000))

    const { data: notifications, error: notifError } = await supabase
      .from('notifications')
      .select('id, user_id, type, title, message, created_at, is_read')
      .eq('user_id', targetPost.user_id)
      .eq('type', 'comment')
      .order('created_at', { ascending: false })
      .limit(1)

    if (notifError) {
      console.error('❌ Failed to check notifications:', notifError)
    } else if (notifications && notifications.length > 0) {
      const notification = notifications[0]
      console.log('✅ Notification created:', {
        id: notification.id,
        type: notification.type,
        title: notification.title,
        message: notification.message.substring(0, 100) + '...',
        is_read: notification.is_read
      })
    } else {
      console.log('⚠️  No notification found')
    }

    // Test push notification
    console.log('🚀 Testing push notification...')

    const pushResponse = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/notifications/send-push`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        userId: targetPost.user_id,
        title: 'Test Comment Notification',
        body: `New comment on your post: ${commentContent.substring(0, 50)}...`,
        data: {
          type: 'comment',
          postId: targetPost.id,
          commentId: newComment.id
        }
      })
    })

    if (pushResponse.ok) {
      const pushResult = await pushResponse.json()
      console.log('✅ Push notification sent:', pushResult)
    } else {
      const pushError = await pushResponse.text()
      console.log('❌ Push notification failed:', pushResponse.status, pushError)
    }

    // Clean up test comment
    console.log('🧹 Cleaning up test comment...')
    await supabase
      .from('post_comments')
      .delete()
      .eq('id', newComment.id)

    console.log('✅ Test completed')

  } catch (error) {
    console.error('❌ Test failed:', error)
  }
}

simulateCommentNotification()
