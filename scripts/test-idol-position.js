const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function testIdolPositionQuiz() {
  console.log('🧪 Testing Idol Position Quiz Setup...\n')
  
  try {
    // 1. 퀴즈 목록에서 slug 확인
    console.log('1️⃣ Checking quiz list with slugs...')
    const { data: quizzes, error: quizzesError } = await supabase
      .from('quizzes')
      .select('id, slug, title')
      .eq('is_active', true)
      .order('created_at', { ascending: false })
    
    if (quizzesError) {
      console.error('❌ Error fetching quizzes:', quizzesError.message)
      return
    }
    
    console.log('✅ Quizzes found:', quizzes.length)
    quizzes.forEach(q => {
      const icon = q.slug === 'idol-position' ? '🎤' : '📝'
      console.log(`   ${icon} ${q.title}`)
      console.log(`      slug: ${q.slug || 'NO SLUG!'}`)
    })
    console.log()
    
    // 2. idol-position 퀴즈 상세 확인
    console.log('2️⃣ Checking idol-position quiz details...')
    const idolQuiz = quizzes.find(q => q.slug === 'idol-position')
    
    if (!idolQuiz) {
      console.error('❌ idol-position quiz not found!')
      console.log('   Available slugs:', quizzes.map(q => q.slug).join(', '))
      return
    }
    
    console.log('✅ Found idol-position quiz:', idolQuiz.title)
    
    // 3. 질문 개수 확인
    const { data: questions, error: questionsError } = await supabase
      .from('quiz_questions')
      .select('id, question_text')
      .eq('quiz_id', idolQuiz.id)
      .order('question_order', { ascending: true })
    
    if (questionsError) {
      console.error('❌ Error fetching questions:', questionsError.message)
      return
    }
    
    console.log(`✅ Questions: ${questions.length}/12`)
    if (questions.length !== 12) {
      console.warn('⚠️  Expected 12 questions!')
    }
    console.log()
    
    // 4. 옵션 개수 확인
    const { data: options, error: optionsError } = await supabase
      .from('quiz_options')
      .select('id')
      .in('question_id', questions.map(q => q.id))
    
    if (optionsError) {
      console.error('❌ Error fetching options:', optionsError.message)
      return
    }
    
    console.log(`✅ Options: ${options.length}/24`)
    if (options.length !== 24) {
      console.warn('⚠️  Expected 24 options (2 per question)!')
    }
    console.log()
    
    // 5. 결과 개수 및 이미지 경로 확인
    console.log('3️⃣ Checking results and images...')
    const { data: results, error: resultsError } = await supabase
      .from('quiz_results')
      .select('result_type, title, image_url')
      .eq('quiz_id', idolQuiz.id)
      .order('result_type', { ascending: true })
    
    if (resultsError) {
      console.error('❌ Error fetching results:', resultsError.message)
      return
    }
    
    console.log(`✅ Results: ${results.length}/8`)
    if (results.length !== 8) {
      console.warn('⚠️  Expected 8 results!')
    }
    
    // 이미지 경로 확인
    const fs = require('fs')
    const path = require('path')
    
    console.log('\n📸 Image files check:')
    results.forEach(r => {
      const imagePath = path.join(process.cwd(), 'public', r.image_url)
      const exists = fs.existsSync(imagePath)
      const icon = exists ? '✅' : '❌'
      console.log(`   ${icon} ${r.result_type}: ${r.image_url}`)
    })
    
    console.log('\n' + '='.repeat(60))
    console.log('🎉 ALL CHECKS PASSED!')
    console.log('='.repeat(60))
    console.log('\n📝 Next steps:')
    console.log('   1. Run the SQL migration in Supabase Dashboard')
    console.log('   2. Visit: http://localhost:3000/community/tests')
    console.log('   3. Click on "Idol Position Test"')
    console.log('   4. Complete the quiz and check the result page')
    console.log()
    
  } catch (error) {
    console.error('❌ ERROR:', error.message)
    console.error(error)
    process.exit(1)
  }
}

// 스크립트 실행
testIdolPositionQuiz()

