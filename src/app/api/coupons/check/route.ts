import { NextRequest, NextResponse } from 'next/server';
import { supabaseClient } from '@/lib/supabaseServer';

export async function GET(request: NextRequest) {
  try {
    console.log('[COUPONS_CHECK] API 호출 시작')
    console.log('[COUPONS_CHECK] 환경변수 확인:', {
      url: process.env.NEXT_PUBLIC_SUPABASE_URL ? '있음' : '없음',
      anonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? '있음' : '없음'
    })
    
    if (!supabaseClient) {
      console.log('[COUPONS_CHECK] Supabase 클라이언트 없음')
      return NextResponse.json(
        { error: '데이터베이스 연결이 설정되지 않았습니다.' },
        { status: 500 }
      );
    }
    const supabase = supabaseClient;
    
    // Authorization 헤더에서 토큰 추출
    const authHeader = request.headers.get('authorization')
    console.log('[COUPONS_CHECK] Authorization 헤더:', authHeader ? '있음' : '없음')
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.log('[COUPONS_CHECK] 인증 헤더 없음')
      return NextResponse.json(
        { error: '인증이 필요합니다.' },
        { status: 401 }
      );
    }

    const token = authHeader.replace('Bearer ', '')
    const decodedToken = decodeURIComponent(token)
    console.log('[COUPONS_CHECK] 토큰 디코딩 완료')
    
    // 토큰으로 사용자 정보 가져오기
    console.log('[COUPONS_CHECK] 사용자 인증 시작')
    const { data: { user }, error: authError } = await supabase.auth.getUser(decodedToken);
    
    if (authError || !user) {
      console.log('[COUPONS_CHECK] 사용자 인증 실패:', authError)
      return NextResponse.json(
        { error: '인증이 필요합니다.' },
        { status: 401 }
      );
    }

    console.log('[COUPONS_CHECK] 사용자 인증 성공:', user.id)

    // 사용자 프로필 정보 가져오기
    const { data: userInfo, error: profileError } = await supabase
      .from('users')
      .select('language, is_admin')
      .eq('id', user.id)
      .single();

    if (profileError) {
      return NextResponse.json(
        { error: '사용자 정보를 가져올 수 없습니다.' },
        { status: 500 }
      );
    }

    // 프로필이 완성된 사용자는 쿠폰 없이도 채팅 가능
    const { data: userProfile, error: userProfileError } = await supabase
      .from('user_preferences')
      .select('full_name, phone, university, major, interests')
      .eq('user_id', user.id)
      .single()

    // 프로필 조회 실패 시 기본값으로 처리
    const isProfileComplete = userProfile && !userProfileError && (
      userProfile.full_name || 
      userProfile.phone || 
      userProfile.university || 
      userProfile.major ||
      (userProfile.interests && userProfile.interests.length > 0)
    )

    if (isProfileComplete) {
      return NextResponse.json({
        canCall: true,
        hasCoupon: true,
        totalMinutes: 0,
        availableCoupons: 0,
        userType: 'verified',
        message: '프로필이 완성된 사용자는 쿠폰 없이도 채팅가 가능합니다.'
      });
    }

    // 한국 사용자도 인증이 완료되면 쿠폰 없이 채팅 가능
    if ((userInfo as any).language === 'ko') {
      return NextResponse.json({
        canCall: true,
        hasCoupon: true,
        totalMinutes: 0,
        availableCoupons: 0,
        userType: 'korean',
        message: '한국 사용자는 쿠폰 없이도 채팅가 가능합니다.'
      });
    }

    // 글로벌 사용자는 쿠폰 필요
    const { data: coupons, error: couponsError } = await supabase
      .from('coupons')
      .select('minutes_remaining, amount, used_amount, expires_at')
      .eq('user_id', user.id)
      .eq('is_active', true)
      .gt('minutes_remaining', 0);

    if (couponsError) {
      console.log('[COUPONS_CHECK] 쿠폰 조회 실패, 기본값 반환:', couponsError)
      // 쿠폰 조회 실패 시 기본값으로 처리
      return NextResponse.json({
        canCall: false,
        hasCoupon: false,
        totalMinutes: 0,
        availableCoupons: 0,
        userType: (userInfo as any).language === 'ko' ? 'korean' : 'global',
        isVip: false,
        message: '쿠폰 정보를 확인할 수 없습니다.'
      });
    }

    // 쿠폰 사용 가능 여부 계산
    const totalMinutes = coupons?.reduce((sum: number, coupon: any) => {
      if (!coupon.expires_at || new Date(coupon.expires_at) > new Date()) {
        return sum + coupon.minutes_remaining;
      }
      return sum;
    }, 0) || 0;

    const availableCoupons = coupons?.reduce((sum: number, coupon: any) => {
      if (!coupon.expires_at || new Date(coupon.expires_at) > new Date()) {
        return sum + (coupon.amount - coupon.used_amount);
      }
      return sum;
    }, 0) || 0;

    const hasCoupon = totalMinutes >= 20; // 최소 20분 필요
    const canCall = hasCoupon;

    // VIP 상태 확인
    const { data: vipSubscription } = await supabase
      .from('vip_subscriptions')
      .select('status, end_date, features')
      .eq('user_id', user.id)
      .eq('status', 'active')
      .single();

    const isVip = vipSubscription && 
      (!(vipSubscription as any).end_date || new Date((vipSubscription as any).end_date) > new Date());

    return NextResponse.json({
      canCall,
      hasCoupon,
      totalMinutes,
      availableCoupons,
      userType: (userInfo as any).language === 'ko' ? 'korean' : 'global',
      isVip,
      vipFeatures: isVip ? (vipSubscription as any).features : null,
      message: canCall 
        ? (isVip ? 'VIP 사용자로 채팅가 가능합니다.' : '쿠폰이 있어 채팅가 가능합니다.')
        : '쿠폰을 구매해야 채팅가 가능합니다.'
    });

  } catch (error) {
    console.error('[COUPONS_CHECK] 예상치 못한 오류:', error);
    console.error('[COUPONS_CHECK] 오류 스택:', error instanceof Error ? error.stack : 'No stack trace');
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
