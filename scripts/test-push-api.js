const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function testPushNotificationAPI() {
  try {
    console.log('🧪 Testing push notification API directly...')

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

    // Test the send-push API directly
    const apiUrl = 'http://localhost:3000' // Use localhost since server is running locally
    const pushResponse = await fetch(`${apiUrl}/api/notifications/send-push`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        userId: testUser.id,
        title: 'Test Like Notification',
        body: 'This is a test like notification from the API',
        data: {
          type: 'like',
          postId: 'test-post-id',
          postTitle: 'Test Post',
          likerName: 'Test User',
          url: '/community/posts/test-post-id'
        },
        tag: 'test_like_test-post-id'
      })
    })

    console.log('📡 Push API Response:', pushResponse.status)

    if (pushResponse.ok) {
      const pushResult = await pushResponse.json()
      console.log('✅ Push notification sent successfully:', pushResult)
    } else {
      const pushError = await pushResponse.text()
      console.error('❌ Push notification failed:', pushResponse.status, pushError)
    }

  } catch (error) {
    console.error('❌ ERROR:', error.message)
  }
}

testPushNotificationAPI()
