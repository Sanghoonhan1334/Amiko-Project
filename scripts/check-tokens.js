#!/usr/bin/env node

/**
 * Script to check FCM tokens for a specific user
 * Usage: node scripts/check-tokens.js --user-id="user_id_here"
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

async function checkTokens() {
  // Load environment variables
  loadEnv()

  const args = parseArgs()
  const userId = args['user-id'] || args.userId || 'b82eb2f2-4074-4717-91d7-1da71e9b48ba'

  // Get Supabase credentials from environment
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseKey) {
    console.error('Error: Supabase environment variables not found')
    process.exit(1)
  }

  const supabase = createClient(supabaseUrl, supabaseKey)

  try {
    console.log(`🔍 Checking tokens for user: ${userId}`)

    // Execute the query
    const { data: tokens, error: fetchError } = await supabase
      .from('push_subscriptions')
      .select('native_token, endpoint, updated_at')
      .eq('user_id', userId)
      .order('updated_at', { ascending: false })
      .limit(5)

    if (fetchError) {
      console.error('❌ Error fetching tokens:', fetchError)
      process.exit(1)
    }

    if (!tokens || tokens.length === 0) {
      console.log('ℹ️ No tokens found for this user')
      return
    }

    console.log(`📊 Found ${tokens.length} tokens:`)
    console.log(JSON.stringify(tokens, null, 2))

    // Show summary
    const newest = tokens[0]
    console.log(`\n🎯 Newest token: ${newest.native_token.substring(0, 20)}... (updated: ${newest.updated_at})`)

    if (tokens.length > 1) {
      console.log(`⚠️ ${tokens.length - 1} older tokens found that should be cleaned up`)
    } else {
      console.log('✅ Only one token found - database is clean')
    }

  } catch (error) {
    console.error('❌ Unexpected error:', error)
    process.exit(1)
  }
}

checkTokens()
