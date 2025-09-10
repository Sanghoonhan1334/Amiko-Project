import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabaseServer';

export async function POST(request: NextRequest) {
  try {
    const { duration = 20, consultantId, topic } = await request.json();
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

    // 한국 사용자는 쿠폰 차감 없이 통화 시작
    if (profile.language === 'ko') {
      // 예약 생성 (한국 사용자용)
      const { data: booking, error: bookingError } = await supabase
        .from('bookings')
        .insert({
          user_id: user.id,
          consultant_id: consultantId,
          order_id: `booking-${Date.now()}`,
          topic: topic || '상담',
          start_at: new Date().toISOString(),
          end_at: new Date(Date.now() + duration * 60 * 1000).toISOString(),
          duration: duration,
          price: 0, // 한국 사용자는 무료
          currency: 'KRW',
          status: 'confirmed'
        })
        .select()
        .single();

      if (bookingError) {
        return NextResponse.json(
          { error: '예약 생성에 실패했습니다.' },
          { status: 500 }
        );
      }

      return NextResponse.json({
        success: true,
        bookingId: booking.id,
        message: '한국 사용자로 무료 통화가 시작됩니다.',
        features: {
          beautyFilter: true,
          communityBadge: true,
          adRemoval: true,
          simultaneousInterpretation: true,
          prioritySupport: true,
          unlimitedBookings: true,
          advancedAnalytics: true
        },
        userType: 'korean'
      });
    }

    // 글로벌 사용자는 쿠폰 필요
    const { data: coupons, error: couponsError } = await supabase
      .from('coupons')
      .select('id, minutes_remaining, amount, used_amount, expires_at')
      .eq('user_id', user.id)
      .eq('is_active', true)
      .gt('minutes_remaining', 0)
      .order('created_at', { ascending: true });

    if (couponsError) {
      return NextResponse.json(
        { error: '쿠폰 정보를 가져올 수 없습니다.' },
        { status: 500 }
      );
    }

    // 사용 가능한 쿠폰 필터링
    const availableCoupons = coupons?.filter(coupon => 
      !coupon.expires_at || new Date(coupon.expires_at) > new Date()
    ) || [];

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

    // 예약 생성
    const { data: booking, error: bookingError } = await supabase
      .from('bookings')
      .insert({
        user_id: user.id,
        consultant_id: consultantId,
        order_id: `booking-${Date.now()}`,
        topic: topic || '상담',
        start_at: new Date().toISOString(),
        end_at: new Date(Date.now() + duration * 60 * 1000).toISOString(),
        duration: duration,
        price: (duration / 20) * 1.99, // 20분 = 1.99달러
        currency: 'AKO',
        status: 'confirmed'
      })
      .select()
      .single();

    if (bookingError) {
      return NextResponse.json(
        { error: '예약 생성에 실패했습니다.' },
        { status: 500 }
      );
    }

    // 쿠폰 사용 기록 생성
    const { error: usageError } = await supabase
      .from('coupon_usage')
      .insert({
        user_id: user.id,
        duration_minutes: duration,
        used_coupons: usedCoupons,
        booking_id: booking.id
      });

    if (usageError) {
      console.error('사용 기록 생성 실패:', usageError);
    }

    // VIP 상태 확인
    const { data: vipSubscription } = await supabase
      .from('vip_subscriptions')
      .select('status, end_date, features, plan_type')
      .eq('user_id', user.id)
      .eq('status', 'active')
      .single();

    const isVip = vipSubscription && 
      (!vipSubscription.end_date || new Date(vipSubscription.end_date) > new Date());

    // 기본 기능
    const baseFeatures = {
      videoCall: true,
      chatTranslation: true,
      basicSupport: true
    };

    // VIP 기능
    const vipFeatures = {
      beautyFilter: false,
      communityBadge: false,
      adRemoval: false,
      simultaneousInterpretation: false,
      prioritySupport: false,
      unlimitedBookings: false,
      advancedAnalytics: false
    };

    // VIP 사용자 기능 적용
    if (isVip && vipSubscription.features) {
      const vipFeaturesData = vipSubscription.features;
      
      vipFeatures.beautyFilter = vipFeaturesData.beauty_filter === true;
      vipFeatures.communityBadge = vipFeaturesData.community_badge === true;
      vipFeatures.adRemoval = vipFeaturesData.ad_removal === true;
      vipFeatures.simultaneousInterpretation = vipFeaturesData.simultaneous_interpretation === true;
      vipFeatures.prioritySupport = vipFeaturesData.priority_support === true;
      vipFeatures.unlimitedBookings = vipFeaturesData.unlimited_bookings === true;
      vipFeatures.advancedAnalytics = vipFeaturesData.advanced_analytics === true;
    }

    return NextResponse.json({
      success: true,
      bookingId: booking.id,
      message: isVip 
        ? 'VIP 사용자로 프리미엄 기능과 함께 통화가 시작됩니다.'
        : '일반 사용자로 기본 기능과 함께 통화가 시작됩니다.',
      features: {
        ...baseFeatures,
        ...vipFeatures
      },
      userType: 'global',
      isVip,
      vipPlan: isVip ? vipSubscription.plan_type : null,
      usedMinutes: duration,
      remainingMinutes: totalAvailableMinutes - duration,
      usedCoupons
    });

  } catch (error) {
    console.error('영상통화 시작 실패:', error);
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
