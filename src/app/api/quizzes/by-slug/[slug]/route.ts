import { NextRequest, NextResponse } from 'next/server'
import { supabaseClient } from '@/lib/supabaseServer'

export async function GET(
  request: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    const { slug } = params

    console.log('[QUIZ_BY_SLUG] API 호출 시작, 퀴즈 Slug:', slug)

    if (!supabaseClient) {
      return NextResponse.json(
        { error: 'Database connection not available' },
        { status: 500 }
      )
    }

    const supabase = supabaseClient

    // 퀴즈 기본 정보 조회 (slug로)
    const { data: quiz, error: quizError } = await supabase
      .from('quizzes')
      .select('*')
      .eq('slug', slug)
      .eq('is_active', true)
      .single()

    if (quizError || !quiz) {
      console.log('[QUIZ_BY_SLUG] 퀴즈를 찾을 수 없음:', slug)
      return NextResponse.json(
        { error: 'Quiz not found' },
        { status: 404 }
      )
    }

    console.log('[QUIZ_BY_SLUG] 퀴즈 발견:', quiz.title)

    // 질문들과 선택지들 조회
    const { data: questions, error: questionsError } = await supabase
      .from('quiz_questions')
      .select(`
        *,
        quiz_options (*)
      `)
      .eq('quiz_id', quiz.id)
      .order('question_order', { ascending: true })

    if (questionsError) {
      console.log('[QUIZ_BY_SLUG] 질문 조회 실패:', questionsError)
      return NextResponse.json(
        { error: 'Failed to fetch questions' },
        { status: 500 }
      )
    }

    // 결과들 조회
    const { data: results, error: resultsError } = await supabase
      .from('quiz_results')
      .select('*')
      .eq('quiz_id', quiz.id)
      .order('result_type', { ascending: true })

    if (resultsError) {
      console.log('[QUIZ_BY_SLUG] 결과 조회 실패:', resultsError)
      return NextResponse.json(
        { error: 'Failed to fetch results' },
        { status: 500 }
      )
    }

    console.log('[QUIZ_BY_SLUG] 퀴즈 상세 조회 성공:', {
      quiz: quiz.title,
      questions: questions.length,
      results: results.length
    })

    return NextResponse.json({
      success: true,
      data: {
        quiz,
        questions,
        results
      }
    })

  } catch (error: any) {
    console.error('[QUIZ_BY_SLUG] 예상치 못한 오류:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    )
  }
}

