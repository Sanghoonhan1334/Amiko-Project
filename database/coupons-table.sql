-- =====================================================
-- 쿠폰 테이블 (Coupons Table)
-- Description: AKO 쿠폰을 관리하는 테이블
-- Date: 2024-12-19
-- =====================================================

-- 1. 쿠폰 테이블 (Coupons Table)
CREATE TABLE IF NOT EXISTS public.coupons (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    type TEXT NOT NULL CHECK (type IN ('video_call', 'consultation', 'ako')),
    amount INTEGER NOT NULL, -- 쿠폰 개수 (AKO 단위)
    used_amount INTEGER DEFAULT 0, -- 사용된 쿠폰 개수
    expires_at TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN DEFAULT TRUE,
    source TEXT DEFAULT 'purchase' CHECK (source IN ('purchase', 'gift', 'promotion', 'admin', 'event')),
    description TEXT, -- 쿠폰 설명
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. 쿠폰 사용 히스토리 테이블
CREATE TABLE IF NOT EXISTS public.coupon_usage (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    coupon_id UUID REFERENCES public.coupons(id) ON DELETE CASCADE,
    booking_id UUID REFERENCES public.bookings(id) ON DELETE SET NULL,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    amount_used INTEGER NOT NULL, -- 사용된 쿠폰 개수
    used_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_coupons_user_id ON public.coupons(user_id);
CREATE INDEX IF NOT EXISTS idx_coupons_type ON public.coupons(type);
CREATE INDEX IF NOT EXISTS idx_coupons_is_active ON public.coupons(is_active);
CREATE INDEX IF NOT EXISTS idx_coupons_expires_at ON public.coupons(expires_at);
CREATE INDEX IF NOT EXISTS idx_coupons_source ON public.coupons(source);
CREATE INDEX IF NOT EXISTS idx_coupons_created_at ON public.coupons(created_at DESC);

-- 복합 인덱스
CREATE INDEX IF NOT EXISTS idx_coupons_user_active ON public.coupons(user_id, is_active);
CREATE INDEX IF NOT EXISTS idx_coupons_user_type ON public.coupons(user_id, type);

-- 쿠폰 사용 히스토리 인덱스
CREATE INDEX IF NOT EXISTS idx_coupon_usage_coupon_id ON public.coupon_usage(coupon_id);
CREATE INDEX IF NOT EXISTS idx_coupon_usage_user_id ON public.coupon_usage(user_id);
CREATE INDEX IF NOT EXISTS idx_coupon_usage_booking_id ON public.coupon_usage(booking_id);
CREATE INDEX IF NOT EXISTS idx_coupon_usage_used_at ON public.coupon_usage(used_at DESC);

-- 4. RLS 활성화
ALTER TABLE public.coupons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coupon_usage ENABLE ROW LEVEL SECURITY;

-- 5. RLS 정책 생성
-- 사용자는 자신의 쿠폰만 볼 수 있음
CREATE POLICY "Users can view own coupons" ON public.coupons
    FOR SELECT USING (auth.uid() = user_id);

-- 사용자는 자신의 쿠폰을 업데이트할 수 있음 (사용량 등)
CREATE POLICY "Users can update own coupons" ON public.coupons
    FOR UPDATE USING (auth.uid() = user_id);

-- 시스템은 모든 사용자에게 쿠폰을 생성할 수 있음
CREATE POLICY "System can create coupons" ON public.coupons
    FOR INSERT WITH CHECK (true);

-- 관리자는 모든 쿠폰을 관리할 수 있음
CREATE POLICY "Admins can manage all coupons" ON public.coupons
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE public.users.id = auth.uid() 
            AND public.users.is_admin = true
        )
    );

-- 쿠폰 사용 히스토리 정책
CREATE POLICY "Users can view own coupon usage" ON public.coupon_usage
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "System can create coupon usage" ON public.coupon_usage
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Admins can manage all coupon usage" ON public.coupon_usage
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE public.users.id = auth.uid() 
            AND public.users.is_admin = true
        )
    );

-- 6. 쿠폰 사용 함수
CREATE OR REPLACE FUNCTION use_coupon(
    coupon_uuid UUID,
    booking_uuid UUID,
    amount_to_use INTEGER,
    user_uuid UUID DEFAULT NULL
)
RETURNS BOOLEAN AS $$
DECLARE
    coupon_record RECORD;
    remaining_amount INTEGER;
BEGIN
    -- 사용자 ID가 제공되지 않은 경우 현재 인증된 사용자 사용
    IF user_uuid IS NULL THEN
        user_uuid := auth.uid();
    END IF;
    
    -- 쿠폰 정보 조회
    SELECT * INTO coupon_record
    FROM public.coupons
    WHERE id = coupon_uuid 
        AND user_id = user_uuid 
        AND is_active = true;
    
    -- 쿠폰이 존재하지 않거나 비활성화된 경우
    IF NOT FOUND THEN
        RAISE EXCEPTION '사용할 수 있는 쿠폰을 찾을 수 없습니다.';
    END IF;
    
    -- 쿠폰이 만료된 경우
    IF coupon_record.expires_at IS NOT NULL AND coupon_record.expires_at < NOW() THEN
        RAISE EXCEPTION '쿠폰이 만료되었습니다.';
    END IF;
    
    -- 사용 가능한 쿠폰 개수 계산
    remaining_amount := coupon_record.amount - coupon_record.used_amount;
    
    -- 사용하려는 개수가 사용 가능한 개수보다 많은 경우
    IF amount_to_use > remaining_amount THEN
        RAISE EXCEPTION '사용 가능한 쿠폰 개수가 부족합니다.';
    END IF;
    
    -- 쿠폰 사용량 업데이트
    UPDATE public.coupons
    SET used_amount = used_amount + amount_to_use
    WHERE id = coupon_uuid;
    
    -- 쿠폰 사용 히스토리 기록
    INSERT INTO public.coupon_usage (
        coupon_id,
        booking_id,
        user_id,
        amount_used
    ) VALUES (
        coupon_uuid,
        booking_uuid,
        user_uuid,
        amount_to_use
    );
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 7. 쿠폰 생성 함수
CREATE OR REPLACE FUNCTION create_coupon(
    target_user_id UUID,
    coupon_type TEXT,
    coupon_amount INTEGER,
    coupon_expires_at TIMESTAMP WITH TIME ZONE DEFAULT NULL,
    coupon_source TEXT DEFAULT 'admin',
    coupon_description TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
    coupon_id UUID;
BEGIN
    -- 쿠폰 생성
    INSERT INTO public.coupons (
        user_id,
        type,
        amount,
        expires_at,
        source,
        description
    ) VALUES (
        target_user_id,
        coupon_type,
        coupon_amount,
        coupon_expires_at,
        coupon_source,
        coupon_description
    ) RETURNING id INTO coupon_id;
    
    -- 사용자에게 쿠폰 수신 알림
    INSERT INTO public.notifications (
        user_id,
        type,
        title,
        content,
        data,
        priority
    ) VALUES (
        target_user_id,
        'coupon_received',
        '새로운 쿠폰을 받았습니다!',
        coupon_amount || '개의 ' || coupon_type || ' 쿠폰이 추가되었습니다.',
        jsonb_build_object(
            'coupon_id', coupon_id,
            'amount', coupon_amount,
            'type', coupon_type,
            'expires_at', coupon_expires_at
        ),
        'normal'
    );
    
    RETURN coupon_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 8. 사용 가능한 쿠폰 조회 함수
CREATE OR REPLACE FUNCTION get_available_coupons(
    user_uuid UUID DEFAULT NULL,
    coupon_type TEXT DEFAULT NULL
)
RETURNS TABLE (
    id UUID,
    type TEXT,
    amount INTEGER,
    used_amount INTEGER,
    remaining_amount INTEGER,
    expires_at TIMESTAMP WITH TIME ZONE,
    source TEXT,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
    -- 사용자 ID가 제공되지 않은 경우 현재 인증된 사용자 사용
    IF user_uuid IS NULL THEN
        user_uuid := auth.uid();
    END IF;
    
    RETURN QUERY
    SELECT 
        c.id,
        c.type,
        c.amount,
        c.used_amount,
        (c.amount - c.used_amount) as remaining_amount,
        c.expires_at,
        c.source,
        c.description,
        c.created_at
    FROM public.coupons c
    WHERE c.user_id = user_uuid
        AND c.is_active = true
        AND (c.expires_at IS NULL OR c.expires_at > NOW())
        AND (coupon_type IS NULL OR c.type = coupon_type)
        AND (c.amount - c.used_amount) > 0
    ORDER BY c.expires_at ASC NULLS LAST, c.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 9. 쿠폰 통계 조회 함수
CREATE OR REPLACE FUNCTION get_coupon_stats(
    user_uuid UUID DEFAULT NULL,
    start_date TIMESTAMP WITH TIME ZONE DEFAULT NULL,
    end_date TIMESTAMP WITH TIME ZONE DEFAULT NULL
)
RETURNS TABLE (
    total_coupons BIGINT,
    active_coupons BIGINT,
    expired_coupons BIGINT,
    total_amount BIGINT,
    used_amount BIGINT,
    remaining_amount BIGINT,
    coupons_by_type JSONB,
    coupons_by_source JSONB
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COUNT(*) as total_coupons,
        COUNT(*) FILTER (WHERE is_active = true AND (expires_at IS NULL OR expires_at > NOW())) as active_coupons,
        COUNT(*) FILTER (WHERE expires_at IS NOT NULL AND expires_at <= NOW()) as expired_coupons,
        SUM(amount) as total_amount,
        SUM(used_amount) as used_amount,
        SUM(amount - used_amount) as remaining_amount,
        jsonb_object_agg(type, type_count) as coupons_by_type,
        jsonb_object_agg(source, source_count) as coupons_by_source
    FROM (
        SELECT 
            type,
            source,
            COUNT(*) as type_count,
            COUNT(*) as source_count
        FROM public.coupons
        WHERE (user_uuid IS NULL OR user_id = user_uuid)
            AND (start_date IS NULL OR created_at >= start_date)
            AND (end_date IS NULL OR created_at <= end_date)
        GROUP BY type, source
    ) stats;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 10. 만료된 쿠폰 정리 함수
CREATE OR REPLACE FUNCTION cleanup_expired_coupons()
RETURNS INTEGER AS $$
DECLARE
    updated_count INTEGER;
BEGIN
    -- 만료된 쿠폰을 비활성화
    UPDATE public.coupons
    SET is_active = false
    WHERE expires_at IS NOT NULL 
        AND expires_at < NOW()
        AND is_active = true;
    
    GET DIAGNOSTICS updated_count = ROW_COUNT;
    RETURN updated_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 11. 쿠폰 사용 가능 여부 확인 함수
CREATE OR REPLACE FUNCTION can_use_coupon(
    coupon_uuid UUID,
    amount_to_use INTEGER,
    user_uuid UUID DEFAULT NULL
)
RETURNS BOOLEAN AS $$
DECLARE
    coupon_record RECORD;
    remaining_amount INTEGER;
BEGIN
    -- 사용자 ID가 제공되지 않은 경우 현재 인증된 사용자 사용
    IF user_uuid IS NULL THEN
        user_uuid := auth.uid();
    END IF;
    
    -- 쿠폰 정보 조회
    SELECT * INTO coupon_record
    FROM public.coupons
    WHERE id = coupon_uuid 
        AND user_id = user_uuid 
        AND is_active = true;
    
    -- 쿠폰이 존재하지 않는 경우
    IF NOT FOUND THEN
        RETURN FALSE;
    END IF;
    
    -- 쿠폰이 만료된 경우
    IF coupon_record.expires_at IS NOT NULL AND coupon_record.expires_at < NOW() THEN
        RETURN FALSE;
    END IF;
    
    -- 사용 가능한 쿠폰 개수 계산
    remaining_amount := coupon_record.amount - coupon_record.used_amount;
    
    -- 사용하려는 개수가 사용 가능한 개수보다 많은 경우
    IF amount_to_use > remaining_amount THEN
        RETURN FALSE;
    END IF;
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 12. 쿠폰 생성 시 알림 트리거
CREATE OR REPLACE FUNCTION notify_coupon_created()
RETURNS TRIGGER AS $$
BEGIN
    -- 사용자에게 쿠폰 수신 알림
    INSERT INTO public.notifications (
        user_id,
        type,
        title,
        content,
        data,
        priority
    ) VALUES (
        NEW.user_id,
        'coupon_received',
        '새로운 쿠폰을 받았습니다!',
        NEW.amount || '개의 ' || NEW.type || ' 쿠폰이 추가되었습니다.',
        jsonb_build_object(
            'coupon_id', NEW.id,
            'amount', NEW.amount,
            'type', NEW.type,
            'expires_at', NEW.expires_at
        ),
        'normal'
    );
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 쿠폰 생성 트리거 적용
CREATE TRIGGER coupon_created_trigger
    AFTER INSERT ON public.coupons
    FOR EACH ROW 
    EXECUTE FUNCTION notify_coupon_created();

-- 13. 샘플 데이터 (테스트용)
-- INSERT INTO public.coupons (
--     user_id,
--     type,
--     amount,
--     expires_at,
--     source,
--     description
-- ) VALUES 
-- (
--     '00000000-0000-0000-0000-000000000001',
--     'ako',
--     5,
--     NOW() + INTERVAL '30 days',
--     'promotion',
--     '신규 가입 축하 쿠폰'
-- );

-- =====================================================
-- 추가 설명
-- =====================================================

/*
쿠폰 테이블 필드 설명:

1. id: 쿠폰 고유 ID (UUID)
2. user_id: 사용자 테이블 참조 (CASCADE 삭제)
3. type: 쿠폰 타입 (video_call, consultation, ako)
4. amount: 쿠폰 개수 (AKO 단위)
5. used_amount: 사용된 쿠폰 개수 (기본값: 0)
6. expires_at: 만료 시간 (선택적)
7. is_active: 활성화 상태 (기본값: TRUE)
8. source: 쿠폰 출처 (purchase, gift, promotion, admin, event)
9. description: 쿠폰 설명
10. created_at: 생성 시간

쿠폰 사용 히스토리 테이블 필드 설명:

1. id: 사용 기록 고유 ID (UUID)
2. coupon_id: 쿠폰 테이블 참조 (CASCADE 삭제)
3. booking_id: 예약 테이블 참조 (SET NULL 삭제)
4. user_id: 사용자 테이블 참조 (CASCADE 삭제)
5. amount_used: 사용된 쿠폰 개수
6. used_at: 사용 시간

RLS 정책:
- 사용자는 자신의 쿠폰만 조회/수정 가능
- 시스템은 모든 사용자에게 쿠폰 생성 가능
- 관리자는 모든 쿠폰 관리 가능

함수:
- use_coupon(): 쿠폰 사용 처리
- create_coupon(): 쿠폰 생성
- get_available_coupons(): 사용 가능한 쿠폰 조회
- get_coupon_stats(): 쿠폰 통계 조회
- cleanup_expired_coupons(): 만료된 쿠폰 정리
- can_use_coupon(): 쿠폰 사용 가능 여부 확인

트리거:
- 쿠폰 생성 시 사용자에게 알림 전송

AKO 시스템:
- amount: AKO 단위로 설정
- type: 'ako' 타입 추가
- 예약과 연동하여 AKO 쿠폰 사용 처리

쿠폰 타입:
- video_call: 영상통화 쿠폰
- consultation: 상담 쿠폰
- ako: 일반 AKO 쿠폰

쿠폰 출처:
- purchase: 구매
- gift: 선물
- promotion: 프로모션
- admin: 관리자 지급
- event: 이벤트
*/
