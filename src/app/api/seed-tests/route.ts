import { NextRequest, NextResponse } from 'next/server';
import { supabaseClient } from '@/lib/supabaseServer';

export async function POST(request: NextRequest) {
  try {
    console.log('[SEED_TESTS] 테스트 데이터 생성 시작');
    
    if (!supabaseClient) {
      return NextResponse.json(
        { error: '데이터베이스 연결이 설정되지 않았습니다.' },
        { status: 500 }
      );
    }
    
    const supabase = supabaseClient;
    
    // Authorization 헤더에서 토큰 추출 (관리자 권한 체크)
    const authHeader = request.headers.get('authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: '인증이 필요합니다.' },
        { status: 401 }
      );
    }

    const token = authHeader.replace('Bearer ', '');
    const decodedToken = decodeURIComponent(token);
    
    const { data: { user }, error: authError } = await supabase.auth.getUser(decodedToken);
    
    if (authError || !user) {
      return NextResponse.json(
        { error: '인증에 실패했습니다.' },
        { status: 401 }
      );
    }

    // 관리자 권한 확인
    const { data: userInfo } = await supabase
      .from('users')
      .select('is_admin')
      .eq('id', user.id)
      .single();

    if (!userInfo?.is_admin) {
      return NextResponse.json(
        { error: '관리자 권한이 필요합니다.' },
        { status: 403 }
      );
    }

    // 간단한 MBTI 테스트 생성
    const { data: quiz, error: quizError } = await supabase
      .from('quizzes')
      .insert({
        title: '🎯 간단 MBTI 테스트',
        description: '당신의 성격 유형을 간단히 알아보세요',
        category: 'personality',
        total_questions: 6,
        is_active: true
      })
      .select()
      .single();

    if (quizError) {
      console.log('[SEED_TESTS] 퀴즈 생성 실패:', quizError);
      return NextResponse.json(
        { error: '퀴즈 생성에 실패했습니다.' },
        { status: 500 }
      );
    }

    // 질문들 생성
    const questions = [
      {
        id: `q${Date.now()}-1`,
        question_text: '친구들과 모임에서 당신은?',
        question_order: 1,
        quiz_options: [
          { option_text: '적극적으로 대화에 참여한다', result_type: 'E', option_order: 1 },
          { option_text: '조용히 듣고 있을 때가 많다', result_type: 'I', option_order: 2 }
        ]
      },
      {
        id: `q${Date.now()}-2`,
        question_text: '새로운 환경에서는?',
        question_order: 2,
        quiz_options: [
          { option_text: '빨리 다른 사람들과 어울린다', result_type: 'E', option_order: 1 },
          { option_text: '시간이 걸리며 신중하다', result_type: 'I', option_order: 2 }
        ]
      },
      {
        id: `q${Date.now()}-3`,
        question_text: '문제 해결 방식은?',
        question_order: 3,
        quiz_options: [
          { option_text: '단계별로 차근차근 해결한다', result_type: 'S', option_order: 1 },
          { option_text: '전체적인 그림을 먼저 파악한다', result_type: 'N', option_order: 2 }
        ]
      },
      {
        id: `q${Date.now()}-4`,
        question_text: '중요한 결정을 내릴 때는?',
        question_order: 4,
        quiz_options: [
          { option_text: '논리적이고 객관적으로 판단한다', result_type: 'T', option_order: 1 },
          { option_text: '감정과 가치관을 고려한다', result_type: 'F', option_order: 2 }
        ]
      },
      {
        id: `q${Date.now()}-5`,
        question_text: '일 처리 방식은?',
        question_order: 5,
        quiz_options: [
          { option_text: '계획을 세우고 순서대로 진행한다', result_type: 'J', option_order: 1 },
          { option_text: '유연하게 상황에 맞춰 진행한다', result_type: 'P', option_order: 2 }
        ]
      },
      {
        id: `q${Date.now()}-6`,
        question_text: '스트레스를 받을 때는?',
        question_order: 6,
        quiz_options: [
          { option_text: '다른 사람들과 활동하기를 좋아한다', result_type: 'E', option_order: 1 },
          { option_text: '혼자만의 시간이 필요하다', result_type: 'I', option_order: 2 }
        ]
      }
    ];

    // 질문들 저장
    for (const questionData of questions) {
      const { data: question, error: questionError } = await supabase
        .from('quiz_questions')
        .insert({
          quiz_id: quiz.id,
          question_text: questionData.question_text,
          question_order: questionData.question_order,
          question_type: 'single_choice'
        })
        .select()
        .single();

      if (questionError) {
        console.log('[SEED_TESTS] 질문 생성 실패:', questionError);
        continue;
      }

      // 선택지들 저장
      for (const optionData of questionData.quiz_options) {
        await supabase
          .from('quiz_options')
          .insert({
            question_id: question.id,
            option_text: optionData.option_text,
            option_order: optionData.option_order,
            result_type: optionData.result_type
          });
      }
    }

    // 결과들 생성
    const results = [
      {
        result_type: 'INTJ',
        title: 'INTJ - 건축가',
        description: '전략적이고 독립적인 생각의 소유자입니다.',
        characteristic: '독립적이고 목표 지향적이며 논리적이고 체계적으로 사고합니다.',
        recommendation: '독서와 자기계발, 전략적 계획 수립을 추천합니다.'
      },
      {
        result_type: 'ENFP',
        title: 'ENFP - 운동가',
        description: '열정적이고 창의적인 영감을 주는 사람입니다.',
        characteristic: '열정적이고 창의적이며 사교적이고 진정성 있습니다.',
        recommendation: '창의적 프로젝트와 새로운 사람들과의 만남을 추천합니다.'
      },
      {
        result_type: 'ISTJ',
        title: 'ISTJ - 관리자',
        description: '실용적이고 사실적인 논리주의자입니다.',
        characteristic: '실용적이고 사실적이며 책임감이 강하고 조직적입니다.',
        recommendation: '구체적인 과제 수행과 체계적인 일 처리를 추천합니다.'
      },
      {
        result_type: 'ESFP',
        title: 'ESFP - 연예인',
        description: '자유롭고 활기찬 연예인입니다.',
        characteristic: '자유롭고 열정적이며 사교적이고 친근합니다.',
        recommendation: '사회적 활동과 예술적 표현을 추천합니다.'
      }
    ];

    // 결과들 저장
    for (const resultData of results) {
      await supabase
        .from('quiz_results')
        .insert({
          quiz_id: quiz.id,
          result_type: resultData.result_type,
          title: resultData.title,
          description: resultData.description,
          characteristic: resultData.characteristic,
          recommendation: resultData.recommendation
        });
    }

    console.log('[SEED_TESTS] 테스트 데이터 생성 완료');

    return NextResponse.json({
      success: true,
      message: '샘플 테스트가 성공적으로 생성되었습니다!',
      quizId: quiz.id
    });

  } catch (error) {
    console.error('[SEED_TESTS] 예상치 못한 오류:', error);
    
    return NextResponse.json(
      { 
        error: '서버 오류가 발생했습니다.', 
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}
