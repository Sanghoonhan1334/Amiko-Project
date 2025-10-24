const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')
const path = require('path')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials')
  console.error('NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl ? 'Found' : 'Not found')
  console.error('SUPABASE_KEY:', supabaseKey ? 'Found' : 'Not found')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function seedIdolPositionQuiz() {
  try {
    console.log('🌱 Starting idol-position quiz seeding...')
    
    // JSON 파일 로드
    const jsonPath = path.join(__dirname, '../database/seed/idol-position.json')
    const jsonContent = fs.readFileSync(jsonPath, 'utf-8')
    const data = JSON.parse(jsonContent)
    
    // 빈 구조인지 확인
    if (data.questions.length === 0 || data.results.length === 0) {
      console.log('⏳ WAITING: JSON structure is empty. Please add the actual quiz data.')
      console.log('📝 Add questions and results to database/seed/idol-position.json')
      console.log('🖼️  Upload images to /public/quizzes/idol-roles/')
      return
    }
    
    console.log(`📊 Found ${data.questions.length} questions and ${data.results.length} results`)
    
    // 1. 퀴즈 생성/업데이트
    console.log('📝 Creating/updating quiz...')
    const { data: existingQuiz, error: quizError } = await supabase
      .from('quizzes')
      .select('id')
      .eq('id', 'dea20361-fd46-409d-880f-f91869c1d184')
      .single()
    
    let quizId
    
    if (existingQuiz) {
      // 기존 퀴즈 업데이트
      const { error: updateError } = await supabase
        .from('quizzes')
        .update({
          title: data.quiz.title,
          description: data.quiz.description,
          category: data.quiz.category,
          thumbnail_url: data.quiz.thumbnail_url,
          is_active: data.quiz.is_active,
          updated_at: new Date().toISOString()
        })
        .eq('id', 'dea20361-fd46-409d-880f-f91869c1d184')
      
      if (updateError) throw updateError
      quizId = existingQuiz.id
      console.log('✅ Updated existing quiz')
    } else {
      console.log('❌ Quiz not found. Please create it first.')
      process.exit(1)
    }
    
    // 2. 기존 질문/선택지/결과 삭제
    console.log('🗑️  Cleaning existing data...')
    
    await supabase.from('quiz_options').delete().eq('quiz_id', quizId)
    await supabase.from('quiz_questions').delete().eq('quiz_id', quizId)
    await supabase.from('quiz_results').delete().eq('quiz_id', quizId)
    
    // 3. 새 질문들 삽입
    console.log('❓ Inserting questions...')
    const questionsToInsert = data.questions.map(q => ({
      quiz_id: quizId,
      question_order: q.id,
      question_text: q.text,
      question_type: 'single_choice'
    }))
    
    const { data: insertedQuestions, error: questionsError } = await supabase
      .from('quiz_questions')
      .insert(questionsToInsert)
      .select('id, question_order')
    
    if (questionsError) throw questionsError
    console.log(`✅ Inserted ${insertedQuestions.length} questions`)
    
    // 4. 새 선택지들 삽입
    console.log('🔘 Inserting options...')
    const optionsToInsert = data.questions.flatMap((q, qIndex) => {
      const question = insertedQuestions.find(iq => iq.question_order === q.id)
      if (!question) return []
      
      return q.options.map((opt, optIndex) => {
        // scores 객체의 모든 항목을 처리
        const scoringEntries = Object.entries(opt.scores)
        const primaryScoring = scoringEntries[0] // 첫 번째 스코어를 주요 스코어로 사용
        
        return {
          question_id: question.id,
          option_order: optIndex + 1,
          option_text: opt.label,
          result_type: primaryScoring[0],
          score_value: primaryScoring[1],
          mbti_axis: null,
          axis_weight: 0
        }
      })
    })
    
    const { error: optionsError } = await supabase
      .from('quiz_options')
      .insert(optionsToInsert)
    
    if (optionsError) throw optionsError
    console.log(`✅ Inserted ${optionsToInsert.length} options`)
    
    // 5. 새 결과들 삽입
    console.log('🎯 Inserting results...')
    const resultsToInsert = data.results.map(r => ({
      quiz_id: quizId,
      result_type: r.slug,
      title: r.titulo,
      description: r.descripcion,
      image_url: r.imagen,
      characteristic: r.cuidado,
      recommendation: r.compatible.slug,
      mbti_code: null
    }))
    
    const { error: resultsError } = await supabase
      .from('quiz_results')
      .insert(resultsToInsert)
    
    if (resultsError) throw resultsError
    console.log(`✅ Inserted ${resultsToInsert.length} results`)
    
    console.log('🎉 SUCCESS: Idol-position quiz seeded successfully!')
    console.log(`📊 Quiz ID: ${quizId}`)
    console.log(`🔗 Access at: /quiz/idol-position`)
    
  } catch (error) {
    console.error('❌ ERROR:', error.message)
    console.error(error)
    process.exit(1)
  }
}

// 스크립트 실행
seedIdolPositionQuiz()
