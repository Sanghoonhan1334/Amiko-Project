import { NextRequest, NextResponse } from 'next/server';
import { supabaseClient } from '@/lib/supabaseServer';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    console.log('[QUIZ_DETAIL] API 호출 시작, 퀴즈 ID:', id);
    
    if (!supabaseClient) {
      console.log('[QUIZ_DETAIL] Supabase 클라이언트 없음');
      return NextResponse.json(
        { error: '데이터베이스 연결이 설정되지 않았습니다.' },
        { status: 500 }
      );
    }
    
    const supabase = supabaseClient;

    // 퀴즈 상세 정보 조회
    const { data: quiz, error: quizError } = await supabase
      .from('quizzes')
      .select('*')
      .eq('id', id)
      .eq('is_active', true)
      .single();

    if (quizError) {
      console.log('[QUIZ_DETAIL] 퀴즈 조회 실패:', quizError);
      return NextResponse.json(
        { 
          error: '퀴즈를 찾을 수 없습니다.',
          details: quizError.message
        },
        { status: 404 }
      );
    }

    // 퀴즈 질문들 조회
    const { data: questions, error: questionsError } = await supabase
      .from('quiz_questions')
      .select(`
        *,
        quiz_options (*)
      `)
      .eq('quiz_id', id)
      .order('question_order');

    if (questionsError) {
      console.log('[QUIZ_DETAIL] 질문 조회 실패:', questionsError);
      return NextResponse.json(
        { 
          error: '퀴즈 질문을 조회할 수 없습니다.',
          details: questionsError.message
        },
        { status: 500 }
      );
    }

    // 퀴즈 결과들 조회
    const { data: results, error: resultsError } = await supabase
      .from('quiz_results')
      .select('*')
      .eq('quiz_id', id)
      .order('result_type');

    if (resultsError) {
      console.log('[QUIZ_DETAIL] 결과 조회 실패:', resultsError);
      return NextResponse.json(
        { 
          error: '퀴즈 결과를 조회할 수 없습니다.',
          details: resultsError.message
        },
        { status: 500 }
      );
    }

    console.log('[QUIZ_DETAIL] 퀴즈 상세 조회 성공:', {
      quiz: quiz.title,
      questions: questions?.length || 0,
      results: results?.length || 0
    });

    return NextResponse.json({
      success: true,
      data: {
        quiz,
        questions: questions || [],
        results: results || []
      }
    });

  } catch (error) {
    console.error('[QUIZ_DETAIL] 예상치 못한 오류:', error);
    
    return NextResponse.json(
      { 
        error: '서버 오류가 발생했습니다.', 
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}