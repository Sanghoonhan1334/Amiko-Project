import { NextRequest, NextResponse } from 'next/server';
import { supabaseClient } from '@/lib/supabaseServer';

export async function GET(request: NextRequest) {
  try {
    console.log('[COUPON_ATTENDANCE_CHECK] API 호출 시작');
    
    if (!supabaseClient) {
      console.log('[COUPON_ATTENDANCE_CHECK] Supabase 클라이언트 없음');
      return NextResponse.json(
        { error: '데이터베이스 연결이 설정되지 않았습니다.' },
        { status: 500 }
      );
    }
    
    const supabase = supabaseClient;
    
    // Authorization 헤더에서 토큰 추출
    const authHeader = request.headers.get('authorization');
    console.log('[COUPON_ATTENDANCE_CHECK] Authorization 헤더:', authHeader ? '있음' : '없음');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.log('[COUPON_ATTENDANCE_CHECK] 인증 헤더 없음');
      return NextResponse.json(
        { error: '인증이 필요합니다.' },
        { status: 401 }
      );
    }

    const token = authHeader.replace('Bearer ', '');
    const decodedToken = decodeURIComponent(token);
    console.log('[COUPON_ATTENDANCE_CHECK] 토큰 디코딩 완료');
    
    // 토큰으로 사용자 정보 가져오기
    console.log('[COUPON_ATTENDANCE_CHECK] 사용자 인증 시작');
    const { data: { user }, error: authError } = await supabase.auth.getUser(decodedToken);
    
    if (authError || !user) {
      console.log('[COUPON_ATTENDANCE_CHECK] 사용자 인증 실패:', authError);
      return NextResponse.json(
        { error: '인증이 필요합니다.' },
        { status: 401 }
      );
    }

    console.log('[COUPON_ATTENDANCE_CHECK] 사용자 인증 성공:', user.id);

    // URL 파라미터에서 날짜 가져오기 (선택적)
    const { searchParams } = new URL(request.url);
    const checkDate = searchParams.get('date') || new Date().toISOString().split('T')[0];
    
    console.log('[COUPON_ATTENDANCE_CHECK] 확인 날짜:', checkDate);

    // 출석체크 상태 확인
    const { data: attendanceInfo, error: attendanceError } = await supabase
      .rpc('check_coupon_attendance', {
        user_uuid: user.id,
        check_date: checkDate
      });

    if (attendanceError) {
      console.log('[COUPON_ATTENDANCE_CHECK] 출석체크 상태 확인 실패:', attendanceError);
      return NextResponse.json(
        { 
          error: '출석체크 상태를 확인할 수 없습니다.',
          details: attendanceError.message
        },
        { status: 500 }
      );
    }

    console.log('[COUPON_ATTENDANCE_CHECK] 출석체크 상태 확인 성공:', attendanceInfo);

    return NextResponse.json({
      success: true,
      data: attendanceInfo
    });

  } catch (error) {
    console.error('[COUPON_ATTENDANCE_CHECK] 예상치 못한 오류:', error);
    
    return NextResponse.json(
      { 
        error: '서버 오류가 발생했습니다.', 
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}
