import { NextRequest, NextResponse } from 'next/server';
import { supabaseClient } from '@/lib/supabaseServer';

export async function POST(request: NextRequest) {
  try {
    console.log('[CREATE_SAMPLE_TEST] 샘플 테스트 생성 시작');
    
    // 간단한 MBTI 테스트 생성
    const sampleQuiz = {
      id: 'sample-mbti-test-001',
      title: '🎯 간단 MBTI 테스트',
      description: '당신의 성격 유형을 간단히 알아보세요',
      category: 'personality',
      total_questions: 4,
      is_active: true
    };

    if (supabaseClient) {
      const supabase = supabaseClient;
      
      // 기존 테스트가 있는지 확인
      const { data: existingQuiz } = await supabase
        .from('quizzes')
        .select('id')
        .eq('id', sampleQuiz.id)
        .single();

      if (existingQuiz) {
        console.log('[CREATE_SAMPLE_TEST] 이미 샘플 테스트가 존재함');
        return NextResponse.json({
          success: true,
          message: '샘플 테스트가 이미 존재합니다.',
          quizId: sampleQuiz.id
        });
      }

      // 퀴즈 생성
      const { data: quiz, error: quizError } = await supabase
        .from('quizzes')
        .insert(sampleQuiz)
        .select()
        .single();

      if (quizError) {
        console.log('[CREATE_SAMPLE_TEST] 퀴즈 생성 실패:', quizError);
        return NextResponse.json(
          { error: '샘플 퀴즈 생성에 실패했습니다.' },
          { status: 500 }
        );
      }

      // 간단한 질문들 생성
      const sampleQuestions = [
        {
          question_text: '친구들과 모임에서 당신은?',
          question_order: 1,
          quiz_options: [
            { option_text: '적극적으로 대화에 참여한다', result_type: 'E', option_order: 1 },
            { option_text: '조용히 듣고 있을 때가 많다', result_type: 'I', option_order: 2 }
          ]
        },
        {
          question_text: '새로운 환경에서는?',
          question_order: 2,
          quiz_options: [
            { option_text: '빨리 다른 사람들과 어울린다', result_type: 'E', option_order: 1 },
            { option_text: '시간이 걸리며 신중하다', result_type: 'I', option_order: 2 }
          ]
        },
        {
          question_text: '문제 해결 방식은?',
          question_order: 3,
          quiz_options: [
            { option_text: '단계별로 차근차근 해결한다', result_type: 'S', option_order: 1 },
            { option_text: '전체적인 그림을 먼저 파악한다', result_type: 'N', option_order: 2 }
          ]
        },
        {
          question_text: '중요한 결정을 내릴 때는?',
          question_order: 4,
          quiz_options: [
            { option_text: '논리적이고 객관적으로 판단한다', result_type: 'T', option_order: 1 },
            { option_text: '감정과 가치관을 고려한다', result_type: 'F', option_order: 2 }
          ]
        }
      ];

      // 질문들 저장
      for (const questionData of sampleQuestions) {
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
          console.log('[CREATE_SAMPLE_TEST] 질문 생성 실패:', questionError);
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

      // 결과 데이터 생성
      const sampleResults = [
        {
          result_type: 'INTJ',
          title: 'INTJ - 건축가',
          description: '전략적이고 독립적인 생각의 소유자입니다.',
          characteristic: '독립적이고 목표 지향적이며 논리적이고 체계적으로 사고합니다. 완벽주의 성향이 강합니다.',
          recommendation: '독서와 자기계발을 통해 성장하고, 전략적 계획 수립을 통해 목표를 달성하세요.'
        },
        {
          result_type: 'ENFP',
          title: 'ENFP - 운동가',
          description: '열정적이고 창의적인 영감을 주는 사람입니다.',
          characteristic: '열정적이고 창의적이며 사교적이고 진정성 있습니다. 새로운 가능성을 추구합니다.',
          recommendation: '창의적 프로젝트에 도전하고, 새로운 사람들과의 만남에서 영감을 얻으세요.'
        },
        {
          result_type: 'ISTJ',
          title: 'ISTJ - 관리자',
          description: '실용적이고 사실적인 논리주의자입니다.',
          characteristic: '실용적이고 사실적이며 책임감이 강하고 조직적입니다. 전통을 중시합니다.',
          recommendation: '구체적인 과제를 체계적으로 수행하며, 전통적인 방법을 활용하세요.'
        },
        {
          result_type: 'ESFP',
          title: 'ESFP - 연예인',
          description: '자유롭고 활기찬 연예인입니다.',
          characteristic: '자유롭고 열정적이며 사교적이고 친근합니다. 현재 순간을 즐깁니다.',
          recommendation: '사회적 활동을 통해 에너지를 발산하고, 예술적 표현을 통해 자신을 드러내세요.'
        }
      ];

      // 결과들 저장
      for (const resultData of sampleResults) {
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

      console.log('[CREATE_SAMPLE_TEST] 샘플 테스트 생성 완료');

      return NextResponse.json({
        success: true,
        message: '샘플 테스트가 성공적으로 생성되었습니다!',
        quizId: quiz.id
      });
    } else {
      // Supabase 없이도 응답
      return NextResponse.json({
        success: false,
        message: '데이터베이스 연결이 필요합니다.'
      });
    }

  } catch (error) {
    console.error('[CREATE_SAMPLE_TEST] 예상치 못한 오류:', error);
    
    return NextResponse.json(
      { 
        error: '서버 오류가 발생했습니다.', 
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}
