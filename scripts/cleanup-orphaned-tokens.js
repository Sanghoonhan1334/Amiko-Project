#!/usr/bin/env node

/**
 * Periodic cleanup script for orphaned FCM tokens
 * This script can be run as a cron job to clean up old tokens
 * Usage: node scripts/cleanup-orphaned-tokens.js
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

async function cleanupOrphanedTokens() {
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
    console.log('🧹 Starting periodic cleanup of orphaned FCM tokens...')

    // Find users with multiple tokens and keep only the newest one
    const { data: allTokens, error: fetchError } = await supabase
      .from('push_subscriptions')
      .select('id, user_id, native_token, endpoint, updated_at')
      .order('user_id', { ascending: true })
      .order('updated_at', { ascending: false })

    if (fetchError) {
      console.error('❌ Error fetching tokens:', fetchError)
      process.exit(1)
    }

    if (!allTokens || allTokens.length === 0) {
      console.log('ℹ️ No tokens found')
      return
    }

    console.log(`📊 Found ${allTokens.length} total tokens`)

    // Group tokens by user_id
    const tokensByUser = allTokens.reduce((acc, token) => {
      if (!acc[token.user_id]) {
        acc[token.user_id] = []
      }
      acc[token.user_id].push(token)
      return acc
    }, {})

    let totalCleaned = 0

    // For each user, keep only the newest token
    for (const [userId, userTokens] of Object.entries(tokensByUser)) {
      if (userTokens.length <= 1) {
        continue // Only one token, nothing to clean
      }

      const sortedTokens = userTokens.sort((a, b) =>
        new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
      )

      const newestToken = sortedTokens[0]
      const oldTokens = sortedTokens.slice(1)

      console.log(`👤 User ${userId}: keeping newest token, deleting ${oldTokens.length} old tokens`)

      // Delete old tokens
      const oldTokenIds = oldTokens.map(t => t.id)
      const { error: deleteError } = await supabase
        .from('push_subscriptions')
        .delete()
        .in('id', oldTokenIds)

      if (deleteError) {
        console.error(`❌ Error deleting old tokens for user ${userId}:`, deleteError)
      } else {
        totalCleaned += oldTokens.length
        console.log(`✅ Cleaned ${oldTokens.length} old tokens for user ${userId}`)
      }
    }

    console.log(`🎉 Cleanup complete! Removed ${totalCleaned} orphaned tokens`)

  } catch (error) {
    console.error('❌ Unexpected error during cleanup:', error)
    process.exit(1)
  }
}

cleanupOrphanedTokens()
