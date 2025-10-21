import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient()

    // 퀴즈 기본 정보 조회
    const { data: quiz, error: quizError } = await supabase
      .from('quizzes')
      .select('*')
      .eq('id', 'idol-position-test-001')
      .single()

    if (quizError) {
      console.error('Quiz fetch error:', quizError)
      return NextResponse.json(
        { error: 'Quiz not found' },
        { status: 404 }
      )
    }

    // 질문들 조회
    const { data: questions, error: questionsError } = await supabase
      .from('quiz_questions')
      .select(`
        id,
        question_text,
        question_order,
        quiz_options (
          id,
          option_text,
          option_order,
          result_type,
          score_value
        )
      `)
      .eq('quiz_id', 'idol-position-test-001')
      .order('question_order')

    if (questionsError) {
      console.error('Questions fetch error:', questionsError)
      return NextResponse.json(
        { error: 'Questions not found' },
        { status: 404 }
      )
    }

    // 결과 유형들 조회
    const { data: results, error: resultsError } = await supabase
      .from('quiz_results')
      .select('*')
      .eq('quiz_id', 'idol-position-test-001')

    if (resultsError) {
      console.error('Results fetch error:', resultsError)
      return NextResponse.json(
        { error: 'Results not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      data: {
        quiz,
        questions,
        results
      }
    })

  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
