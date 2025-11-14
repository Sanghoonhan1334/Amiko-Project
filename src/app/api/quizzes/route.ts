import { NextRequest, NextResponse } from 'next/server';
import { supabaseClient } from '@/lib/supabaseServer';

export async function GET(request: NextRequest) {
  try {
    console.log('[QUIZZES] API 호출 시작');
    
    if (!supabaseClient) {
      console.log('[QUIZZES] Supabase 클라이언트 없음');
      return NextResponse.json(
        { error: '데이터베이스 연결이 설정되지 않았습니다.' },
        { status: 500 }
      );
    }
    
    const supabase = supabaseClient;
    
    // URL 파라미터에서 카테고리 가져오기
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    
    console.log('[QUIZZES] 카테고리:', category);

    // 퀴즈 목록 조회 - slug 필드 포함
    let query = supabase
      .from('quizzes')
      .select('id, slug, title, description, category, thumbnail_url, total_questions, total_participants, is_active, created_at, updated_at')
      .eq('is_active', true)
      .order('created_at', { ascending: false });

    // category 필터
    if (category) {
      query = query.eq('category', category);
    }

    const { data: quizzes, error: quizzesError } = await query;
    
    // fortune 관련 퀴즈 중복 제거 및 통합
    let quizzesList = quizzes || []
    
    // DB에서 slug='fortune'으로 조회 (id는 UUID 타입이므로 slug 사용)
    const { data: dbFortuneQuiz } = await supabase
      .from('quizzes')
      .select('id, slug, title, description, category, thumbnail_url, total_questions, total_participants, is_active, created_at, updated_at')
      .eq('slug', 'fortune')
      .maybeSingle()
    
    // slug='fortune'인 퀴즈들 찾기
    const fortuneQuizzes = quizzesList.filter((q: any) => 
      q.slug === 'fortune'
    )
    
    // fortune 퀴즈 결정: DB에 있으면 DB 데이터 우선, 없으면 목록에서 찾기
    let fortuneQuiz = null
    if (dbFortuneQuiz) {
      // DB에 있으면 DB 데이터 사용 (최신 참여자 수 포함)
      fortuneQuiz = { ...dbFortuneQuiz, is_active: true }
      console.log('[QUIZZES] fortune 퀴즈 DB에서 조회 (slug=fortune):', fortuneQuiz.total_participants)
    } else {
      // DB에 없으면 목록에서 찾기
      fortuneQuiz = fortuneQuizzes.find((q: any) => q.slug === 'fortune')
    }
    
    // 기존 fortune 퀴즈들 제거 (중복 방지)
    quizzesList = quizzesList.filter((q: any) => 
      q.slug !== 'fortune'
    )
    
    // fortune 퀴즈가 있으면 추가, 없으면 기본 데이터 추가
    if (fortuneQuiz) {
      quizzesList = [...quizzesList, fortuneQuiz]
    } else {
      // DB에 없으면 기본 데이터 추가 (id는 UUID로 자동 생성됨)
      quizzesList = [...quizzesList, {
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
      }]
    }

    if (quizzesError) {
      console.log('[QUIZZES] 퀴즈 조회 실패:', quizzesError);
      return NextResponse.json(
        { 
          error: '퀴즈를 조회할 수 없습니다.',
          details: quizzesError.message
        },
        { status: 500 }
      );
    }

    console.log('[QUIZZES] 퀴즈 조회 성공, 개수:', quizzesList.length);

    // 각 퀴즈의 완성 여부 확인 (질문이 있으면 완성된 것으로 간주)
    const quizzesWithCompletionStatus = await Promise.all(
      quizzesList.map(async (quiz: any) => {
        // 특별 구현된 퀴즈들 (별도 페이지로 구현됨, DB 질문 불필요)
        const specialQuizzes = ['korean-level', 'zodiac', 'fortune', 'mbti-kpop', 'idol-position']
        
        if (specialQuizzes.includes(quiz.slug || '')) {
          return {
            ...quiz,
            isCompleted: true,
            participantCount: quiz.total_participants || 0
          }
        }
        
        // 일반 퀴즈는 DB에 질문이 있어야 완성됨
        const { data: questions } = await supabase
          .from('quiz_questions')
          .select('id')
          .eq('quiz_id', quiz.id)
          .limit(1)
        
        return {
          ...quiz,
          isCompleted: (questions && questions.length > 0),
          participantCount: quiz.total_participants || 0
        }
      })
    )

    return NextResponse.json({
      success: true,
      data: quizzesWithCompletionStatus
    });

  } catch (error) {
    console.error('[QUIZZES] 예상치 못한 오류:', error);
    
    return NextResponse.json(
      { 
        error: '서버 오류가 발생했습니다.', 
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    console.log('[QUIZZES] 퀴즈 생성 API 호출 시작');
    
    if (!supabaseClient) {
      console.log('[QUIZZES] Supabase 클라이언트 없음');
      return NextResponse.json(
        { error: '데이터베이스 연결이 설정되지 않았습니다.' },
        { status: 500 }
      );
    }
    
    const supabase = supabaseClient;
    
    // Authorization 헤더에서 토큰 추출
    const authHeader = request.headers.get('authorization');
    console.log('[QUIZZES] Authorization 헤더:', authHeader ? '있음' : '없음');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.log('[QUIZZES] 인증 헤더 없음');
      return NextResponse.json(
        { error: '인증이 필요합니다.' },
        { status: 401 }
      );
    }

    const token = authHeader.replace('Bearer ', '');
    const decodedToken = decodeURIComponent(token);
    console.log('[QUIZZES] 토큰 디코딩 완료');
    
    // 토큰으로 사용자 정보 가져오기
    console.log('[QUIZZES] 사용자 인증 시작');
    const { data: { user }, error: authError } = await supabase.auth.getUser(decodedToken);
    
    if (authError || !user) {
      console.log('[QUIZZES] 사용자 인증 실패:', authError);
      return NextResponse.json(
        { error: '인증이 필요합니다.' },
        { status: 401 }
      );
    }

    console.log('[QUIZZES] 사용자 인증 성공:', user.id);

    // 관리자 권한 확인
    const { data: userInfo, error: profileError } = await supabase
      .from('users')
      .select('is_admin')
      .eq('id', user.id)
      .single();

    if (profileError || !userInfo?.is_admin) {
      console.log('[QUIZZES] 관리자 권한 없음');
      return NextResponse.json(
        { error: '관리자 권한이 필요합니다.' },
        { status: 403 }
      );
    }

    // 요청 본문에서 퀴즈 데이터 가져오기
    const body = await request.json();
    const { title, description, category, thumbnail_url } = body;
    
    console.log('[QUIZZES] 퀴즈 생성 데이터:', { title, category });

    // 퀴즈 생성
    const { data: quiz, error: createError } = await supabase
      .from('quizzes')
      .insert({
        title,
        description,
        category,
        thumbnail_url,
        created_by: user.id
      })
      .select()
      .single();

    if (createError) {
      console.log('[QUIZZES] 퀴즈 생성 실패:', createError);
      return NextResponse.json(
        { 
          error: '퀴즈를 생성할 수 없습니다.',
          details: createError.message
        },
        { status: 500 }
      );
    }

    console.log('[QUIZZES] 퀴즈 생성 성공:', quiz.id);

    return NextResponse.json({
      success: true,
      data: quiz
    });

  } catch (error) {
    console.error('[QUIZZES] 예상치 못한 오류:', error);
    
    return NextResponse.json(
      { 
        error: '서버 오류가 발생했습니다.', 
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}