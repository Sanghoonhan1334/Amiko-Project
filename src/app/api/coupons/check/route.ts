import { NextRequest, NextResponse } from 'next/server';
import { supabaseClient } from '@/lib/supabaseServer';

export async function GET(request: NextRequest) {
  try {
    if (!supabaseClient) {
      return NextResponse.json(
        { error: '데이터베이스 연결이 설정되지 않았습니다.' },
        { status: 500 }
      );
    }
    const supabase = supabaseClient;
    
    // 현재 사용자 정보 가져오기
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json(
        { error: '인증이 필요합니다.' },
        { status: 401 }
      );
    }

    // 사용자 프로필 정보 가져오기
    const { data: profile, error: profileError } = await supabase
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

    // 한국 사용자는 쿠폰 없이도 채팅 가능
    if ((profile as any).language === 'ko') {
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
      return NextResponse.json(
        { error: '쿠폰 정보를 가져올 수 없습니다.' },
        { status: 500 }
      );
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
      userType: (profile as any).language === 'ko' ? 'korean' : 'global',
      isVip,
      vipFeatures: isVip ? (vipSubscription as any).features : null,
      message: canCall 
        ? (isVip ? 'VIP 사용자로 채팅가 가능합니다.' : '쿠폰이 있어 채팅가 가능합니다.')
        : '쿠폰을 구매해야 채팅가 가능합니다.'
    });

  } catch (error) {
    console.error('쿠폰 확인 실패:', error);
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
