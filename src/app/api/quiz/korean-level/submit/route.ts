import { NextRequest, NextResponse } from 'next/server'
import { supabaseServer } from '@/lib/supabaseServer'

// 한국어 레벨 테스트 정답 데이터
const CORRECT_ANSWERS = [2, 1, 3, 1, 3, 1, 2, 0, 2, 1] // 10개 질문의 정답 인덱스 (0-based)

// 레벨 계산 함수
function calculateLevel(score: number): { level: string; levelKo: string } {
  if (score >= 80) {
    return { level: 'Avanzado', levelKo: '고급' }
  } else if (score >= 50) {
    return { level: 'Intermedio', levelKo: '중급' }
  } else {
    return { level: 'Básico', levelKo: '기초' }
  }
}

export async function POST(request: NextRequest) {
  try {
    if (!supabaseServer) {
      return NextResponse.json(
        { error: 'Database connection not available' },
        { status: 500 }
      )
    }

    const { answers, userId } = await request.json()

    if (!answers || !Array.isArray(answers) || answers.length === 0) {
      return NextResponse.json(
        { error: 'Answers are required' },
        { status: 400 }
      )
    }

    console.log('[KOREAN_LEVEL_SUBMIT] 제출:', { userId, answersCount: answers.length })

    // 점수 계산
    let correctCount = 0
    for (let i = 0; i < answers.length && i < CORRECT_ANSWERS.length; i++) {
      if (answers[i] === CORRECT_ANSWERS[i]) {
        correctCount++
      }
    }

    const totalQuestions = CORRECT_ANSWERS.length
    const score = Math.round((correctCount / totalQuestions) * 100)
    const { level, levelKo } = calculateLevel(score)

    console.log('[KOREAN_LEVEL_SUBMIT] 계산 결과:', {
      correctCount,
      totalQuestions,
      score,
      level
    })

    // 결과 저장
    const quizId = '2c9a43d4-0958-4d00-8bd1-522971617e62' // 한국어 레벨 테스트 ID

    const { data: result, error: insertError } = await supabaseServer
      .from('user_korean_level_results')
      .insert({
        user_id: userId || null,
        quiz_id: quizId,
        score,
        level,
        level_ko: levelKo,
        correct_count: correctCount,
        total_questions: totalQuestions,
        answers: answers
      })
      .select()
      .single()

    if (insertError) {
      console.error('[KOREAN_LEVEL_SUBMIT] 저장 실패:', insertError)
      return NextResponse.json(
        { error: 'Failed to save result', details: insertError.message },
        { status: 500 }
      )
    }

    console.log('[KOREAN_LEVEL_SUBMIT] 저장 성공:', result.id)

    // 퀴즈 참여자 수 증가
    const { data: quiz } = await supabaseServer
      .from('quizzes')
      .select('total_participants')
      .eq('id', quizId)
      .single()
    
    if (quiz) {
      await supabaseServer
        .from('quizzes')
        .update({ total_participants: (quiz.total_participants || 0) + 1 })
        .eq('id', quizId)
      console.log('[KOREAN_LEVEL_SUBMIT] 참여자 수 증가:', (quiz.total_participants || 0) + 1)
    }

    return NextResponse.json({
      success: true,
      resultId: result.id,
      score,
      level,
      levelKo,
      correctCount,
      totalQuestions
    })
  } catch (error: any) {
    console.error('[KOREAN_LEVEL_SUBMIT] 에러:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    )
  }
}
