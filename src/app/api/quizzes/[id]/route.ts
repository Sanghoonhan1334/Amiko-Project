import { NextRequest, NextResponse } from 'next/server';
import { supabaseClient, supabaseServer } from '@/lib/supabaseServer';
import { requireAdmin } from '@/lib/admin-auth';

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

    // UUID 형식인지 확인하는 함수
    const isUUID = (str: string) => {
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      return uuidRegex.test(str);
    };

    let quiz, quizError;

    // fortune-test-2024는 slug로 조회 (id는 UUID 타입이므로)
    if (id === 'fortune-test-2024') {
      console.log('[QUIZ_DETAIL] 운세 테스트 slug로 조회: fortune');
      const result = await supabase
        .from('quizzes')
        .select('*')
        .eq('slug', 'fortune')
        .maybeSingle(); // is_active 체크 없이 조회
      quiz = result.data;
      quizError = result.error;
    }
    // UUID 형식인 경우 ID로 조회, 그렇지 않으면 slug로 조회
    else if (isUUID(id)) {
      console.log('[QUIZ_DETAIL] UUID 형식으로 ID 조회:', id);
      const result = await supabase
        .from('quizzes')
        .select('*')
        .eq('id', id)
        .eq('is_active', true)
        .single();
      quiz = result.data;
      quizError = result.error;
    } else {
      console.log('[QUIZ_DETAIL] slug 형식으로 조회:', id);
      const result = await supabase
        .from('quizzes')
        .select('*')
        .eq('slug', id)
        .eq('is_active', true)
        .single();
      quiz = result.data;
      quizError = result.error;
    }

    if (quizError || !quiz) {
      console.log('[QUIZ_DETAIL] 퀴즈 조회 실패:', quizError || 'Quiz not found');
      // fortune-test-2024의 경우 퀴즈가 없어도 기본 데이터 반환
      if (id === 'fortune-test-2024') {
        console.log('[QUIZ_DETAIL] 운세 테스트 기본 데이터 반환');
        return NextResponse.json({
          success: true,
          data: {
            quiz: {
              slug: 'fortune',
              title: 'Test de Fortuna Personalizada',
              description: 'Descubre tu fortuna de hoy basada en tu estado emocional y personalidad. ¡Un test único que te revelará qué te depara el destino!',
              category: 'fortune',
              thumbnail_url: '/quizzes/fortune/cover/cover.png',
              total_questions: 9,
              total_participants: 0,
              is_active: true,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            },
            questions: [],
            results: []
          }
        });
      }
      return NextResponse.json(
        { 
          error: '퀴즈를 찾을 수 없습니다.',
          details: quizError?.message || 'Quiz not found'
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
      quizId: quizId,
      questions: questions?.length || 0,
      results: results?.length || 0
    });

    // 디버깅: 질문 데이터 상세 로그
    if (questions && questions.length > 0) {
      console.log('[QUIZ_DETAIL] 첫 번째 질문 샘플:', {
        id: questions[0].id,
        question_text: questions[0].question_text,
        question_order: questions[0].question_order,
        quiz_options_count: questions[0].quiz_options?.length || 0
      });
    } else {
      console.log('[QUIZ_DETAIL] ⚠️ 질문이 없습니다! quizId:', quizId);
      // quizId로 직접 확인
      const { data: directCheck } = await supabase
        .from('quiz_questions')
        .select('id, question_text, question_order')
        .eq('quiz_id', quizId)
        .limit(5);
      console.log('[QUIZ_DETAIL] 직접 조회 결과:', directCheck);
    }

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

// PUT /api/quizzes/[id] — Admin: update quiz metadata
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdmin(request);
  if (!auth.authenticated) return auth.response;

  const { id } = await params;

  if (!supabaseServer) {
    return NextResponse.json({ error: 'Database not configured' }, { status: 500 });
  }

  try {
    const body = await request.json();
    const { title, description, category, thumbnail_url, is_active } = body;

    if (!title?.trim()) {
      return NextResponse.json({ error: 'El título es obligatorio.' }, { status: 400 });
    }

    const { data: updated, error } = await supabaseServer
      .from('quizzes')
      .update({
        title: title.trim(),
        description: description?.trim() || null,
        category: category || 'personality',
        thumbnail_url: thumbnail_url?.trim() || null,
        is_active: is_active !== undefined ? is_active : true,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('[QUIZ_PUT] Error updating quiz:', error);
      return NextResponse.json({ error: 'Error al actualizar el test.' }, { status: 500 });
    }

    return NextResponse.json({ success: true, data: updated });
  } catch (err) {
    console.error('[QUIZ_PUT] Exception:', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

// DELETE /api/quizzes/[id] — Admin: delete quiz and all related data
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdmin(request);
  if (!auth.authenticated) return auth.response;

  const { id } = await params;

  if (!supabaseServer) {
    return NextResponse.json({ error: 'Database not configured' }, { status: 500 });
  }

  try {
    // Delete options first (child of questions)
    const { data: questions } = await supabaseServer
      .from('quiz_questions')
      .select('id')
      .eq('quiz_id', id);

    if (questions && questions.length > 0) {
      const questionIds = questions.map((q: { id: string }) => q.id);
      await supabaseServer.from('quiz_options').delete().in('question_id', questionIds);
      await supabaseServer.from('quiz_questions').delete().eq('quiz_id', id);
    }

    // Delete quiz results
    await supabaseServer.from('quiz_results').delete().eq('quiz_id', id);

    // Delete the quiz itself
    const { error } = await supabaseServer.from('quizzes').delete().eq('id', id);

    if (error) {
      console.error('[QUIZ_DELETE] Error deleting quiz:', error);
      return NextResponse.json({ error: 'Error al eliminar el test.' }, { status: 500 });
    }

    console.log('[QUIZ_DELETE] Quiz deleted by', auth.user.email, ':', id);
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('[QUIZ_DELETE] Exception:', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}