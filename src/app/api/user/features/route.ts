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

    // VIP 상태 확인
    const { data: vipSubscription } = await supabase
      .from('vip_subscriptions')
      .select('status, end_date, features, plan_type')
      .eq('user_id', user.id)
      .eq('status', 'active')
      .single();

    const isVip = vipSubscription && 
      (!(vipSubscription as any).end_date || new Date((vipSubscription as any).end_date) > new Date());

    // 쿠폰 사용 가능 여부 확인
    const { data: coupons } = await supabase
      .from('coupons')
      .select('minutes_remaining, amount, used_amount, expires_at')
      .eq('user_id', user.id)
      .eq('is_active', true)
      .gt('minutes_remaining', 0);

    const totalMinutes = coupons?.reduce((sum: number, coupon: any) => {
      if (!coupon.expires_at || new Date(coupon.expires_at) > new Date()) {
        return sum + coupon.minutes_remaining;
      }
      return sum;
    }, 0) || 0;

    const hasCoupon = totalMinutes >= 20;

    // 기본 기능 (모든 사용자)
    const baseFeatures = {
      videoCall: true,
      chatTranslation: true, // 채팅 번역은 모든 사용자에게 제공
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

    // 한국 사용자 특별 처리
    if ((profile as any).language === 'ko') {
      return NextResponse.json({
        userType: 'korean',
        canCall: true,
        hasCoupon: true,
        isVip: false,
        features: {
          ...baseFeatures,
          // 한국 사용자는 VIP 없이도 모든 기능 사용 가능
          beautyFilter: true,
          communityBadge: true,
          adRemoval: true,
          simultaneousInterpretation: true,
          prioritySupport: true,
          unlimitedBookings: true,
          advancedAnalytics: true
        },
        message: '한국 사용자는 모든 기능을 무료로 이용할 수 있습니다.'
      });
    }

    // 글로벌 사용자 처리
    if (!hasCoupon) {
      return NextResponse.json({
        userType: 'global',
        canCall: false,
        hasCoupon: false,
        isVip: false,
        features: baseFeatures,
        message: '쿠폰을 구매해야 영상통화가 가능합니다.'
      });
    }

    // VIP 사용자 기능 적용
    if (isVip && (vipSubscription as any).features) {
      const vipFeaturesData = (vipSubscription as any).features;
      
      vipFeatures.beautyFilter = vipFeaturesData.beauty_filter === true;
      vipFeatures.communityBadge = vipFeaturesData.community_badge === true;
      vipFeatures.adRemoval = vipFeaturesData.ad_removal === true;
      vipFeatures.simultaneousInterpretation = vipFeaturesData.simultaneous_interpretation === true;
      vipFeatures.prioritySupport = vipFeaturesData.priority_support === true;
      vipFeatures.unlimitedBookings = vipFeaturesData.unlimited_bookings === true;
      vipFeatures.advancedAnalytics = vipFeaturesData.advanced_analytics === true;
    }

    return NextResponse.json({
      userType: 'global',
      canCall: true,
      hasCoupon: true,
      isVip,
      totalMinutes,
      vipPlan: isVip ? (vipSubscription as any).plan_type : null,
      features: {
        ...baseFeatures,
        ...vipFeatures
      },
      message: isVip 
        ? 'VIP 사용자로 모든 프리미엄 기능을 이용할 수 있습니다.'
        : '일반 사용자로 기본 기능을 이용할 수 있습니다.'
    });

  } catch (error) {
    console.error('사용자 기능 확인 실패:', error);
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
