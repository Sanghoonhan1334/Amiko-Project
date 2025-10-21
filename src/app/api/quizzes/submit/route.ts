import { NextRequest, NextResponse } from 'next/server';
import { supabaseClient } from '@/lib/supabaseServer';

export async function POST(request: NextRequest) {
  try {
    console.log('[QUIZ_SUBMIT] API 호출 시작');
    
    if (!supabaseClient) {
      console.log('[QUIZ_SUBMIT] Supabase 클라이언트 없음');
      return NextResponse.json(
        { error: '데이터베이스 연결이 설정되지 않았습니다.' },
        { status: 500 }
      );
    }
    
    const supabase = supabaseClient;
    
    // Authorization 헤더에서 토큰 추출
    const authHeader = request.headers.get('authorization');
    console.log('[QUIZ_SUBMIT] Authorization 헤더:', authHeader ? '있음' : '없음');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.log('[QUIZ_SUBMIT] 인증 헤더 없음');
      return NextResponse.json(
        { error: '인증이 필요합니다.' },
        { status: 401 }
      );
    }

    const token = authHeader.replace('Bearer ', '');
    const decodedToken = decodeURIComponent(token);
    console.log('[QUIZ_SUBMIT] 토큰 디코딩 완료');
    
    // 토큰으로 사용자 정보 가져오기
    console.log('[QUIZ_SUBMIT] 사용자 인증 시작');
    const { data: { user }, error: authError } = await supabase.auth.getUser(decodedToken);
    
    if (authError || !user) {
      console.log('[QUIZ_SUBMIT] 사용자 인증 실패:', authError);
      return NextResponse.json(
        { error: '인증이 필요합니다.' },
        { status: 401 }
      );
    }

    console.log('[QUIZ_SUBMIT] 사용자 인증 성공:', user.id);

    // 요청 본문에서 퀴즈 응답 데이터 가져오기
    const body = await request.json();
    const { quizId, responses } = body;
    
    console.log('[QUIZ_SUBMIT] 퀴즈 응답 데이터:', { quizId, responsesCount: responses?.length });

    if (!quizId || !responses || !Array.isArray(responses)) {
      return NextResponse.json(
        { error: '퀴즈 ID와 응답 데이터가 필요합니다.' },
        { status: 400 }
      );
    }

    // 퀴즈 정보 조회
    const { data: quiz, error: quizError } = await supabase
      .from('quizzes')
      .select('*')
      .eq('id', quizId)
      .eq('is_active', true)
      .single();

    if (quizError) {
      console.log('[QUIZ_SUBMIT] 퀴즈 조회 실패:', quizError);
      return NextResponse.json(
        { 
          error: '퀴즈를 찾을 수 없습니다.',
          details: quizError.message
        },
        { status: 404 }
      );
    }

    // MBTI 퀴즈인 경우 MBTI 계산
    if (quiz.category === 'celebrity' || quiz.category === 'personality') {
      console.log('[QUIZ_SUBMIT] MBTI 퀴즈 감지, MBTI 계산 시작');
      
      // 선택된 옵션들의 정보 조회 (MBTI 축 기준으로 결과 계산)
      const optionIds = responses.map(r => r.optionId);
      const { data: options, error: optionsError } = await supabase
        .from('quiz_options')
        .select('id, result_type, mbti_axis, axis_weight')
        .in('id', optionIds);

      if (optionsError) {
        console.log('[QUIZ_SUBMIT] 옵션 조회 실패:', optionsError);
        return NextResponse.json(
          { 
            error: '퀴즈 옵션을 조회할 수 없습니다.',
            details: optionsError.message
          },
          { status: 500 }
        );
      }

      // MBTI 축별 점수 계산
      const mbtiScores = { E: 0, I: 0, S: 0, N: 0, T: 0, F: 0, J: 0, P: 0 };
      
      options?.forEach(option => {
        if (option.mbti_axis && option.axis_weight) {
          const axis = option.mbti_axis;
          const weight = option.axis_weight;
          
          if (axis === 'EI') {
            mbtiScores[weight > 0 ? 'E' : 'I'] += Math.abs(weight);
          } else if (axis === 'SN') {
            mbtiScores[weight > 0 ? 'S' : 'N'] += Math.abs(weight);
          } else if (axis === 'TF') {
            mbtiScores[weight > 0 ? 'T' : 'F'] += Math.abs(weight);
          } else if (axis === 'JP') {
            mbtiScores[weight > 0 ? 'J' : 'P'] += Math.abs(weight);
          }
        }
      });

      // MBTI 타입 결정
      const mbtiType = 
        (mbtiScores.E > mbtiScores.I ? 'E' : 'I') +
        (mbtiScores.S > mbtiScores.N ? 'S' : 'N') +
        (mbtiScores.T > mbtiScores.F ? 'T' : 'F') +
        (mbtiScores.J > mbtiScores.P ? 'J' : 'P');
      
      const dominantResult = mbtiType;
      
      console.log('[QUIZ_SUBMIT] MBTI 계산 완료:', { mbtiType, scores: mbtiScores });

      // 사용자 응답 저장 (각 질문별로 개별 저장)
      const responseInserts = responses.map(response => ({
        user_id: user.id,
        quiz_id: quizId,
        question_id: response.questionId,
        option_id: response.optionId
      }));

      const { error: responseError } = await supabase
        .from('user_quiz_responses')
        .insert(responseInserts);

      if (responseError) {
        console.log('[QUIZ_SUBMIT] 응답 저장 실패:', responseError);
        return NextResponse.json(
          { 
            error: '퀴즈 응답을 저장할 수 없습니다.',
            details: responseError.message
          },
          { status: 500 }
        );
      }

      // 퀴즈 참여자 수 증가
      await supabase
        .from('quizzes')
        .update({ total_participants: quiz.total_participants + 1 })
        .eq('id', quizId);

      console.log('[QUIZ_SUBMIT] MBTI 퀴즈 제출 완료');

      return NextResponse.json({
        success: true,
        data: {
          mbtiType: mbtiType,
          resultType: mbtiType,
          mbtiScores,
          quiz: quiz
        }
      });
    }

    // 일반 퀴즈 처리 (점수 기반)
    console.log('[QUIZ_SUBMIT] 일반 퀴즈 처리 시작');
    
    // 선택된 옵션들의 점수 조회
    const optionIds = responses.map(r => r.optionId);
    const { data: options, error: optionsError } = await supabase
      .from('quiz_options')
      .select('id, score_value, result_type')
      .in('id', optionIds);

    if (optionsError) {
      console.log('[QUIZ_SUBMIT] 옵션 조회 실패:', optionsError);
      return NextResponse.json(
        { 
          error: '퀴즈 옵션을 조회할 수 없습니다.',
          details: optionsError.message
        },
        { status: 500 }
      );
    }

    // 총 점수 계산
    const totalScore = options?.reduce((sum, option) => sum + (option.score_value || 0), 0) || 0;

    // 결과 타입 결정 (가장 높은 점수의 result_type)
    const resultType = options?.reduce((prev, current) => 
      (current.score_value || 0) > (prev.score_value || 0) ? current : prev
    )?.result_type || 'default';

    // 사용자 응답 저장
    const { error: responseError } = await supabase
      .from('user_quiz_responses')
      .insert({
        user_id: user.id,
        quiz_id: quizId,
        responses: responses,
        total_score: totalScore,
        result_type: resultType
      });

    if (responseError) {
      console.log('[QUIZ_SUBMIT] 응답 저장 실패:', responseError);
      return NextResponse.json(
        { 
          error: '퀴즈 응답을 저장할 수 없습니다.',
          details: responseError.message
        },
        { status: 500 }
      );
    }

    // 퀴즈 참여자 수 증가
    await supabase
      .from('quizzes')
      .update({ total_participants: quiz.total_participants + 1 })
      .eq('id', quizId);

    console.log('[QUIZ_SUBMIT] 일반 퀴즈 제출 완료');

    return NextResponse.json({
      success: true,
      data: {
        totalScore,
        resultType,
        quiz: quiz
      }
    });

  } catch (error) {
    console.error('[QUIZ_SUBMIT] 예상치 못한 오류:', error);
    
    return NextResponse.json(
      { 
        error: '서버 오류가 발생했습니다.', 
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}
