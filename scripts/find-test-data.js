#!/usr/bin/env node

/**
 * Helper script to find posts and users for testing
 * Usage: node scripts/find-test-data.js
 */

const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')
const path = require('path')

function loadEnv() {
  const envPath = path.resolve(__dirname, '..', '.env.local')
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf8')
    const envVars = {}

    envContent.split('\n').forEach(line => {
      const [key, ...valueParts] = line.split('=')
      if (key && valueParts.length > 0) {
        const value = valueParts.join('=').trim()
        if (value.startsWith('"') && value.endsWith('"')) {
          envVars[key.trim()] = value.slice(1, -1)
        } else {
          envVars[key.trim()] = value
        }
      }
    })

    Object.assign(process.env, envVars)
  }
}

async function findTestData() {
  // Load environment variables
  loadEnv()

  // Get Supabase credentials from environment
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseKey) {
    console.error('Error: Supabase environment variables not found')
    process.exit(1)
  }

  const supabase = createClient(supabaseUrl, supabaseKey)

  try {
    console.log('🔍 Finding test data for comment push notifications...\n')

    // Find recent posts
    console.log('📝 Recent Posts:')
    const { data: posts, error: postsError } = await supabase
      .from('posts')
      .select('id, user_id, title, created_at')
      .order('created_at', { ascending: false })
      .limit(5)

    if (postsError) {
      console.error('❌ Error fetching posts:', postsError)
    } else if (posts && posts.length > 0) {
      posts.forEach((post, index) => {
        console.log(`${index + 1}. ID: ${post.id}`)
        console.log(`   Title: ${post.title?.substring(0, 50) || 'No title'}`)
        console.log(`   Author: ${post.user_id}`)
        console.log(`   Created: ${post.created_at}`)
        console.log('')
      })
    } else {
      console.log('No posts found')
    }

    // Find users with push tokens
    console.log('👥 Users with Push Tokens:')
    const { data: usersWithTokens, error: usersError } = await supabase
      .from('push_subscriptions')
      .select(`
        user_id,
        users!inner(id, full_name, korean_name),
        native_token,
        updated_at
      `)
      .order('updated_at', { ascending: false })
      .limit(5)

    if (usersError) {
      console.error('❌ Error fetching users with tokens:', usersError)
    } else if (usersWithTokens && usersWithTokens.length > 0) {
      const uniqueUsers = usersWithTokens.reduce((acc, token) => {
        if (!acc[token.user_id]) {
          acc[token.user_id] = {
            id: token.user_id,
            name: token.users?.korean_name || token.users?.full_name || 'Unknown',
            latestToken: token.updated_at
          }
        }
        return acc
      }, {})

      Object.values(uniqueUsers).forEach((user, index) => {
        console.log(`${index + 1}. ID: ${user.id}`)
        console.log(`   Name: ${user.name}`)
        console.log(`   Latest Token: ${user.latestToken}`)
        console.log('')
      })
    } else {
      console.log('No users with push tokens found')
    }

    console.log('💡 Test Command Example:')
    if (posts && posts.length > 0 && usersWithTokens && usersWithTokens.length > 0) {
      const testPost = posts[0]
      const testUser = usersWithTokens[0]

      console.log(`npm run test:comment-push -- --post-id="${testPost.id}" --user-id="${testUser.user_id}" --token="YOUR_JWT_TOKEN"`)
      console.log('\n📋 Remember to:')
      console.log('1. Use a different user ID than the post author')
      console.log('2. Get a valid JWT token from browser localStorage')
      console.log('3. Make sure the target user has push tokens registered')
    }

  } catch (error) {
    console.error('❌ Unexpected error:', error)
    process.exit(1)
  }
}

findTestData()
