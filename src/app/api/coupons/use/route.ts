import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabaseServer';

export async function POST(request: NextRequest) {
  try {
    const { duration = 20 } = await request.json(); // 기본 20분
    const supabase = createClient();
    
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

    // 한국 사용자는 쿠폰 차감 없이 통화 가능
    if (profile.language === 'ko') {
      return NextResponse.json({
        success: true,
        message: '한국 사용자는 쿠폰 차감 없이 통화가 가능합니다.',
        remainingMinutes: 0,
        usedMinutes: 0
      });
    }

    // 글로벌 사용자는 쿠폰 필요
    const { data: coupons, error: couponsError } = await supabase
      .from('coupons')
      .select('id, minutes_remaining, amount, used_amount, expires_at')
      .eq('user_id', user.id)
      .eq('is_active', true)
      .gt('minutes_remaining', 0)
      .order('created_at', { ascending: true }); // 오래된 쿠폰부터 사용

    if (couponsError) {
      return NextResponse.json(
        { error: '쿠폰 정보를 가져올 수 없습니다.' },
        { status: 500 }
      );
    }

    // 사용 가능한 쿠폰 필터링 (만료되지 않은 것만)
    const availableCoupons = coupons?.filter(coupon => 
      !coupon.expires_at || new Date(coupon.expires_at) > new Date()
    ) || [];

    // 총 사용 가능한 분수 계산
    const totalAvailableMinutes = availableCoupons.reduce(
      (sum, coupon) => sum + coupon.minutes_remaining, 
      0
    );

    if (totalAvailableMinutes < duration) {
      return NextResponse.json(
        { 
          error: '쿠폰이 부족합니다.',
          requiredMinutes: duration,
          availableMinutes: totalAvailableMinutes
        },
        { status: 400 }
      );
    }

    // 쿠폰 사용 처리
    let remainingDuration = duration;
    const usedCoupons = [];

    for (const coupon of availableCoupons) {
      if (remainingDuration <= 0) break;

      const useFromThisCoupon = Math.min(remainingDuration, coupon.minutes_remaining);
      
      // 쿠폰 사용량 업데이트
      const { error: updateError } = await supabase
        .from('coupons')
        .update({
          minutes_remaining: coupon.minutes_remaining - useFromThisCoupon,
          used_amount: coupon.used_amount + Math.ceil(useFromThisCoupon / 20)
        })
        .eq('id', coupon.id);

      if (updateError) {
        console.error('쿠폰 사용 실패:', updateError);
        continue;
      }

      usedCoupons.push({
        couponId: coupon.id,
        usedMinutes: useFromThisCoupon
      });

      remainingDuration -= useFromThisCoupon;
    }

    // 사용 기록 생성
    const { error: usageError } = await supabase
      .from('coupon_usage')
      .insert({
        user_id: user.id,
        duration_minutes: duration,
        used_coupons: usedCoupons,
        created_at: new Date().toISOString()
      });

    if (usageError) {
      console.error('사용 기록 생성 실패:', usageError);
    }

    // VIP 상태 확인
    const { data: vipSubscription } = await supabase
      .from('vip_subscriptions')
      .select('status, end_date, features')
      .eq('user_id', user.id)
      .eq('status', 'active')
      .single();

    const isVip = vipSubscription && 
      (!vipSubscription.end_date || new Date(vipSubscription.end_date) > new Date());

    return NextResponse.json({
      success: true,
      message: '쿠폰이 성공적으로 사용되었습니다.',
      usedMinutes: duration,
      remainingMinutes: totalAvailableMinutes - duration,
      isVip,
      vipFeatures: isVip ? vipSubscription.features : null,
      usedCoupons
    });

  } catch (error) {
    console.error('쿠폰 사용 실패:', error);
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
