const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function testAuthenticatedLike() {
  try {
    console.log('🧪 Testing authenticated like request...')

    // Test user credentials
    const testEmail = 'domgarmining@gmail.com'
    const testPassword = 'test123456' // You'll need to set this

    console.log(`🔐 Attempting to sign in as ${testEmail}...`)

    // Sign in to get JWT token
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: testEmail,
      password: testPassword
    })

    if (authError || !authData.session) {
      console.error('❌ Authentication failed:', authError?.message)
      console.log('💡 You may need to set the correct password for the test user')
      return
    }

    const jwtToken = authData.session.access_token
    console.log('✅ Authentication successful, got JWT token')

    // Find a post to like (not owned by test user)
    const { data: testUser } = await supabase.auth.getUser()
    const userId = testUser.user?.id

    const { data: availablePosts, error: postsError } = await supabase
      .from('gallery_posts')
      .select('id, user_id, title')
      .eq('is_deleted', false)
      .neq('user_id', userId) // Not owned by test user
      .limit(3)

    if (postsError || !availablePosts || availablePosts.length === 0) {
      console.error('❌ No available posts to like')
      return
    }

    const targetPost = availablePosts[0]
    console.log(`📝 Will like post: "${targetPost.title}" (ID: ${targetPost.id})`)
    console.log(`👤 Post author: ${targetPost.user_id}`)

    // Make authenticated like request
    const apiUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
    console.log(`🌐 Making request to: ${apiUrl}/api/posts/${targetPost.id}/reactions`)

    const likeResponse = await fetch(`${apiUrl}/api/posts/${targetPost.id}/reactions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${jwtToken}`
      },
      body: JSON.stringify({
        reaction_type: 'like'
      })
    })

    console.log(`📡 Like API Response: ${likeResponse.status}`)

    if (likeResponse.ok) {
      const likeResult = await likeResponse.json()
      console.log('✅ Like request successful:', likeResult)

      // Check if notification was created
      console.log('🔍 Checking if notification was created...')
      const { data: notifications, error: notifError } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', targetPost.user_id)
        .eq('type', 'like')
        .eq('related_id', targetPost.id)
        .order('created_at', { ascending: false })
        .limit(1)

      if (!notifError && notifications && notifications.length > 0) {
        console.log('✅ Notification created in database:', notifications[0])
      } else {
        console.log('❌ No notification found in database')
      }

    } else {
      const errorText = await likeResponse.text()
      console.error('❌ Like request failed:', likeResponse.status, errorText)
    }

    // Sign out
    await supabase.auth.signOut()

  } catch (error) {
    console.error('❌ ERROR:', error.message)
  }
}

testAuthenticatedLike()
