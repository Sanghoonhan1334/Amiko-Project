import { createClient } from '@/utils/supabase/server'
import fs from 'fs'
import path from 'path'

interface QuizData {
  quiz: {
    slug: string
    title: string
    description: string
    category: string
    thumbnail_url: string
    language: string
    is_active: boolean
  }
  questions: Array<{
    id: number
    text: string
    options: Array<{
      label: string
      scores: Record<string, number>
    }>
  }>
  results: Array<{
    slug: string
    titulo: string
    imagen: string
    descripcion: string
    cuidado: string
    compatible: {
      slug: string
      titulo: string
      imagen: string
    }
    incompatible: {
      slug: string
      titulo: string
      imagen: string
    }
  }>
}

async function seedIdolPositionQuiz() {
  const supabase = createClient()
  
  try {
    console.log('🌱 Starting idol-position quiz seeding...')
    
    // JSON 파일 로드
    const jsonPath = path.join(process.cwd(), 'database/seed/idol-position.json')
    const jsonContent = fs.readFileSync(jsonPath, 'utf-8')
    const data: QuizData = JSON.parse(jsonContent)
    
    // 빈 구조인지 확인
    if (data.questions.length === 0 || data.results.length === 0) {
      console.log('⏳ WAITING: JSON structure is empty. Please add the actual quiz data.')
      console.log('📝 Add questions and results to database/seed/idol-position.json')
      console.log('🖼️  Upload images to /public/quizzes/idol-roles/')
      return
    }
    
    console.log(`📊 Found ${data.questions.length} questions and ${data.results.length} results`)
    
    // 트랜잭션 시작
    console.log('🔄 Starting transaction...')
    
    // 1. 퀴즈 생성/업데이트
    console.log('📝 Creating/updating quiz...')
    const { data: existingQuiz, error: quizError } = await supabase
      .from('quizzes')
      .select('id')
      .eq('slug', data.quiz.slug)
      .single()
    
    let quizId: string
    
    if (existingQuiz) {
      // 기존 퀴즈 업데이트
      const { error: updateError } = await supabase
        .from('quizzes')
        .update({
          title: data.quiz.title,
          description: data.quiz.description,
          is_active: data.quiz.is_active,
          updated_at: new Date().toISOString()
        })
        .eq('slug', data.quiz.slug)
      
      if (updateError) throw updateError
      quizId = existingQuiz.id
      console.log('✅ Updated existing quiz')
    } else {
      // 새 퀴즈 생성
      const { data: newQuiz, error: createError } = await supabase
        .from('quizzes')
        .insert({
          slug: data.quiz.slug,
          title: data.quiz.title,
          description: data.quiz.description,
          is_active: data.quiz.is_active
        })
        .select('id')
        .single()
      
      if (createError) throw createError
      quizId = newQuiz.id
      console.log('✅ Created new quiz')
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
        // scores 객체의 모든 항목을 JSON으로 저장
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
    
  } catch (error: any) {
    console.error('❌ ERROR:', error.message)
    console.error('🔄 Transaction rolled back')
    process.exit(1)
  }
}

// 스크립트 실행
if (require.main === module) {
  seedIdolPositionQuiz()
}

export default seedIdolPositionQuiz
