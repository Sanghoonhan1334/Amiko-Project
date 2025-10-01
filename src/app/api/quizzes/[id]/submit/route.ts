import { NextRequest, NextResponse } from 'next/server'
import { supabaseServer } from '@/lib/supabaseServer'

// 퀴즈 답변 제출 및 MBTI 결과 계산
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    if (!supabaseServer) {
      return NextResponse.json(
        { error: '데이터베이스 연결이 설정되지 않았습니다.' },
        { status: 500 }
      )
    }

    const { id: quizId } = await params
    const { answers, userId } = await request.json()

    if (!answers || !Array.isArray(answers) || answers.length === 0) {
      return NextResponse.json(
        { error: '답변이 필요합니다.' },
        { status: 400 }
      )
    }

    console.log('[QUIZ_SUBMIT_API] 퀴즈 제출:', { quizId, userId, answersCount: answers.length })

    // 퀴즈 존재 확인
    const { data: quiz, error: quizError } = await supabaseServer
      .from('quizzes')
      .select('id, title, category')
      .eq('id', quizId)
      .eq('is_active', true)
      .single()

    if (quizError || !quiz) {
      return NextResponse.json(
        { error: '퀴즈를 찾을 수 없습니다.' },
        { status: 404 }
      )
    }

    // MBTI 축별 점수 계산
    const axisScores: { [key: string]: number } = {
      EI: 0,
      SN: 0,
      TF: 0,
      JP: 0
    }
    
    for (const answer of answers) {
      const { question_id, option_id } = answer

      // 선택지 정보 조회 (mbti_axis, axis_weight 포함)
      const { data: option, error: optionError } = await supabaseServer
        .from('quiz_options')
        .select('mbti_axis, axis_weight')
        .eq('id', option_id)
        .eq('question_id', question_id)
        .single()

      if (optionError || !option) {
        console.error('[QUIZ_SUBMIT_API] 잘못된 선택지:', { question_id, option_id })
        continue
      }

      // MBTI 축별 점수 누적
      const { mbti_axis, axis_weight } = option
      if (mbti_axis && axis_weight !== null) {
        axisScores[mbti_axis] = (axisScores[mbti_axis] || 0) + axis_weight
      }
    }

    // MBTI 4글자 조합 생성
    const mbtiCode = 
      (axisScores.EI > 0 ? 'E' : 'I') +
      (axisScores.SN > 0 ? 'S' : 'N') +
      (axisScores.TF > 0 ? 'T' : 'F') +
      (axisScores.JP > 0 ? 'J' : 'P')

    console.log('[QUIZ_SUBMIT_API] MBTI 계산 완료:', { axisScores, mbtiCode })

    // 사용자 답변 저장 (userId가 있는 경우)
    if (userId) {
      for (const answer of answers) {
        const { question_id, option_id } = answer

        await supabaseServer
          .from('user_quiz_responses')
          .insert({
            user_id: userId,
            quiz_id: quizId,
            question_id,
            option_id
          })
      }
    }

    // MBTI 기반 결과 조회
    const { data: result, error: resultError } = await supabaseServer
      .from('quiz_results')
      .select('*')
      .eq('quiz_id', quizId)
      .eq('mbti_code', mbtiCode)
      .single()

    if (resultError || !result) {
      console.error('[QUIZ_SUBMIT_API] 결과 조회 실패:', resultError)
      return NextResponse.json(
        { error: '결과 정보를 찾을 수 없습니다.' },
        { status: 404 }
      )
    }

    // 같은 MBTI의 연예인 매칭 (랜덤 3명)
    const { data: celebrities, error: celebError } = await supabaseServer
      .from('celeb_profiles')
      .select('*')
      .eq('mbti_code', mbtiCode)
      .limit(10)

    let matchedCelebs = celebrities || []
    
    // 랜덤 섞기 및 최대 3명 선택
    if (matchedCelebs.length > 0) {
      matchedCelebs = matchedCelebs
        .sort(() => Math.random() - 0.5)
        .slice(0, 3)
    }

    console.log('[QUIZ_SUBMIT_API] 퀴즈 제출 완료:', { quizId, mbtiCode, celebsCount: matchedCelebs.length })

    return NextResponse.json({
      success: true,
      mbti_code: mbtiCode,
      axis_scores: axisScores,
      result: {
        result_type: result.result_type,
        mbti_code: result.mbti_code,
        title: result.title,
        description: result.description,
        image_url: result.image_url,
        characteristic: result.characteristic,
        recommendation: result.recommendation
      },
      celebrities: matchedCelebs.map(celeb => ({
        id: celeb.id,
        stage_name: celeb.stage_name,
        group_name: celeb.group_name,
        mbti_code: celeb.mbti_code,
        profile_image_url: celeb.profile_image_url,
        source_url: celeb.source_url,
        source_note: celeb.source_note,
        source_date: celeb.source_date,
        is_verified: celeb.is_verified
      }))
    })

  } catch (error) {
    console.error('[QUIZ_SUBMIT_API] 예상치 못한 에러:', error)
    return NextResponse.json(
      { error: '퀴즈 제출 중 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}

