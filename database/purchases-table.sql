-- =====================================================
-- 구매 기록 테이블 (Purchases Table)
-- Description: PayPal 결제 기록을 저장하는 테이블
-- Date: 2024-12-19
-- =====================================================

-- 1. 구매 기록 테이블 (Purchases Table)
CREATE TABLE IF NOT EXISTS public.purchases (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    provider TEXT NOT NULL CHECK (provider IN ('paypal', 'toss', 'stripe')),
    payment_id TEXT UNIQUE NOT NULL, -- PayPal Order ID
    order_id TEXT NOT NULL, -- 내부 주문 번호
    amount NUMERIC(10, 2) NOT NULL, -- 결제 금액 (USD)
    currency TEXT NOT NULL DEFAULT 'USD',
    country TEXT NOT NULL, -- 결제 국가
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'failed', 'canceled', 'refunded')),
    product_type TEXT NOT NULL CHECK (product_type IN ('coupon', 'vip_subscription', 'lecture')),
    product_data JSONB DEFAULT '{}', -- 상품 상세 정보
    paypal_data JSONB, -- PayPal 응답 데이터
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_purchases_user_id ON public.purchases(user_id);
CREATE INDEX IF NOT EXISTS idx_purchases_payment_id ON public.purchases(payment_id);
CREATE INDEX IF NOT EXISTS idx_purchases_order_id ON public.purchases(order_id);
CREATE INDEX IF NOT EXISTS idx_purchases_status ON public.purchases(status);
CREATE INDEX IF NOT EXISTS idx_purchases_provider ON public.purchases(provider);
CREATE INDEX IF NOT EXISTS idx_purchases_product_type ON public.purchases(product_type);
CREATE INDEX IF NOT EXISTS idx_purchases_country ON public.purchases(country);
CREATE INDEX IF NOT EXISTS idx_purchases_created_at ON public.purchases(created_at DESC);

-- 복합 인덱스
CREATE INDEX IF NOT EXISTS idx_purchases_user_status ON public.purchases(user_id, status);
CREATE INDEX IF NOT EXISTS idx_purchases_provider_status ON public.purchases(provider, status);

-- JSONB 인덱스
CREATE INDEX IF NOT EXISTS idx_purchases_product_data ON public.purchases USING GIN(product_data);
CREATE INDEX IF NOT EXISTS idx_purchases_paypal_data ON public.purchases USING GIN(paypal_data);

-- 3. RLS 활성화
ALTER TABLE public.purchases ENABLE ROW LEVEL SECURITY;

-- 4. RLS 정책 생성
-- 사용자는 자신의 구매 기록만 볼 수 있음
CREATE POLICY "Users can view own purchases" ON public.purchases
    FOR SELECT USING (auth.uid() = user_id);

-- 시스템은 모든 사용자에게 구매 기록을 생성할 수 있음
CREATE POLICY "System can create purchases" ON public.purchases
    FOR INSERT WITH CHECK (true);

-- 시스템은 구매 기록을 업데이트할 수 있음 (webhook 등)
CREATE POLICY "System can update purchases" ON public.purchases
    FOR UPDATE USING (true);

-- 관리자는 모든 구매 기록을 관리할 수 있음
CREATE POLICY "Admins can manage all purchases" ON public.purchases
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.users
            WHERE public.users.id = auth.uid()
            AND public.users.is_admin = true
        )
    );

-- 5. 업데이트 시간 자동 갱신 트리거
CREATE TRIGGER update_purchases_updated_at
    BEFORE UPDATE ON public.purchases
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- 6. 구매 성공 시 쿠폰 적립 함수
CREATE OR REPLACE FUNCTION process_coupon_purchase(
    target_user_id UUID,
    purchase_amount NUMERIC,
    payment_id TEXT,
    order_id TEXT,
    country TEXT,
    paypal_data JSONB DEFAULT NULL
)
RETURNS BOOLEAN AS $$
DECLARE
    coupon_minutes INTEGER;
    purchase_id UUID;
BEGIN
    -- 쿠폰 분수 계산 (20분 = 1.99달러)
    coupon_minutes := (purchase_amount / 1.99)::INTEGER * 20;

    -- 구매 기록 생성
    INSERT INTO public.purchases (
        user_id,
        provider,
        payment_id,
        order_id,
        amount,
        currency,
        country,
        status,
        product_type,
        product_data,
        paypal_data
    ) VALUES (
        target_user_id,
        'paypal',
        payment_id,
        order_id,
        purchase_amount,
        'USD',
        country,
        'paid',
        'coupon',
        jsonb_build_object(
            'coupon_minutes', coupon_minutes,
            'coupon_count', (coupon_minutes / 20)::INTEGER
        ),
        paypal_data
    ) RETURNING id INTO purchase_id;

    -- 쿠폰 테이블에 분수 추가
    INSERT INTO public.coupons (
        user_id,
        type,
        amount,
        minutes_remaining,
        source,
        expires_at
    ) VALUES (
        target_user_id,
        'ako',
        (coupon_minutes / 20)::INTEGER,
        coupon_minutes,
        'purchase',
        NOW() + INTERVAL '1 year' -- 1년 후 만료
    );

    -- 사용자에게 알림
    INSERT INTO public.notifications (
        user_id,
        type,
        title,
        message,
        data,
        priority
    ) VALUES (
        target_user_id,
        'coupon_received',
        '쿠폰 구매 완료!',
        CONCAT(coupon_minutes, '분 쿠폰이 적립되었습니다.'),
        jsonb_build_object(
            'purchase_id', purchase_id,
            'coupon_minutes', coupon_minutes,
            'coupon_count', (coupon_minutes / 20)::INTEGER
        ),
        'normal'
    );

    RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 7. 구매 상태 업데이트 함수
CREATE OR REPLACE FUNCTION update_purchase_status(
    target_payment_id TEXT,
    new_status TEXT,
    paypal_data JSONB DEFAULT NULL
)
RETURNS BOOLEAN AS $$
DECLARE
    purchase_record RECORD;
BEGIN
    -- 구매 기록 조회
    SELECT * INTO purchase_record
    FROM public.purchases
    WHERE payment_id = target_payment_id;

    -- 구매 기록이 존재하지 않는 경우
    IF NOT FOUND THEN
        RAISE EXCEPTION '구매 기록을 찾을 수 없습니다.';
    END IF;

    -- 상태 업데이트
    UPDATE public.purchases
    SET
        status = new_status,
        paypal_data = COALESCE(paypal_data, public.purchases.paypal_data),
        updated_at = NOW()
    WHERE payment_id = target_payment_id;

    -- 실패/취소 시 알림
    IF new_status IN ('failed', 'canceled') THEN
        INSERT INTO public.notifications (
            user_id,
            type,
            title,
            message,
            data,
            priority
        ) VALUES (
            purchase_record.user_id,
            'payment_failed',
            '결제 실패',
            '결제가 실패하거나 취소되었습니다.',
            jsonb_build_object(
                'purchase_id', purchase_record.id,
                'status', new_status
            ),
            'normal'
        );
    END IF;

    RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 8. 쿠폰 사용 가능 여부 확인 함수
CREATE OR REPLACE FUNCTION check_coupon_availability(user_uuid UUID DEFAULT NULL)
RETURNS TABLE (
    has_coupon BOOLEAN,
    total_minutes INTEGER,
    available_coupons INTEGER
) AS $$
BEGIN
    -- 사용자 ID가 제공되지 않은 경우 현재 인증된 사용자 사용
    IF user_uuid IS NULL THEN
        user_uuid := auth.uid();
    END IF;

    RETURN QUERY
    SELECT
        CASE
            WHEN COALESCE(SUM(c.minutes_remaining), 0) > 0 THEN true
            ELSE false
        END as has_coupon,
        COALESCE(SUM(c.minutes_remaining), 0)::INTEGER as total_minutes,
        COALESCE(SUM(c.amount - c.used_amount), 0)::INTEGER as available_coupons
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
구매 기록 테이블 필드 설명:

1. id: 구매 기록 고유 ID (UUID)
2. user_id: 사용자 테이블 참조 (CASCADE 삭제)
3. provider: 결제 제공업체 (paypal, toss, stripe)
4. payment_id: PayPal Order ID (고유값)
5. order_id: 내부 주문 번호
6. amount: 결제 금액 (USD)
7. currency: 통화 단위 (기본값: USD)
8. country: 결제 국가
9. status: 결제 상태 (pending, paid, failed, canceled, refunded)
10. product_type: 상품 타입 (coupon, vip_subscription)
11. product_data: 상품 상세 정보 (JSONB)
12. paypal_data: PayPal 응답 데이터 (JSONB)
13. created_at: 생성 시간
14. updated_at: 수정 시간

함수:
- process_coupon_purchase(): 쿠폰 구매 성공 시 처리
- update_purchase_status(): 구매 상태 업데이트
- check_coupon_availability(): 쿠폰 사용 가능 여부 확인

RLS 정책:
- 사용자는 자신의 구매 기록만 조회 가능
- 시스템은 구매 기록 생성/업데이트 가능
- 관리자는 모든 구매 기록 관리 가능

쿠폰 구매 규칙:
- 20분 = 1.99달러 (PayPal 단건 결제)
- 글로벌 유저만 구매 가능
- 구매 성공 시 coupons 테이블에 분수 적립
- 1년 후 만료
*/
