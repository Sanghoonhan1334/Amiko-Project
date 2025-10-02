import { NextRequest, NextResponse } from 'next/server';
import { supabaseClient } from '@/lib/supabaseServer';

export async function POST(request: NextRequest) {
  try {
    console.log('[COUPON_ATTENDANCE_EXECUTE] API 호출 시작');
    
    if (!supabaseClient) {
      console.log('[COUPON_ATTENDANCE_EXECUTE] Supabase 클라이언트 없음');
      return NextResponse.json(
        { error: '데이터베이스 연결이 설정되지 않았습니다.' },
        { status: 500 }
      );
    }
    
    const supabase = supabaseClient;
    
    // Authorization 헤더에서 토큰 추출
    const authHeader = request.headers.get('authorization');
    console.log('[COUPON_ATTENDANCE_EXECUTE] Authorization 헤더:', authHeader ? '있음' : '없음');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.log('[COUPON_ATTENDANCE_EXECUTE] 인증 헤더 없음');
      return NextResponse.json(
        { error: '인증이 필요합니다.' },
        { status: 401 }
      );
    }

    const token = authHeader.replace('Bearer ', '');
    const decodedToken = decodeURIComponent(token);
    console.log('[COUPON_ATTENDANCE_EXECUTE] 토큰 디코딩 완료');
    
    // 토큰으로 사용자 정보 가져오기
    console.log('[COUPON_ATTENDANCE_EXECUTE] 사용자 인증 시작');
    const { data: { user }, error: authError } = await supabase.auth.getUser(decodedToken);
    
    if (authError || !user) {
      console.log('[COUPON_ATTENDANCE_EXECUTE] 사용자 인증 실패:', authError);
      return NextResponse.json(
        { error: '인증이 필요합니다.' },
        { status: 401 }
      );
    }

    console.log('[COUPON_ATTENDANCE_EXECUTE] 사용자 인증 성공:', user.id);

    // 요청 본문에서 날짜 가져오기 (선택적)
    const body = await request.json().catch(() => ({}));
    const checkDate = body.date || new Date().toISOString().split('T')[0];
    
    console.log('[COUPON_ATTENDANCE_EXECUTE] 출석체크 날짜:', checkDate);

    // 출석체크 실행
    const { data: result, error: executeError } = await supabase
      .rpc('execute_coupon_attendance', {
        user_uuid: user.id,
        check_date: checkDate
      });

    if (executeError) {
      console.log('[COUPON_ATTENDANCE_EXECUTE] 출석체크 실행 실패:', executeError);
      return NextResponse.json(
        { 
          error: '출석체크를 실행할 수 없습니다.',
          details: executeError.message
        },
        { status: 500 }
      );
    }

    console.log('[COUPON_ATTENDANCE_EXECUTE] 출석체크 실행 성공:', result);

    // 3일 연속 완료 시 쿠폰 지급
    if (result.isCompleted && result.currentStreak >= 3) {
      console.log('[COUPON_ATTENDANCE_EXECUTE] 3일 연속 완료, 쿠폰 지급 시작');
      
      try {
        // 쿠폰 지급 (20분 쿠폰 1개)
        const { error: couponError } = await supabase
          .from('coupons')
          .insert({
            user_id: user.id,
            type: 'ako',
            amount: 1,
            minutes_remaining: 20,
            source: 'event',
            description: '3일 연속 출석체크 완료 보상',
            expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() // 30일 후 만료
          });

        if (couponError) {
          console.log('[COUPON_ATTENDANCE_EXECUTE] 쿠폰 지급 실패:', couponError);
          // 쿠폰 지급 실패해도 출석체크는 성공으로 처리
        } else {
          console.log('[COUPON_ATTENDANCE_EXECUTE] 쿠폰 지급 성공');
          result.couponGranted = true;
          result.couponMessage = '3일 연속 출석체크 완료! 20분 쿠폰이 지급되었습니다.';
        }
      } catch (couponError) {
        console.log('[COUPON_ATTENDANCE_EXECUTE] 쿠폰 지급 중 오류:', couponError);
        // 쿠폰 지급 실패해도 출석체크는 성공으로 처리
      }
    }

    return NextResponse.json({
      success: true,
      data: result
    });

  } catch (error) {
    console.error('[COUPON_ATTENDANCE_EXECUTE] 예상치 못한 오류:', error);
    
    return NextResponse.json(
      { 
        error: '서버 오류가 발생했습니다.', 
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}
