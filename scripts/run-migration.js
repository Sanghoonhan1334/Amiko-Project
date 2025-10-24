const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')
const path = require('path')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function runMigration() {
  try {
    console.log('🔄 Running migration: add-slug-to-quizzes...')
    
    // SQL 파일 로드
    const sqlPath = path.join(__dirname, '../database/migrations/add-slug-to-quizzes.sql')
    const sqlContent = fs.readFileSync(sqlPath, 'utf-8')
    
    console.log('📝 Executing SQL...')
    
    // SQL 실행
    const { data, error } = await supabase.rpc('exec_sql', { sql: sqlContent })
    
    if (error) {
      // RPC가 없으면 직접 실행 시도
      console.log('⚠️  RPC not available, trying direct execution...')
      
      // 각 구문을 개별적으로 실행
      const statements = sqlContent
        .replace(/BEGIN;|COMMIT;/g, '')
        .split(';')
        .map(s => s.trim())
        .filter(s => s.length > 0)
      
      for (const statement of statements) {
        if (statement.toLowerCase().includes('alter table')) {
          console.log('  → Running ALTER TABLE...')
        } else if (statement.toLowerCase().includes('update')) {
          console.log('  → Running UPDATE...')
        } else if (statement.toLowerCase().includes('create')) {
          console.log('  → Running CREATE INDEX...')
        }
        
        // Supabase에서는 직접 DDL 실행이 제한될 수 있으므로
        // 사용자에게 Supabase 대시보드에서 실행하도록 안내
        console.log('⚠️  Please run this SQL in Supabase Dashboard → SQL Editor')
      }
      
      throw new Error('Please run the migration SQL manually in Supabase Dashboard')
    }
    
    console.log('✅ Migration completed successfully!')
    
    // 결과 확인
    const { data: quizzes, error: checkError } = await supabase
      .from('quizzes')
      .select('id, title, slug')
      .limit(5)
    
    if (!checkError && quizzes) {
      console.log('\n📊 Sample quizzes with slugs:')
      quizzes.forEach(q => {
        console.log(`  - ${q.title}: ${q.slug}`)
      })
    }
    
  } catch (error) {
    console.error('❌ ERROR:', error.message)
    console.log('\n📝 Please run this SQL manually in Supabase Dashboard → SQL Editor:')
    console.log('\nFile location: database/migrations/add-slug-to-quizzes.sql')
    process.exit(1)
  }
}

// 스크립트 실행
runMigration()

