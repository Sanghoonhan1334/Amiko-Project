#!/usr/bin/env node

/**
 * Script to clean up old FCM tokens and keep only the newest one
 * Usage: node scripts/clean-tokens.js --user-id="user_id_here"
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

function parseArgs() {
  const args = {}
  process.argv.slice(2).forEach(arg => {
    if (arg.startsWith('--')) {
      const [k, v] = arg.slice(2).split('=')
      args[k] = v === undefined ? true : v
    }
  })
  return args
}

async function cleanTokens() {
  // Load environment variables
  loadEnv()

  const args = parseArgs()
  const userId = args['user-id'] || args.userId

  if (!userId) {
    console.error('Error: user-id is required. Use --user-id="your_user_id"')
    process.exit(1)
  }

  // Get Supabase credentials from environment
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseKey) {
    console.error('Error: Supabase environment variables not found')
    console.error('NEXT_PUBLIC_SUPABASE_URL:', !!supabaseUrl)
    console.error('SUPABASE_SERVICE_ROLE_KEY:', !!process.env.SUPABASE_SERVICE_ROLE_KEY)
    console.error('NEXT_PUBLIC_SUPABASE_ANON_KEY:', !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)
    process.exit(1)
  }

  const supabase = createClient(supabaseUrl, supabaseKey)

  try {
    console.log(`🧹 Cleaning old tokens for user: ${userId}`)

    // Get all tokens for the user, ordered by updated_at DESC
    const { data: tokens, error: fetchError } = await supabase
      .from('push_subscriptions')
      .select('id, native_token, updated_at')
      .eq('user_id', userId)
      .order('updated_at', { ascending: false })

    if (fetchError) {
      console.error('❌ Error fetching tokens:', fetchError)
      process.exit(1)
    }

    if (!tokens || tokens.length === 0) {
      console.log('ℹ️ No tokens found for this user')
      return
    }

    console.log(`📊 Found ${tokens.length} tokens:`)
    tokens.forEach((token, index) => {
      console.log(`${index + 1}. ${token.native_token.substring(0, 20)}... (updated: ${token.updated_at})`)
    })

    if (tokens.length <= 1) {
      console.log('✅ Only one token found, no cleanup needed')
      return
    }

    // Keep the newest token (first in the array), delete the rest
    const newestToken = tokens[0]
    const oldTokens = tokens.slice(1)

    console.log(`\n🎯 Keeping newest token: ${newestToken.native_token.substring(0, 20)}...`)
    console.log(`🗑️ Deleting ${oldTokens.length} old tokens...`)

    // Delete old tokens
    const oldTokenIds = oldTokens.map(t => t.id)
    const { error: deleteError } = await supabase
      .from('push_subscriptions')
      .delete()
      .in('id', oldTokenIds)

    if (deleteError) {
      console.error('❌ Error deleting old tokens:', deleteError)
      process.exit(1)
    }

    console.log('✅ Successfully cleaned up old tokens!')
    console.log(`📱 Remaining token: ${newestToken.native_token.substring(0, 20)}...`)

  } catch (error) {
    console.error('❌ Unexpected error:', error)
    process.exit(1)
  }
}

cleanTokens()
