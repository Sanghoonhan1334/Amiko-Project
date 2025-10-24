import { NextRequest, NextResponse } from 'next/server';
import { supabaseClient } from '@/lib/supabaseServer';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    console.log('[QUIZ_DETAIL] API 호출 시작, 퀴즈 ID/Slug:', id);

    // 아이돌 포지션 테스트만 차단
    if (id === 'a11f4f9d-8819-49d9-bfd0-4d4a97641981' || id.includes('idol-position')) {
      console.log('[QUIZ_DETAIL] 아이돌 포지션 테스트 차단');
      return NextResponse.json({
        success: false,
        error: '해당 테스트는 현재 사용할 수 없습니다.'
      });
    }
    
    // 샘플/임베디드 퀴즈인 경우 미리 정의된 데이터 반환
    if (id.startsWith('sample-mbti') || id.startsWith('embedded-mbti')) {
      return NextResponse.json({
        success: true,
        data: {
          quiz: {
            id: id,
            title: '🎯 간단 MBTI 테스트',
            description: '당신의 성격 유형을 간단히 알아보세요',
            category: 'personality',
            total_questions: 4,
            total_participants: 0,
            is_active: true,
            created_at: new Date().toISOString()
          },
          questions: [],
          results: []
        }
      });
    }
    
    if (!supabaseClient) {
      console.log('[QUIZ_DETAIL] Supabase 클라이언트 없음');
      return NextResponse.json(
        { error: '데이터베이스 연결이 설정되지 않았습니다.' },
        { status: 500 }
      );
    }
    
    const supabase = supabaseClient;

    // 퀴즈 상세 정보 조회 - ID로만 조회 (slug 컬럼 제거됨)
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

    // 실제 quiz_id를 사용하여 관련 데이터 조회
    const quizId = quiz.id;
    console.log('[QUIZ_DETAIL] 퀴즈 발견:', quiz.title, '(ID:', quizId, ')');

    // 퀴즈 질문들 조회 - 반드시 quiz_id로 필터링
    const { data: questions, error: questionsError } = await supabase
      .from('quiz_questions')
      .select(`
        *,
        quiz_options (*)
      `)
      .eq('quiz_id', quizId)
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

    // 퀴즈 결과들 조회 - 반드시 quiz_id로 필터링
    const { data: results, error: resultsError } = await supabase
      .from('quiz_results')
      .select('*')
      .eq('quiz_id', quizId)
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