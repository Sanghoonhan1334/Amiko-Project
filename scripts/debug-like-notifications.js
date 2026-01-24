const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function debugLikeNotifications() {
  try {
    console.log('🔍 Debugging like notifications...')

    // Get test user
    const testUserEmail = 'domgarmining@gmail.com'
    const { data: testUser, error: userError } = await supabase
      .from('users')
      .select('id, korean_name, spanish_name, full_name')
      .eq('email', testUserEmail)
      .single()

    if (userError || !testUser) {
      console.error('❌ Test user not found')
      return
    }

    console.log(`👤 Test user: ${testUser.korean_name || testUser.spanish_name || testUser.full_name} (${testUser.id})`)

    // Check user's notification settings
    const { data: settings, error: settingsError } = await supabase
      .from('notification_settings')
      .select('*')
      .eq('user_id', testUser.id)
      .single()

    console.log('⚙️  User notification settings:', settings || 'No settings found (defaults apply)')

    // Find posts that the user could like (not their own)
    const { data: availablePosts, error: postsError } = await supabase
      .from('gallery_posts')
      .select('id, user_id, title')
      .eq('is_deleted', false)
      .neq('user_id', testUser.id) // Not the user's own posts
      .limit(5)

    if (postsError) {
      console.error('❌ Error fetching posts:', postsError)
      return
    }

    console.log(`📝 Available posts to like (${availablePosts.length}):`)
    availablePosts.forEach(post => {
      console.log(`  - "${post.title}" (ID: ${post.id}) by user ${post.user_id}`)
    })

    // Check if user has any existing reactions
    const { data: userReactions, error: reactionsError } = await supabase
      .from('post_reactions')
      .select('post_id, reaction_type, created_at')
      .eq('user_id', testUser.id)
      .order('created_at', { ascending: false })
      .limit(5)

    console.log(`👍 User's existing reactions (${userReactions?.length || 0}):`)
    if (userReactions && userReactions.length > 0) {
      userReactions.forEach(reaction => {
        console.log(`  - ${reaction.reaction_type} on post ${reaction.post_id} at ${reaction.created_at}`)
      })
    }

    // Check recent notifications for the user
    const { data: recentNotifications, error: notifError } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', testUser.id)
      .order('created_at', { ascending: false })
      .limit(5)

    console.log(`🔔 Recent notifications for user (${recentNotifications?.length || 0}):`)
    if (recentNotifications && recentNotifications.length > 0) {
      recentNotifications.forEach(notif => {
        console.log(`  - ${notif.type}: ${notif.title} - ${notif.message} (${notif.created_at})`)
      })
    }

    // Check if user has FCM tokens
    const { data: tokens, error: tokenError } = await supabase
      .from('push_subscriptions')
      .select('native_token, endpoint, updated_at')
      .eq('user_id', testUser.id)
      .order('updated_at', { ascending: false })
      .limit(2)

    console.log(`📱 User's FCM tokens (${tokens?.length || 0}):`)
    if (tokens && tokens.length > 0) {
      tokens.forEach((token, index) => {
        console.log(`  - Token ${index + 1}: ${token.native_token.substring(0, 50)}... (${token.updated_at})`)
      })
    } else {
      console.log('  ⚠️  No FCM tokens found - user won\'t receive push notifications!')
    }

  } catch (error) {
    console.error('❌ ERROR:', error.message)
  }
}

debugLikeNotifications()
