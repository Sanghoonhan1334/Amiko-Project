import { NextRequest, NextResponse } from 'next/server';
import { supabaseClient } from '@/lib/supabaseServer';

export async function GET(request: NextRequest) {
  try {
    console.log('[CHECK_ADMIN] API 호출 시작');
    
    if (!supabaseClient) {
      console.log('[CHECK_ADMIN] Supabase 클라이언트 없음');
      return NextResponse.json(
        { error: '데이터베이스 연결이 설정되지 않았습니다.' },
        { status: 500 }
      );
    }
    
    const supabase = supabaseClient;
    
    // Authorization 헤더에서 토큰 추출
    const authHeader = request.headers.get('authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { isAdmin: false, error: '인증이 필요합니다.' },
        { status: 401 }
      );
    }

    const token = authHeader.replace('Bearer ', '');
    const decodedToken = decodeURIComponent(token);
    
    // 토큰으로 사용자 정보 가져오기
    const { data: { user }, error: authError } = await supabase.auth.getUser(decodedToken);
    
    if (authError || !user) {
      return NextResponse.json(
        { isAdmin: false, error: '인증에 실패했습니다.' },
        { status: 401 }
      );
    }

    // 관리자 권한 확인
    const { data: userInfo, error: profileError } = await supabase
      .from('users')
      .select('is_admin')
      .eq('id', user.id)
      .single();

    if (profileError) {
      console.log('[CHECK_ADMIN] 사용자 정보 조회 실패:', profileError);
      return NextResponse.json(
        { isAdmin: false, error: '사용자 정보를 조회할 수 없다.' },
        { status: 500 }
      );
    }

    const isAdmin = userInfo?.is_admin || false;
    console.log('[CHECK_ADMIN] 관리자 권한 확인 완료:', { userId: user.id, isAdmin });

    return NextResponse.json({
      isAdmin,
      userId: user.id
    });

  } catch (error) {
    console.error('[CHECK_ADMIN] 예상치 못한 오류:', error);
    
    return NextResponse.json(
      { 
        isAdmin: false,
        error: '서버 오류가 발생했습니다.', 
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}
