import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient()
    
    // 퀴즈 ID로 직접 찾기
    const quizId = 'dea20361-fd46-409d-880f-f91869c1d184'
    
    // 1. 퀴즈 기본 정보 업데이트
    const { error: updateError } = await supabase
      .from('quizzes')
      .update({
        title: '¿Qué posición de idol me quedaría mejor?',
        description: 'Descubre tu posición ideal en un grupo de K-pop respondiendo 12 preguntas.',
        updated_at: new Date().toISOString()
      })
      .eq('id', quizId)
    
    if (updateError) {
      throw updateError
    }
    
    // 2. 첫 번째 질문 업데이트
    const { data: firstQuestion, error: questionError } = await supabase
      .from('quiz_questions')
      .select('id')
      .eq('quiz_id', quizId)
      .eq('question_order', 1)
      .single()
    
    if (questionError || !firstQuestion) {
      throw new Error('First question not found')
    }
    
    // 첫 번째 질문 텍스트 업데이트
    const { error: updateQuestionError } = await supabase
      .from('quiz_questions')
      .update({
        question_text: '¿Sueles imaginar que debutas como idol o influencer?'
      })
      .eq('id', firstQuestion.id)
    
    if (updateQuestionError) {
      throw updateQuestionError
    }
    
    // 첫 번째 질문의 선택지 업데이트
    const { data: options, error: optionsError } = await supabase
      .from('quiz_options')
      .select('id, option_order')
      .eq('question_id', firstQuestion.id)
      .order('option_order')
    
    if (optionsError || !options || options.length < 2) {
      throw new Error('Options not found')
    }
    
    // 첫 번째 선택지 업데이트
    const { error: updateOption1Error } = await supabase
      .from('quiz_options')
      .update({
        option_text: 'Sí, a menudo lo imagino.',
        result_type: 'centro',
        score_value: 2
      })
      .eq('id', options[0].id)
    
    if (updateOption1Error) {
      throw updateOption1Error
    }
    
    // 두 번째 선택지 업데이트
    const { error: updateOption2Error } = await supabase
      .from('quiz_options')
      .update({
        option_text: 'Casi nunca o no lo pienso.',
        result_type: 'productora',
        score_value: 2
      })
      .eq('id', options[1].id)
    
    if (updateOption2Error) {
      throw updateOption2Error
    }
    
    return NextResponse.json({
      success: true,
      message: 'Successfully updated first question',
      quiz_id: quizId
    })
    
  } catch (error) {
    console.error('Error updating quiz:', error)
    return NextResponse.json(
      { error: 'Failed to update quiz', details: error.message },
      { status: 500 }
    )
  }
}
