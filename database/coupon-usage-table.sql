-- =====================================================
-- 쿠폰 사용 기록 테이블 (Coupon Usage Table)
-- Description: 쿠폰 사용 기록을 저장하는 테이블
-- Date: 2024-12-19
-- =====================================================

-- 1. 쿠폰 사용 기록 테이블 (Coupon Usage Table)
CREATE TABLE IF NOT EXISTS public.coupon_usage (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    duration_minutes INTEGER NOT NULL, -- 사용한 분수
    used_coupons JSONB NOT NULL, -- 사용된 쿠폰 정보
    booking_id UUID REFERENCES public.bookings(id) ON DELETE SET NULL, -- 관련 예약 (선택적)
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_coupon_usage_user_id ON public.coupon_usage(user_id);
CREATE INDEX IF NOT EXISTS idx_coupon_usage_booking_id ON public.coupon_usage(booking_id);
CREATE INDEX IF NOT EXISTS idx_coupon_usage_created_at ON public.coupon_usage(created_at DESC);

-- 복합 인덱스
CREATE INDEX IF NOT EXISTS idx_coupon_usage_user_created ON public.coupon_usage(user_id, created_at DESC);

-- JSONB 인덱스
CREATE INDEX IF NOT EXISTS idx_coupon_usage_used_coupons ON public.coupon_usage USING GIN(used_coupons);

-- 3. RLS 활성화
ALTER TABLE public.coupon_usage ENABLE ROW LEVEL SECURITY;

-- 4. RLS 정책 생성
-- 사용자는 자신의 쿠폰 사용 기록만 볼 수 있음
CREATE POLICY "Users can view own coupon usage" ON public.coupon_usage
    FOR SELECT USING (auth.uid() = user_id);

-- 시스템은 쿠폰 사용 기록을 생성할 수 있음
CREATE POLICY "System can create coupon usage" ON public.coupon_usage
    FOR INSERT WITH CHECK (true);

-- 관리자는 모든 쿠폰 사용 기록을 관리할 수 있음
CREATE POLICY "Admins can manage all coupon usage" ON public.coupon_usage
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE public.users.id = auth.uid() 
            AND public.users.is_admin = true
        )
    );

-- 5. 쿠폰 사용 통계 함수
CREATE OR REPLACE FUNCTION get_coupon_usage_stats(user_uuid UUID DEFAULT NULL)
RETURNS TABLE (
    total_usage_minutes INTEGER,
    total_usage_count INTEGER,
    last_usage_date TIMESTAMP WITH TIME ZONE,
    this_month_usage_minutes INTEGER,
    this_month_usage_count INTEGER
) AS $$
BEGIN
    -- 사용자 ID가 제공되지 않은 경우 현재 인증된 사용자 사용
    IF user_uuid IS NULL THEN
        user_uuid := auth.uid();
    END IF;
    
    RETURN QUERY
    SELECT 
        COALESCE(SUM(cu.duration_minutes), 0)::INTEGER as total_usage_minutes,
        COUNT(cu.id)::INTEGER as total_usage_count,
        MAX(cu.created_at) as last_usage_date,
        COALESCE(SUM(CASE 
            WHEN cu.created_at >= date_trunc('month', CURRENT_DATE) 
            THEN cu.duration_minutes 
            ELSE 0 
        END), 0)::INTEGER as this_month_usage_minutes,
        COUNT(CASE 
            WHEN cu.created_at >= date_trunc('month', CURRENT_DATE) 
            THEN cu.id 
        END)::INTEGER as this_month_usage_count
    FROM public.coupon_usage cu
    WHERE cu.user_id = user_uuid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. 쿠폰 사용 가능 여부 확인 함수 (개선된 버전)
CREATE OR REPLACE FUNCTION check_coupon_availability_detailed(user_uuid UUID DEFAULT NULL)
RETURNS TABLE (
    has_coupon BOOLEAN,
    total_minutes INTEGER,
    available_coupons INTEGER,
    can_call_20min BOOLEAN,
    can_call_40min BOOLEAN,
    can_call_60min BOOLEAN,
    is_korean_user BOOLEAN,
    is_vip_user BOOLEAN
) AS $$
DECLARE
    user_language TEXT;
    vip_status BOOLEAN;
BEGIN
    -- 사용자 ID가 제공되지 않은 경우 현재 인증된 사용자 사용
    IF user_uuid IS NULL THEN
        user_uuid := auth.uid();
    END IF;
    
    -- 사용자 언어 확인
    SELECT language INTO user_language
    FROM public.users
    WHERE id = user_uuid;
    
    -- VIP 상태 확인
    SELECT EXISTS(
        SELECT 1 FROM public.vip_subscriptions 
        WHERE user_id = user_uuid 
        AND status = 'active'
        AND (end_date IS NULL OR end_date > NOW())
    ) INTO vip_status;
    
    -- 한국 사용자는 쿠폰 없이도 통화 가능
    IF user_language = 'ko' THEN
        RETURN QUERY SELECT 
            true as has_coupon,
            0 as total_minutes,
            0 as available_coupons,
            true as can_call_20min,
            true as can_call_40min,
            true as can_call_60min,
            true as is_korean_user,
            vip_status as is_vip_user;
        RETURN;
    END IF;
    
    -- 글로벌 사용자는 쿠폰 필요
    RETURN QUERY
    SELECT 
        CASE 
            WHEN COALESCE(SUM(c.minutes_remaining), 0) > 0 THEN true 
            ELSE false 
        END as has_coupon,
        COALESCE(SUM(c.minutes_remaining), 0)::INTEGER as total_minutes,
        COALESCE(SUM(c.amount - c.used_amount), 0)::INTEGER as available_coupons,
        COALESCE(SUM(c.minutes_remaining), 0) >= 20 as can_call_20min,
        COALESCE(SUM(c.minutes_remaining), 0) >= 40 as can_call_40min,
        COALESCE(SUM(c.minutes_remaining), 0) >= 60 as can_call_60min,
        false as is_korean_user,
        vip_status as is_vip_user
    FROM public.coupons c
    WHERE c.user_id = user_uuid
        AND c.is_active = true
        AND (c.expires_at IS NULL OR c.expires_at > NOW());
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 추가 설명
-- =====================================================

/*
쿠폰 사용 기록 테이블 필드 설명:

1. id: 사용 기록 고유 ID (UUID)
2. user_id: 사용자 테이블 참조 (CASCADE 삭제)
3. duration_minutes: 사용한 분수
4. used_coupons: 사용된 쿠폰 정보 (JSONB)
5. booking_id: 관련 예약 (선택적)
6. created_at: 사용 시간

함수:
- get_coupon_usage_stats(): 쿠폰 사용 통계 조회
- check_coupon_availability_detailed(): 상세한 쿠폰 사용 가능 여부 확인

RLS 정책:
- 사용자는 자신의 쿠폰 사용 기록만 조회 가능
- 시스템은 쿠폰 사용 기록 생성 가능
- 관리자는 모든 쿠폰 사용 기록 관리 가능

쿠폰 사용 규칙:
- 한국 사용자: 쿠폰 없이도 통화 가능
- 글로벌 사용자: 쿠폰이 있어야 통화 가능
- VIP 사용자: 쿠폰 + VIP 기능 확장
- 최소 20분 단위로 사용
*/
