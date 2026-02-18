const { createClient } = require('@supabase/supabase-js')
const { exec } = require('child_process')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function getUserToken(email) {
  try {
    console.log(`🔍 Looking up FCM token for user: ${email}`)

    // First get the user ID from the users table (which extends auth.users)
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id, email')
      .eq('email', email)
      .single()

    if (userError || !user) {
      console.error('❌ User not found:', userError?.message)
      return
    }

    const userId = user.id
    console.log(`✅ Found user ID: ${userId}`)

    // Get the latest FCM token from push_subscriptions
    const { data: subscription, error: subError } = await supabase
      .from('push_subscriptions')
      .select('native_token, endpoint, updated_at')
      .eq('user_id', userId)
      .order('updated_at', { ascending: false })
      .limit(1)
      .single()

    if (subError) {
      console.error('❌ Error getting subscription:', subError.message)
      return
    }

    if (!subscription) {
      console.log('⚠️  No FCM token found for this user')
      return
    }

    console.log('✅ FCM Token found:')
    console.log(`📱 Native Token: ${subscription.native_token}`)
    console.log(`🌐 Endpoint: ${subscription.endpoint}`)
    console.log(`📅 Updated: ${subscription.updated_at}`)

    // Return the token for testing
    return subscription.native_token

  } catch (error) {
    console.error('❌ ERROR:', error.message)
  }
}

function sendFCMNotification(token, title = 'Test Notification', body = 'This is a test push notification') {
  return new Promise((resolve, reject) => {
    const command = `FCM_SERVICE_ACCOUNT_JSON_PATH=./service-account-clean.json node scripts/send-fcm.js --token="${token}" --title="${title}" --body="${body}"`

    console.log('\n🚀 Executing FCM command:')
    console.log(command)

    exec(command, (error, stdout, stderr) => {
      if (error) {
        console.error('❌ Error executing command:', error.message)
        console.error('stderr:', stderr)
        reject(error)
        return
      }

      console.log('✅ Command executed successfully!')
      console.log('stdout:', stdout)
      resolve(stdout)
    })
  })
}

async function main() {
  // Get email from command line arguments
  const email = process.argv[2] || 'domgarmining@gmail.com'

  // Get custom title and body from command line arguments if provided
  const title = process.argv[3] || 'Test Notification'
  const body = process.argv[4] || 'This is a test push notification'

  console.log(`📧 Email: ${email}`)
  console.log(`📝 Title: ${title}`)
  console.log(`📄 Body: ${body}`)

  try {
    const token = await getUserToken(email)

    if (token) {
      console.log(`\n🎯 Token retrieved successfully`)
      console.log(`Token: ${token}`)

      // Send the notification
      await sendFCMNotification(token, title, body)

      console.log('\n✅ Notification sent successfully!')
    } else {
      console.log('\n❌ No token found to send notification')
    }
  } catch (error) {
    console.error('\n❌ Failed to send notification:', error)
  }
}

// Run the main function
if (require.main === module) {
  main()
}

// Export functions if you want to use this as a module
module.exports = { getUserToken, sendFCMNotification }
