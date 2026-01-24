const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase service role credentials')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function testLikeNotification() {
  try {
    console.log('🧪 Testing like notification flow...')

    // Get test user (domgarmining@gmail.com)
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

    // Find a post that is NOT created by the test user
    const { data: targetPost, error: postError } = await supabase
      .from('gallery_posts')
      .select('id, user_id, title')
      .eq('is_deleted', false)
      .neq('user_id', testUser.id) // Not created by test user
      .limit(1)
      .single()

    if (postError || !targetPost) {
      console.error('❌ No suitable target post found')
      return
    }

    console.log(`📝 Target post: "${targetPost.title}" (ID: ${targetPost.id})`)
    console.log(`👤 Post author ID: ${targetPost.user_id}`)

    // Check if the post author has notification settings enabled
    const { data: settings, error: settingsError } = await supabase
      .from('notification_settings')
      .select('like_notifications_enabled, push_enabled')
      .eq('user_id', targetPost.user_id)
      .single()

    console.log('⚙️  Notification settings:', settings || 'No settings found (defaults to enabled)')

    // Simulate the like action by calling the API
    console.log('🚀 Simulating like action...')

    const apiUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
    const response = await fetch(`${apiUrl}/api/posts/${targetPost.id}/reactions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        // Note: This would normally require authentication, but for testing we'll use service role
      },
      body: JSON.stringify({
        reaction_type: 'like'
      })
    })

    const result = await response.json()
    console.log('📡 API Response:', response.status, result)

    if (response.ok) {
      console.log('✅ Like action successful')

      // Check if notification was created
      const { data: notifications, error: notifError } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', targetPost.user_id)
        .eq('type', 'like')
        .eq('related_id', targetPost.id)
        .order('created_at', { ascending: false })
        .limit(1)

      if (!notifError && notifications && notifications.length > 0) {
        console.log('✅ Notification created:', notifications[0])
      } else {
        console.log('❌ No notification found in database')
      }

      // Clean up the test like
      console.log('🧹 Cleaning up test like...')
      await supabase
        .from('post_reactions')
        .delete()
        .eq('post_id', targetPost.id)
        .eq('user_id', testUser.id)

      console.log('✅ Test like removed')
    } else {
      console.log('❌ Like action failed')
    }

  } catch (error) {
    console.error('❌ ERROR:', error.message)
  }
}

testLikeNotification()
