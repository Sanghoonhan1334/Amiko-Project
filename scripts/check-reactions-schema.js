const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function checkDatabaseSchema() {
  try {
    console.log('🔍 Checking database schema for post_reactions table...')

    // Check foreign key constraints
    const { data: constraints, error } = await supabase
      .rpc('exec_sql', {
        sql: `
          SELECT
            tc.table_name,
            tc.constraint_name,
            tc.constraint_type,
            kcu.column_name,
            ccu.table_name AS referenced_table,
            ccu.column_name AS referenced_column
          FROM information_schema.table_constraints tc
          JOIN information_schema.key_column_usage kcu ON tc.constraint_name = kcu.constraint_name
          JOIN information_schema.constraint_column_usage ccu ON tc.constraint_name = ccu.constraint_name
          WHERE tc.table_name = 'post_reactions' AND tc.constraint_type = 'FOREIGN KEY';
        `
      })

    if (error) {
      console.log('⚠️  RPC not available, trying direct query...')

      // Try a simple query to check if reactions can be inserted
      console.log('🧪 Testing reaction insertion...')

      // First, let's get a test post
      const { data: testPost, error: postError } = await supabase
        .from('gallery_posts')
        .select('id, user_id, title')
        .eq('is_deleted', false)
        .limit(1)
        .single()

      if (postError || !testPost) {
        console.error('❌ No test posts found')
        return
      }

      console.log(`📝 Found test post: ${testPost.title} (ID: ${testPost.id})`)

      // Try to insert a test reaction
      const testUserId = 'fe89b81d-76d8-4804-9f91-e35a012d0703' // domgarmining@gmail.com

      const { data: testReaction, error: insertError } = await supabase
        .from('post_reactions')
        .insert({
          post_id: testPost.id,
          user_id: testUserId,
          reaction_type: 'like'
        })
        .select()

      if (insertError) {
        console.error('❌ Test reaction insertion failed:', insertError.message)
        if (insertError.message.includes('foreign key')) {
          console.log('🔧 Foreign key constraint issue detected!')
          console.log('📋 Please run the migration: database/fix-post-reactions-foreign-key.sql')
        }
      } else {
        console.log('✅ Test reaction inserted successfully:', testReaction)

        // Clean up test reaction
        await supabase
          .from('post_reactions')
          .delete()
          .eq('post_id', testPost.id)
          .eq('user_id', testUserId)

        console.log('🧹 Test reaction cleaned up')
      }

    } else {
      console.log('📋 Foreign key constraints for post_reactions:')
      constraints.forEach(constraint => {
        console.log(`  - ${constraint.constraint_name}: ${constraint.column_name} -> ${constraint.referenced_table}.${constraint.referenced_column}`)
      })

      // Check if it references gallery_posts
      const postConstraint = constraints.find(c => c.column_name === 'post_id')
      if (postConstraint && postConstraint.referenced_table === 'gallery_posts') {
        console.log('✅ Foreign key constraint is correct (references gallery_posts)')
      } else {
        console.log('❌ Foreign key constraint is incorrect (should reference gallery_posts)')
      }
    }

  } catch (error) {
    console.error('❌ ERROR:', error.message)
  }
}

checkDatabaseSchema()
