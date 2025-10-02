import { NextRequest, NextResponse } from 'next/server';
import { supabaseClient } from '@/lib/supabaseServer';

export async function GET(request: NextRequest) {
  try {
    console.log('[CELEBRITIES] API 호출 시작');
    
    if (!supabaseClient) {
      console.log('[CELEBRITIES] Supabase 클라이언트 없음');
      return NextResponse.json(
        { error: '데이터베이스 연결이 설정되지 않았습니다.' },
        { status: 500 }
      );
    }
    
    const supabase = supabaseClient;
    
    // URL 파라미터에서 MBTI 타입 가져오기
    const { searchParams } = new URL(request.url);
    const mbtiType = searchParams.get('mbti');
    const limit = parseInt(searchParams.get('limit') || '10');
    
    console.log('[CELEBRITIES] MBTI 타입:', mbtiType);

    // 연예인 정보 조회
    let query = supabase
      .from('celeb_profiles')
      .select('*')
      .order('stage_name');

    if (mbtiType) {
      query = query.eq('mbti_code', mbtiType);
    }

    query = query.limit(limit);

    const { data: celebrities, error: celebritiesError } = await query;

    if (celebritiesError) {
      console.log('[CELEBRITIES] 연예인 조회 실패:', celebritiesError);
      return NextResponse.json(
        { 
          error: '연예인 정보를 조회할 수 없습니다.',
          details: celebritiesError.message
        },
        { status: 500 }
      );
    }

    console.log('[CELEBRITIES] 연예인 조회 성공, 개수:', celebrities?.length || 0);

    return NextResponse.json({
      success: true,
      data: celebrities || []
    });

  } catch (error) {
    console.error('[CELEBRITIES] 예상치 못한 오류:', error);
    
    return NextResponse.json(
      { 
        error: '서버 오류가 발생했습니다.', 
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}
