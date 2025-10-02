import { NextRequest, NextResponse } from 'next/server';
import { supabaseClient } from '@/lib/supabaseServer';

export async function GET(request: NextRequest) {
  try {
    console.log('[COUPON_ATTENDANCE_HISTORY] API 호출 시작');
    
    if (!supabaseClient) {
      console.log('[COUPON_ATTENDANCE_HISTORY] Supabase 클라이언트 없음');
      return NextResponse.json(
        { error: '데이터베이스 연결이 설정되지 않았습니다.' },
        { status: 500 }
      );
    }
    
    const supabase = supabaseClient;
    
    // Authorization 헤더에서 토큰 추출
    const authHeader = request.headers.get('authorization');
    console.log('[COUPON_ATTENDANCE_HISTORY] Authorization 헤더:', authHeader ? '있음' : '없음');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.log('[COUPON_ATTENDANCE_HISTORY] 인증 헤더 없음');
      return NextResponse.json(
        { error: '인증이 필요합니다.' },
        { status: 401 }
      );
    }

    const token = authHeader.replace('Bearer ', '');
    const decodedToken = decodeURIComponent(token);
    console.log('[COUPON_ATTENDANCE_HISTORY] 토큰 디코딩 완료');
    
    // 토큰으로 사용자 정보 가져오기
    console.log('[COUPON_ATTENDANCE_HISTORY] 사용자 인증 시작');
    const { data: { user }, error: authError } = await supabase.auth.getUser(decodedToken);
    
    if (authError || !user) {
      console.log('[COUPON_ATTENDANCE_HISTORY] 사용자 인증 실패:', authError);
      return NextResponse.json(
        { error: '인증이 필요합니다.' },
        { status: 401 }
      );
    }

    console.log('[COUPON_ATTENDANCE_HISTORY] 사용자 인증 성공:', user.id);

    // URL 파라미터에서 제한 개수 가져오기 (기본값: 30)
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '30');
    
    console.log('[COUPON_ATTENDANCE_HISTORY] 조회 제한:', limit);

    // 출석체크 히스토리 조회
    const { data: history, error: historyError } = await supabase
      .rpc('get_coupon_attendance_history', {
        user_uuid: user.id,
        limit_count: limit
      });

    if (historyError) {
      console.log('[COUPON_ATTENDANCE_HISTORY] 히스토리 조회 실패:', historyError);
      return NextResponse.json(
        { 
          error: '출석체크 히스토리를 조회할 수 없습니다.',
          details: historyError.message
        },
        { status: 500 }
      );
    }

    console.log('[COUPON_ATTENDANCE_HISTORY] 히스토리 조회 성공, 기록 수:', history?.length || 0);

    return NextResponse.json({
      success: true,
      data: history || []
    });

  } catch (error) {
    console.error('[COUPON_ATTENDANCE_HISTORY] 예상치 못한 오류:', error);
    
    return NextResponse.json(
      { 
        error: '서버 오류가 발생했습니다.', 
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}
