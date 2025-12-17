import { NextRequest, NextResponse } from 'next/server'
import { supabaseServer } from '@/lib/supabaseServer'

// 사용자의 퀴즈 결과 조회
export async function GET(
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
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    const resultType = searchParams.get('type')

    // type 파라미터가 있으면 직접 결과 조회 (userId 불필요)
    if (resultType) {
      console.log('[QUIZ_RESULT_API] 결과 타입으로 직접 조회:', { quizId, resultType })
      
      const { data: result, error: resultError } = await supabaseServer
        .from('quiz_results')
        .select('*')
        .eq('quiz_id', quizId)
        .eq('result_type', resultType)
        .single()

      if (resultError || !result) {
        console.error('[QUIZ_RESULT_API] 결과 조회 실패:', resultError)
        return NextResponse.json(
          { error: '결과 정보를 찾을 수 없습니다.' },
          { status: 404 }
        )
      }

      return NextResponse.json({
        success: true,
        result: {
          result_type: result.result_type,
          title: result.title,
          description: result.description,
          image_url: result.image_url,
          characteristic: result.characteristic,
          recommendation: result.recommendation
        }
      })
    }

    // 기존 로직: userId로 결과 계산
    if (!userId) {
      return NextResponse.json(
        { error: '사용자 ID 또는 결과 타입이 필요합니다.' },
        { status: 400 }
      )
    }

    console.log('[QUIZ_RESULT_API] 결과 조회:', { quizId, userId })

    // 사용자 답변 조회
    const { data: responses, error: responsesError } = await supabaseServer
      .from('user_quiz_responses')
      .select(`
        id,
        question_id,
        option_id,
        created_at,
        quiz_options (
          result_type
        )
      `)
      .eq('user_id', userId)
      .eq('quiz_id', quizId)
      .order('created_at', { ascending: false })

    if (responsesError) {
      console.error('[QUIZ_RESULT_API] 답변 조회 실패:', responsesError)
      return NextResponse.json(
        { error: '답변 조회에 실패했습니다.' },
        { status: 500 }
      )
    }

    if (!responses || responses.length === 0) {
      return NextResponse.json(
        { error: '아직 이 퀴즈를 완료하지 않았습니다.' },
        { status: 404 }
      )
    }

    // 최근 답변 그룹 찾기 (created_at 기준으로 5분 이내)
    const latestResponseTime = new Date(responses[0].created_at).getTime()
    const recentResponses = responses.filter(r => {
      const responseTime = new Date(r.created_at).getTime()
      return (latestResponseTime - responseTime) < 5 * 60 * 1000 // 5분
    })

    // result_type 카운트
    const resultTypeCounts: { [key: string]: number } = {}
    
    for (const response of recentResponses) {
      const resultType = (response.quiz_options as any)?.result_type
      if (resultType) {
        resultTypeCounts[resultType] = (resultTypeCounts[resultType] || 0) + 1
      }
    }

    // 가장 많이 선택된 result_type 찾기
    let maxCount = 0
    let dominantType = ''
    
    for (const [type, count] of Object.entries(resultTypeCounts)) {
      if (count > maxCount) {
        maxCount = count
        dominantType = type
      }
    }

    if (!dominantType) {
      return NextResponse.json(
        { error: '결과를 계산할 수 없습니다.' },
        { status: 400 }
      )
    }

    // 결과 정보 조회
    const { data: result, error: resultError } = await supabaseServer
      .from('quiz_results')
      .select('*')
      .eq('quiz_id', quizId)
      .eq('result_type', dominantType)
      .single()

    if (resultError || !result) {
      console.error('[QUIZ_RESULT_API] 결과 조회 실패:', resultError)
      return NextResponse.json(
        { error: '결과 정보를 찾을 수 없습니다.' },
        { status: 404 }
      )
    }

    console.log('[QUIZ_RESULT_API] 결과 조회 완료:', { quizId, userId, resultType: dominantType })

    return NextResponse.json({
      success: true,
      result: {
        result_type: result.result_type,
        title: result.title,
        description: result.description,
        image_url: result.image_url,
        characteristic: result.characteristic,
        recommendation: result.recommendation
      },
      stats: resultTypeCounts,
      completed_at: responses[0].created_at
    })

  } catch (error) {
    console.error('[QUIZ_RESULT_API] 예상치 못한 에러:', error)
    return NextResponse.json(
      { error: '결과 조회 중 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}

