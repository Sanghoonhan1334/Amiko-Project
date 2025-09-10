-- =====================================================
-- VIP구독 테이블 (VIP Subscriptions Table)
-- Description: VIP 구독 서비스를 관리하는 테이블
-- Date: 2024-12-19
-- =====================================================

-- 1. VIP 구독 테이블 (VIP Subscriptions Table)
CREATE TABLE IF NOT EXISTS public.vip_subscriptions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    plan_type TEXT NOT NULL CHECK (plan_type IN ('monthly', 'yearly', 'lifetime')),
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'cancelled', 'expired', 'suspended')),
    start_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    end_date TIMESTAMP WITH TIME ZONE,
    auto_renew BOOLEAN DEFAULT TRUE,
    payment_method TEXT CHECK (payment_method IN ('paypal', 'stripe', 'coupon', 'admin')),
    price NUMERIC(10, 2) NOT NULL, -- AKO 단위 또는 USD
    currency TEXT DEFAULT 'USD',
    features JSONB DEFAULT '{}', -- VIP 기능들
    cancellation_reason TEXT,
    cancelled_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. VIP 기능 테이블 (VIP Features Table)
CREATE TABLE IF NOT EXISTS public.vip_features (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    feature_key TEXT UNIQUE NOT NULL,
    feature_name TEXT NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. VIP 구독 히스토리 테이블 (VIP Subscription History)
CREATE TABLE IF NOT EXISTS public.vip_subscription_history (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    subscription_id UUID REFERENCES public.vip_subscriptions(id) ON DELETE CASCADE,
    action TEXT NOT NULL CHECK (action IN ('created', 'activated', 'cancelled', 'renewed', 'expired', 'suspended', 'reactivated')),
    old_status TEXT,
    new_status TEXT NOT NULL,
    reason TEXT,
    performed_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_vip_subscriptions_user_id ON public.vip_subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_vip_subscriptions_plan_type ON public.vip_subscriptions(plan_type);
CREATE INDEX IF NOT EXISTS idx_vip_subscriptions_status ON public.vip_subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_vip_subscriptions_start_date ON public.vip_subscriptions(start_date);
CREATE INDEX IF NOT EXISTS idx_vip_subscriptions_end_date ON public.vip_subscriptions(end_date);
CREATE INDEX IF NOT EXISTS idx_vip_subscriptions_auto_renew ON public.vip_subscriptions(auto_renew);
CREATE INDEX IF NOT EXISTS idx_vip_subscriptions_created_at ON public.vip_subscriptions(created_at DESC);

-- 복합 인덱스
CREATE INDEX IF NOT EXISTS idx_vip_subscriptions_user_status ON public.vip_subscriptions(user_id, status);
CREATE INDEX IF NOT EXISTS idx_vip_subscriptions_active ON public.vip_subscriptions(user_id, status, end_date) 
WHERE status = 'active';

-- VIP 기능 테이블 인덱스
CREATE INDEX IF NOT EXISTS idx_vip_features_feature_key ON public.vip_features(feature_key);
CREATE INDEX IF NOT EXISTS idx_vip_features_is_active ON public.vip_features(is_active);

-- VIP 구독 히스토리 인덱스
CREATE INDEX IF NOT EXISTS idx_vip_subscription_history_subscription_id ON public.vip_subscription_history(subscription_id);
CREATE INDEX IF NOT EXISTS idx_vip_subscription_history_action ON public.vip_subscription_history(action);
CREATE INDEX IF NOT EXISTS idx_vip_subscription_history_created_at ON public.vip_subscription_history(created_at DESC);

-- JSONB 인덱스
CREATE INDEX IF NOT EXISTS idx_vip_subscriptions_features ON public.vip_subscriptions USING GIN(features);

-- 5. RLS 활성화
ALTER TABLE public.vip_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vip_features ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vip_subscription_history ENABLE ROW LEVEL SECURITY;

-- 6. RLS 정책 생성
-- 사용자는 자신의 VIP 구독만 볼 수 있음
CREATE POLICY "Users can view own vip subscriptions" ON public.vip_subscriptions
    FOR SELECT USING (auth.uid() = user_id);

-- 사용자는 자신의 VIP 구독을 업데이트할 수 있음 (취소 등)
CREATE POLICY "Users can update own vip subscriptions" ON public.vip_subscriptions
    FOR UPDATE USING (auth.uid() = user_id);

-- 시스템은 모든 사용자에게 VIP 구독을 생성할 수 있음
CREATE POLICY "System can create vip subscriptions" ON public.vip_subscriptions
    FOR INSERT WITH CHECK (true);

-- 관리자는 모든 VIP 구독을 관리할 수 있음
CREATE POLICY "Admins can manage all vip subscriptions" ON public.vip_subscriptions
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE public.users.id = auth.uid() 
            AND public.users.is_admin = true
        )
    );

-- VIP 기능 정책 (모든 사용자가 조회 가능)
CREATE POLICY "Anyone can view vip features" ON public.vip_features
    FOR SELECT USING (is_active = true);

CREATE POLICY "Admins can manage vip features" ON public.vip_features
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE public.users.id = auth.uid() 
            AND public.users.is_admin = true
        )
    );

-- VIP 구독 히스토리 정책
CREATE POLICY "Users can view own vip history" ON public.vip_subscription_history
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.vip_subscriptions 
            WHERE public.vip_subscriptions.id = public.vip_subscription_history.subscription_id 
            AND public.vip_subscriptions.user_id = auth.uid()
        )
    );

CREATE POLICY "System can create vip history" ON public.vip_subscription_history
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Admins can manage all vip history" ON public.vip_subscription_history
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE public.users.id = auth.uid() 
            AND public.users.is_admin = true
        )
    );

-- 7. 업데이트 시간 자동 갱신 트리거 적용
CREATE TRIGGER update_vip_subscriptions_updated_at 
    BEFORE UPDATE ON public.vip_subscriptions
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- 8. VIP 구독 생성 함수
CREATE OR REPLACE FUNCTION create_vip_subscription(
    target_user_id UUID,
    subscription_plan TEXT,
    subscription_price NUMERIC,
    subscription_currency TEXT DEFAULT 'USD',
    subscription_duration_months INTEGER DEFAULT 1,
    subscription_features JSONB DEFAULT '{}',
    subscription_payment_method TEXT DEFAULT 'paypal'
)
RETURNS UUID AS $$
DECLARE
    subscription_id UUID;
    end_date TIMESTAMP WITH TIME ZONE;
BEGIN
    -- 종료 날짜 계산
    IF subscription_plan = 'lifetime' THEN
        end_date := NULL;
    ELSE
        end_date := NOW() + INTERVAL '1 month' * subscription_duration_months;
    END IF;
    
    -- VIP 구독 생성
    INSERT INTO public.vip_subscriptions (
        user_id,
        plan_type,
        price,
        currency,
        end_date,
        features,
        payment_method
    ) VALUES (
        target_user_id,
        subscription_plan,
        subscription_price,
        subscription_currency,
        end_date,
        subscription_features,
        subscription_payment_method
    ) RETURNING id INTO subscription_id;
    
    -- 히스토리 기록
    INSERT INTO public.vip_subscription_history (
        subscription_id,
        action,
        new_status,
        reason,
        performed_by
    ) VALUES (
        subscription_id,
        'created',
        'active',
        'VIP 구독 생성',
        auth.uid()
    );
    
    -- 사용자에게 알림
    INSERT INTO public.notifications (
        user_id,
        type,
        title,
        content,
        data,
        priority
    ) VALUES (
        target_user_id,
        'vip_subscription',
        'VIP 구독이 활성화되었습니다!',
        'VIP 서비스를 이용하실 수 있습니다.',
        jsonb_build_object(
            'subscription_id', subscription_id,
            'plan_type', subscription_plan,
            'end_date', end_date
        ),
        'high'
    );
    
    RETURN subscription_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 9. VIP 구독 취소 함수
CREATE OR REPLACE FUNCTION cancel_vip_subscription(
    subscription_uuid UUID,
    cancellation_reason TEXT DEFAULT NULL,
    user_uuid UUID DEFAULT NULL
)
RETURNS BOOLEAN AS $$
DECLARE
    subscription_record RECORD;
BEGIN
    -- 사용자 ID가 제공되지 않은 경우 현재 인증된 사용자 사용
    IF user_uuid IS NULL THEN
        user_uuid := auth.uid();
    END IF;
    
    -- 구독 정보 조회
    SELECT * INTO subscription_record
    FROM public.vip_subscriptions
    WHERE id = subscription_uuid 
        AND user_id = user_uuid 
        AND status = 'active';
    
    -- 구독이 존재하지 않는 경우
    IF NOT FOUND THEN
        RAISE EXCEPTION '활성화된 VIP 구독을 찾을 수 없습니다.';
    END IF;
    
    -- 구독 취소
    UPDATE public.vip_subscriptions
    SET 
        status = 'cancelled',
        cancellation_reason = cancellation_reason,
        cancelled_at = NOW(),
        auto_renew = FALSE,
        updated_at = NOW()
    WHERE id = subscription_uuid;
    
    -- 히스토리 기록
    INSERT INTO public.vip_subscription_history (
        subscription_id,
        action,
        old_status,
        new_status,
        reason,
        performed_by
    ) VALUES (
        subscription_uuid,
        'cancelled',
        'active',
        'cancelled',
        cancellation_reason,
        user_uuid
    );
    
    -- 사용자에게 알림
    INSERT INTO public.notifications (
        user_id,
        type,
        title,
        content,
        data,
        priority
    ) VALUES (
        user_uuid,
        'vip_subscription',
        'VIP 구독이 취소되었습니다',
        'VIP 서비스 이용이 중단됩니다.',
        jsonb_build_object(
            'subscription_id', subscription_uuid,
            'cancellation_reason', cancellation_reason
        ),
        'normal'
    );
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 10. VIP 구독 갱신 함수
CREATE OR REPLACE FUNCTION renew_vip_subscription(
    subscription_uuid UUID,
    renewal_months INTEGER DEFAULT 1
)
RETURNS BOOLEAN AS $$
DECLARE
    subscription_record RECORD;
    new_end_date TIMESTAMP WITH TIME ZONE;
BEGIN
    -- 구독 정보 조회
    SELECT * INTO subscription_record
    FROM public.vip_subscriptions
    WHERE id = subscription_uuid;
    
    -- 구독이 존재하지 않는 경우
    IF NOT FOUND THEN
        RAISE EXCEPTION 'VIP 구독을 찾을 수 없습니다.';
    END IF;
    
    -- 새로운 종료 날짜 계산
    IF subscription_record.plan_type = 'lifetime' THEN
        new_end_date := NULL;
    ELSE
        new_end_date := COALESCE(subscription_record.end_date, NOW()) + INTERVAL '1 month' * renewal_months;
    END IF;
    
    -- 구독 갱신
    UPDATE public.vip_subscriptions
    SET 
        end_date = new_end_date,
        status = 'active',
        updated_at = NOW()
    WHERE id = subscription_uuid;
    
    -- 히스토리 기록
    INSERT INTO public.vip_subscription_history (
        subscription_id,
        action,
        old_status,
        new_status,
        reason,
        performed_by
    ) VALUES (
        subscription_uuid,
        'renewed',
        subscription_record.status,
        'active',
        'VIP 구독 갱신',
        auth.uid()
    );
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 11. VIP 상태 확인 함수
CREATE OR REPLACE FUNCTION check_vip_status(user_uuid UUID DEFAULT NULL)
RETURNS TABLE (
    is_vip BOOLEAN,
    subscription_id UUID,
    plan_type TEXT,
    end_date TIMESTAMP WITH TIME ZONE,
    days_remaining INTEGER,
    features JSONB
) AS $$
BEGIN
    -- 사용자 ID가 제공되지 않은 경우 현재 인증된 사용자 사용
    IF user_uuid IS NULL THEN
        user_uuid := auth.uid();
    END IF;
    
    RETURN QUERY
    SELECT 
        CASE 
            WHEN vs.id IS NOT NULL AND vs.status = 'active' 
                AND (vs.end_date IS NULL OR vs.end_date > NOW()) 
            THEN true 
            ELSE false 
        END as is_vip,
        vs.id as subscription_id,
        vs.plan_type,
        vs.end_date,
        CASE 
            WHEN vs.end_date IS NULL THEN NULL
            ELSE EXTRACT(DAYS FROM vs.end_date - NOW())::INTEGER
        END as days_remaining,
        vs.features
    FROM public.vip_subscriptions vs
    WHERE vs.user_id = user_uuid
        AND vs.status = 'active'
    ORDER BY vs.created_at DESC
    LIMIT 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 12. 만료된 VIP 구독 정리 함수
CREATE OR REPLACE FUNCTION cleanup_expired_vip_subscriptions()
RETURNS INTEGER AS $$
DECLARE
    updated_count INTEGER;
BEGIN
    -- 만료된 구독을 비활성화
    UPDATE public.vip_subscriptions
    SET 
        status = 'expired',
        updated_at = NOW()
    WHERE status = 'active'
        AND end_date IS NOT NULL 
        AND end_date < NOW();
    
    GET DIAGNOSTICS updated_count = ROW_COUNT;
    
    -- 만료 히스토리 기록
    INSERT INTO public.vip_subscription_history (
        subscription_id,
        action,
        old_status,
        new_status,
        reason
    )
    SELECT 
        id,
        'expired',
        'active',
        'expired',
        '자동 만료'
    FROM public.vip_subscriptions
    WHERE status = 'expired'
        AND updated_at > NOW() - INTERVAL '1 minute';
    
    RETURN updated_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 13. VIP 기능 기본 데이터 삽입
INSERT INTO public.vip_features (feature_key, feature_name, description) VALUES
('beauty_filter', '뷰티 필터', '영상 통화 시 실시간 얼굴 보정'),
('community_badge', '커뮤니티 뱃지', '프리미엄 멤버 표시'),
('ad_removal', '광고 제거', '앱 내 배너와 팝업 광고 제거'),
('simultaneous_interpretation', '동시통역 기능', '자막/음성 지원으로 빠른 소통'),
('priority_support', '우선 지원', '고객 지원 우선 처리'),
('unlimited_bookings', '무제한 예약', '예약 횟수 제한 없음'),
('advanced_analytics', '고급 분석', '상세한 사용 통계 제공')
ON CONFLICT (feature_key) DO NOTHING;

-- 14. 샘플 데이터 (테스트용)
-- INSERT INTO public.vip_subscriptions (
--     user_id,
--     plan_type,
--     price,
--     currency,
--     end_date,
--     features,
--     payment_method
-- ) VALUES 
-- (
--     '00000000-0000-0000-0000-000000000001',
--     'monthly',
--     9.99,
--     'USD',
--     NOW() + INTERVAL '1 month',
--     '{"beauty_filter": true, "community_badge": true, "ad_removal": true}'::jsonb,
--     'paypal'
-- );

-- =====================================================
-- 추가 설명
-- =====================================================

/*
VIP 구독 테이블 필드 설명:

1. id: 구독 고유 ID (UUID)
2. user_id: 사용자 테이블 참조 (CASCADE 삭제)
3. plan_type: 구독 플랜 (monthly, yearly, lifetime)
4. status: 구독 상태 (active, cancelled, expired, suspended)
5. start_date: 구독 시작 날짜
6. end_date: 구독 종료 날짜 (lifetime은 NULL)
7. auto_renew: 자동 갱신 여부
8. payment_method: 결제 방법 (paypal, stripe, coupon, admin)
9. price: 가격 (AKO 단위 또는 USD)
10. currency: 통화 단위 (기본값: USD)
11. features: VIP 기능들 (JSONB)
12. cancellation_reason: 취소 사유
13. cancelled_at: 취소 시간
14. created_at: 생성 시간
15. updated_at: 수정 시간

VIP 기능 테이블 필드 설명:

1. id: 기능 고유 ID (UUID)
2. feature_key: 기능 키 (고유값)
3. feature_name: 기능 이름
4. description: 기능 설명
5. is_active: 활성화 상태
6. created_at: 생성 시간

VIP 구독 히스토리 테이블 필드 설명:

1. id: 히스토리 고유 ID (UUID)
2. subscription_id: 구독 테이블 참조 (CASCADE 삭제)
3. action: 수행된 액션 (created, activated, cancelled, renewed, expired, suspended, reactivated)
4. old_status: 이전 상태
5. new_status: 새 상태
6. reason: 사유
7. performed_by: 수행자 (사용자 테이블 참조)
8. created_at: 생성 시간

RLS 정책:
- 사용자는 자신의 VIP 구독만 조회/수정 가능
- 시스템은 모든 사용자에게 VIP 구독 생성 가능
- 관리자는 모든 VIP 구독 관리 가능
- VIP 기능은 모든 사용자 조회 가능

함수:
- create_vip_subscription(): VIP 구독 생성
- cancel_vip_subscription(): VIP 구독 취소
- renew_vip_subscription(): VIP 구독 갱신
- check_vip_status(): VIP 상태 확인
- cleanup_expired_vip_subscriptions(): 만료된 구독 정리

트리거:
- 구독 상태 변경 시 히스토리 자동 기록
- 업데이트 시간 자동 갱신

VIP 기능:
- 뷰티 필터: 영상 통화 시 실시간 얼굴 보정
- 커뮤니티 뱃지: 프리미엄 멤버 표시
- 광고 제거: 앱 내 배너와 팝업 광고 제거
- 동시통역 기능: 자막/음성 지원으로 빠른 소통
- 우선 지원: 고객 지원 우선 처리
- 무제한 예약: 예약 횟수 제한 없음
- 고급 분석: 상세한 사용 통계 제공

구독 플랜:
- monthly: 월간 구독
- yearly: 연간 구독
- lifetime: 평생 구독
*/
