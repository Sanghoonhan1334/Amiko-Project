const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase service role credentials')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function simulateLikeNotification() {
  try {
    console.log('🧪 Simulating like notification flow...')

    // Test user (domgarmining@gmail.com)
    const testUserId = 'fe89b81d-76d8-4804-9f91-e35a012d0703'

    // Find a post to "like" (by a user who has FCM tokens)
    const { data: availablePosts, error: postsError } = await supabase
      .from('gallery_posts')
      .select('id, user_id, title')
      .eq('is_deleted', false)
      .neq('user_id', testUserId) // Not owned by test user
      .in('user_id', ['f701b47b-1bdc-4d4d-9c87-fcef36d6d09c']) // Users who have tokens
      .limit(1)

    if (postsError || !availablePosts || availablePosts.length === 0) {
      console.error('❌ No available posts to like')
      return
    }

    const targetPost = availablePosts[0]
    console.log(`📝 Simulating like on post: "${targetPost.title}" (ID: ${targetPost.id})`)
    console.log(`👤 Post author: ${targetPost.user_id}`)

    // Check if user already liked this post
    const { data: existingReaction } = await supabase
      .from('post_reactions')
      .select('id')
      .eq('post_id', targetPost.id)
      .eq('user_id', testUserId)
      .eq('reaction_type', 'like')
      .single()

    if (existingReaction) {
      console.log('⚠️  User already liked this post, removing existing like first...')
      await supabase
        .from('post_reactions')
        .delete()
        .eq('post_id', targetPost.id)
        .eq('user_id', testUserId)
    }

    // Create the like reaction
    console.log('👍 Creating like reaction...')
    const { data: reaction, error: reactionError } = await supabase
      .from('post_reactions')
      .insert({
        post_id: targetPost.id,
        user_id: testUserId,
        reaction_type: 'like'
      })
      .select()
      .single()

    if (reactionError) {
      console.error('❌ Failed to create reaction:', reactionError)
      return
    }

    console.log('✅ Like reaction created:', reaction.id)

    // Update post like count
    const { data: likeCount } = await supabase
      .from('post_reactions')
      .select('id', { count: 'exact' })
      .eq('post_id', targetPost.id)
      .eq('reaction_type', 'like')

    await supabase
      .from('gallery_posts')
      .update({ like_count: likeCount?.length || 0 })
      .eq('id', targetPost.id)

    // Now simulate the notification logic from the reactions API
    console.log('🔔 Simulating notification creation...')

    // Check notification settings
    const { data: settings } = await supabase
      .from('notification_settings')
      .select('like_notifications_enabled, push_enabled')
      .eq('user_id', targetPost.user_id)
      .single()

    console.log('⚙️  Notification settings:', settings || 'Using defaults (enabled)')

    const likeNotificationsEnabled = settings?.like_notifications_enabled !== false
    const pushEnabled = settings?.push_enabled !== false

    console.log(`📢 Like notifications enabled: ${likeNotificationsEnabled}`)
    console.log(`📱 Push notifications enabled: ${pushEnabled}`)

    if (likeNotificationsEnabled && pushEnabled) {
      // Get liker user info
      const { data: likerUser } = await supabase
        .from('users')
        .select('korean_name, spanish_name, full_name')
        .eq('id', testUserId)
        .single()

      const likerName = likerUser?.korean_name || likerUser?.spanish_name || likerUser?.full_name || '누군가'

      // Get post author's language preference
      const { data: authorProfile } = await supabase
        .from('users')
        .select('language')
        .eq('id', targetPost.user_id)
        .single()

      const authorLanguage = authorProfile?.language || 'es' // Default to Spanish

      // Create notification with proper translations
      let notificationTitle
      let notificationMessage

      if (authorLanguage === 'ko') {
        notificationTitle = '새로운 좋아요'
        notificationMessage = `${likerName}님이 "${targetPost.title?.substring(0, 30) || '게시물'}"에 좋아요를 눌렀습니다.`
      } else {
        notificationTitle = 'Nuevo like'
        notificationMessage = `A ${likerName} le gustó tu post "${targetPost.title?.substring(0, 30) || 'Publicación'}"`
      }

      // Create notification
      const notificationPayload = {
        user_id: targetPost.user_id,
        type: 'like',
        title: notificationTitle,
        message: notificationMessage,
        data: {
          postId: targetPost.id,
          related_id: targetPost.id // For backward compatibility
        }
      }

      console.log('📝 Creating notification:', notificationPayload)

      const { data: notification, error: notifError } = await supabase
        .from('notifications')
        .insert(notificationPayload)
        .select()
        .single()

      if (notifError) {
        console.error('❌ Failed to create notification:', notifError)
        return
      }

      console.log('✅ Notification created:', notification.id)

      // Now call the send-push API
      console.log('🚀 Calling send-push API...')

      // Use localhost for development, ngrok for production
      const isDevelopment = process.env.NODE_ENV !== 'production'
      const apiUrl = isDevelopment ? 'http://localhost:3000' : (process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000')
      console.log(`🌐 Using API URL: ${apiUrl}`)
      const pushResponse = await fetch(`${apiUrl}/api/notifications/send-push`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: targetPost.user_id,
          title: notificationPayload.title,
          body: notificationPayload.message,
          data: {
            type: 'like',
            postId: targetPost.id,
            postTitle: targetPost.title?.substring(0, 30) || '게시물',
            likerName: likerName,
            url: `/community/posts/${targetPost.id}`
          },
          tag: `post_liked_${targetPost.id}`
        })
      })

      console.log(`📡 Push API Response: ${pushResponse.status}`)

      if (pushResponse.ok) {
        const pushResult = await pushResponse.json()
        console.log('✅ Push notification result:', pushResult)
      } else {
        const pushError = await pushResponse.text()
        console.error('❌ Push notification failed:', pushResponse.status, pushError)
      }

    } else {
      console.log('⚠️  Notifications disabled for this user')
    }

    // Clean up - remove the test like
    console.log('🧹 Cleaning up test like...')
    await supabase
      .from('post_reactions')
      .delete()
      .eq('post_id', targetPost.id)
      .eq('user_id', testUserId)

    console.log('✅ Test completed')

  } catch (error) {
    console.error('❌ ERROR:', error.message)
  }
}

simulateLikeNotification()
