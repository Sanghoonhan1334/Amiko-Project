import { NextRequest, NextResponse } from 'next/server';
import { supabaseClient } from '@/lib/supabaseServer';

export async function POST(request: NextRequest) {
  try {
    console.log('[QUIZZES/CREATE] 퀴즈 완전 생성 API 호출 시작');
    
    if (!supabaseClient) {
      console.log('[QUIZZES/CREATE] Supabase 클라이언트 없음');
      return NextResponse.json(
        { error: '데이터베이스 연결이 설정되지 않았습니다.' },
        { status: 500 }
      );
    }
    
    const supabase = supabaseClient;
    
    // Authorization 헤더에서 토큰 추출
    const authHeader = request.headers.get('authorization');
    console.log('[QUIZZES/CREATE] Authorization 헤더:', authHeader ? '있음' : '없음');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.log('[QUIZZES/CREATE] 인증 헤더 없음');
      return NextResponse.json(
        { error: '인증이 필요합니다.' },
        { status: 401 }
      );
    }

    const token = authHeader.replace('Bearer ', '');
    const decodedToken = decodeURIComponent(token);
    console.log('[QUIZZES/CREATE] 토큰 디코딩 완료');
    
    // 토큰으로 사용자 정보 가져오기
    const { data: { user }, error: authError } = await supabase.auth.getUser(decodedToken);
    
    if (authError || !user) {
      console.log('[QUIZZES/CREATE] 사용자 인증 실패:', authError);
      return NextResponse.json(
        { error: '인증이 필요합니다.' },
        { status: 401 }
      );
    }

    console.log('[QUIZZES/CREATE] 사용자 인증 성공:', user.id);

    // 관리자 권한 확인
    const { data: userInfo, error: profileError } = await supabase
      .from('users')
      .select('is_admin')
      .eq('id', user.id)
      .single();

    if (profileError || !userInfo?.is_admin) {
      console.log('[QUIZZES/CREATE] 관리자 권한 없음');
      return NextResponse.json(
        { error: '관리자 권한이 필요합니다.' },
        { status: 403 }
      );
    }

    // 요청 본문에서 퀴즈 데이터 가져오기
    const body = await request.json();
    const { title, description, category, thumbnail_url, questions } = body;
    
    console.log('[QUIZZES/CREATE] 퀴즈 생성 데이터:', { 
      title, 
      category, 
      questionsCount: questions?.length || 0 
    });

    // 검증
    if (!title?.trim()) {
      return NextResponse.json(
        { error: '퀴즈 제목을 입력해주세요.' },
        { status: 400 }
      );
    }

    if (!questions || questions.length === 0) {
      return NextResponse.json(
        { error: '최소 1개 이상의 질문을 추가해주세요.' },
      { status: 400 }
      );
    }

    // 트랜잭션으로 퀴즈와 질문들을 함께 생성
    const { data: quiz, error: createError } = await supabase
      .from('quizzes')
      .insert({
        title: title.trim(),
        description: description?.trim() || null,
        category: category || 'personality',
        thumbnail_url: thumbnail_url?.trim() || null,
        total_questions: questions.length,
        created_by: user.id
      })
      .select()
      .single();

    if (createError) {
      console.log('[QUIZZES/CREATE] 퀴즈 생성 실패:', createError);
      return NextResponse.json(
        { 
          error: '퀴즈를 생성할 수 없습니다.',
          details: createError.message
        },
        { status: 500 }
      );
    }

    console.log('[QUIZZES/CREATE] 퀴즈 생성 성공:', quiz.id);

    // 질문들 생성
    const quizQuestions = [];
    const quizOptions = [];

    for (const questionData of questions) {
      const { data: question, error: questionError } = await supabase
        .from('quiz_questions')
        .insert({
          quiz_id: quiz.id,
          question_text: questionData.question_text?.trim(),
          question_order: questionData.question_order || 1,
          question_type: 'single_choice'
        })
        .select()
        .single();

      if (questionError) {
        console.log('[QUIZZES/CREATE] 질문 생성 실패:', questionError);
        // 롤백을 위해 퀴즈 삭제
        await supabase.from('quizzes').delete().eq('id', quiz.id);
        return NextResponse.json(
          { 
            error: '질문 생성 중 오류가 발생했습니다.',
            details: questionError.message
          },
          { status: 500 }
        );
      }

      quizQuestions.push(question);

      // 선택지들 생성
      for (const optionData of questionData.quiz_options || []) {
        const { data: option, error: optionError } = await supabase
          .from('quiz_options')
          .insert({
            question_id: question.id,
            option_text: optionData.option_text?.trim(),
            option_order: optionData.option_order || 1,
            result_type: optionData.result_type?.trim() || null,
            score_value: optionData.score_value || 0
          })
          .select()
          .single();

        if (optionError) {
          console.log('[QUIZZES/CREATE] 선택지 생성 실패:', optionError);
          // 롤백을 위해 관련 데이터 삭제
          await supabase.from('quiz_questions').delete().eq('quiz_id', quiz.id);
          await supabase.from('quizzes').delete().eq('id', quiz.id);
          return NextResponse.json(
            { 
              error: '선택지 생성 중 오류가 발생했습니다.',
              details: optionError.message
            },
            { status: 500 }
          );
        }

        quizOptions.push(option);
      }
    }

    console.log('[QUIZZES/CREATE] 퀴즈 완전 생성 성공:', {
      quizId: quiz.id,
      questionsCount: quizQuestions.length,
      optionsCount: quizOptions.length
    });

    return NextResponse.json({
      success: true,
      data: {
        quiz,
        questions: quizQuestions,
        options: quizOptions
      }
    });

  } catch (error) {
    console.error('[QUIZZES/CREATE] 예상치 못한 오류:', error);
    
    return NextResponse.json(
      { 
        error: '서버 오류가 발생했습니다.', 
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}
