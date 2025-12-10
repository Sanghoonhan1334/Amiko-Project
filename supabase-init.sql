-- =====================================================
-- AMIKO 프로젝트 Supabase 초기화 스크립트
-- =====================================================
-- 이 스크립트는 Supabase 콘솔 > SQL Editor에서 한 번에 실행 가능합니다.
-- 
-- 생성되는 테이블:
-- 1. users (auth.users 확장)
-- 2. consultants (상담사)
-- 3. bookings (예약)
-- 4. payments (PayPal 결제 기록)
-- 5. purchases (구매 기록: 쿠폰, VIP 구독 등)
-- 6. coupons (쿠폰)
-- 7. vip_subscriptions (VIP 구독)
-- 8. vip_features (VIP 기능)
--
-- 실행 방법:
-- 1. Supabase Dashboard > SQL Editor 접속
-- 2. 이 파일 내용 전체를 복사하여 붙여넣기
-- 3. "Run" 버튼 클릭
-- =====================================================

-- 확장 기능 활성화
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- 1. 사용자 테이블 (Users Table) - auth.users 확장
-- =====================================================
-- auth.users(id)와 1:1 관계로 연결되는 사용자 프로필 테이블
CREATE TABLE IF NOT EXISTS public.users (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    full_name TEXT,
    name TEXT,
    avatar_url TEXT,
    phone TEXT,
    one_line_intro TEXT,
    language TEXT DEFAULT 'ko',
    is_admin BOOLEAN DEFAULT FALSE,
    is_korean BOOLEAN DEFAULT FALSE,
    main_profile_image TEXT,
    profile_image TEXT,
    profile_images TEXT[],
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- 2. 상담사 테이블 (Consultants Table)
-- =====================================================
-- 상담사 정보를 저장하는 테이블
-- users 테이블과 1:N 관계 (한 사용자가 여러 상담사 프로필을 가질 수 있음)
CREATE TABLE IF NOT EXISTS public.consultants (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    specialty TEXT NOT NULL,
    description TEXT,
    hourly_rate NUMERIC(10, 2) NOT NULL,
    currency TEXT DEFAULT 'USD',
    languages TEXT[] DEFAULT ARRAY['English'],
    availability JSONB DEFAULT '{}',
    rating NUMERIC(3, 2) DEFAULT 0.0,
    total_sessions INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    profile_image_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- 3. 예약 테이블 (Bookings Table)
-- =====================================================
-- 상담 예약 정보를 저장하는 테이블
-- users와 consultants 테이블과 연결되어 예약을 관리
CREATE TABLE IF NOT EXISTS public.bookings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    consultant_id UUID REFERENCES public.consultants(id) ON DELETE SET NULL,
    order_id TEXT UNIQUE NOT NULL,
    topic TEXT NOT NULL,
    description TEXT,
    start_at TIMESTAMP WITH TIME ZONE NOT NULL,
    end_at TIMESTAMP WITH TIME ZONE NOT NULL,
    duration INTEGER NOT NULL,
    price NUMERIC(10, 2) NOT NULL,
    currency TEXT DEFAULT 'USD',
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'cancelled', 'completed', 'no_show')),
    payment_status TEXT DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'failed', 'refunded')),
    payment_method TEXT DEFAULT 'paypal',
    payment_id TEXT,
    meeting_link TEXT,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- 4. 결제 테이블 (Payments Table)
-- =====================================================
-- PayPal 결제 기록을 저장하는 테이블
-- bookings와 연결되어 예약 결제를 추적
-- amount는 INTEGER (센트 단위)로 저장
CREATE TABLE IF NOT EXISTS public.payments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    order_id TEXT NOT NULL,
    payment_id TEXT UNIQUE NOT NULL,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    booking_id UUID REFERENCES public.bookings(id) ON DELETE SET NULL,
    amount INTEGER NOT NULL,
    currency TEXT NOT NULL DEFAULT 'USD',
    status TEXT NOT NULL CHECK (status IN ('pending', 'completed', 'failed', 'cancelled', 'refunded')),
    payment_method TEXT DEFAULT 'paypal',
    paypal_data JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- 5. 구매 기록 테이블 (Purchases Table)
-- =====================================================
-- 쿠폰, VIP 구독 등 상품 구매 기록을 저장하는 테이블
-- payments와 별도로 관리되어 다양한 결제 플로우를 지원
-- amount는 DECIMAL (USD 단위)로 저장
CREATE TABLE IF NOT EXISTS public.purchases (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    provider TEXT NOT NULL CHECK (provider IN ('paypal', 'toss', 'stripe')),
    payment_id TEXT UNIQUE NOT NULL,
    order_id TEXT NOT NULL,
    amount NUMERIC(10, 2) NOT NULL,
    currency TEXT NOT NULL DEFAULT 'USD',
    country TEXT,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'failed', 'canceled', 'refunded')),
    product_type TEXT NOT NULL CHECK (product_type IN ('coupon', 'vip_subscription', 'booking')),
    product_data JSONB DEFAULT '{}',
    paypal_data JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- 6. 쿠폰 테이블 (Coupons Table)
-- =====================================================
-- AKO 쿠폰을 관리하는 테이블
-- purchases 테이블과 연동되어 쿠폰 구매 시 생성
CREATE TABLE IF NOT EXISTS public.coupons (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    type TEXT NOT NULL CHECK (type IN ('video_call', 'consultation', 'ako')),
    amount INTEGER NOT NULL,
    used_amount INTEGER DEFAULT 0,
    expires_at TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN DEFAULT TRUE,
    source TEXT DEFAULT 'purchase' CHECK (source IN ('purchase', 'gift', 'promotion', 'admin', 'event')),
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- 7. 쿠폰 사용 기록 테이블 (Coupon Usage Table)
-- =====================================================
-- 쿠폰 사용 이력을 추적하는 테이블
CREATE TABLE IF NOT EXISTS public.coupon_usage (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    coupon_id UUID REFERENCES public.coupons(id) ON DELETE CASCADE,
    booking_id UUID REFERENCES public.bookings(id) ON DELETE SET NULL,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    amount_used INTEGER NOT NULL,
    used_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- 8. VIP 구독 테이블 (VIP Subscriptions Table)
-- =====================================================
-- VIP 구독 정보를 저장하는 테이블
CREATE TABLE IF NOT EXISTS public.vip_subscriptions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    plan_type TEXT NOT NULL CHECK (plan_type IN ('monthly', 'yearly', 'lifetime')),
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'cancelled', 'expired', 'suspended')),
    start_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    end_date TIMESTAMP WITH TIME ZONE,
    auto_renew BOOLEAN DEFAULT TRUE,
    payment_method TEXT CHECK (payment_method IN ('paypal', 'stripe', 'coupon', 'admin')),
    price NUMERIC(10, 2) NOT NULL,
    currency TEXT DEFAULT 'USD',
    features JSONB DEFAULT '{}',
    cancellation_reason TEXT,
    cancelled_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- 9. VIP 기능 테이블 (VIP Features Table)
-- =====================================================
-- VIP 구독자가 사용할 수 있는 기능 목록
CREATE TABLE IF NOT EXISTS public.vip_features (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    feature_key TEXT UNIQUE NOT NULL,
    feature_name TEXT NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- 인덱스 생성
-- =====================================================

-- users 인덱스
CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email);
CREATE INDEX IF NOT EXISTS idx_users_language ON public.users(language);
CREATE INDEX IF NOT EXISTS idx_users_is_admin ON public.users(is_admin);
CREATE INDEX IF NOT EXISTS idx_users_created_at ON public.users(created_at DESC);

-- consultants 인덱스
CREATE INDEX IF NOT EXISTS idx_consultants_user_id ON public.consultants(user_id);
CREATE INDEX IF NOT EXISTS idx_consultants_specialty ON public.consultants(specialty);
CREATE INDEX IF NOT EXISTS idx_consultants_is_active ON public.consultants(is_active);
CREATE INDEX IF NOT EXISTS idx_consultants_languages ON public.consultants USING GIN(languages);
CREATE INDEX IF NOT EXISTS idx_consultants_availability ON public.consultants USING GIN(availability);

-- bookings 인덱스
CREATE INDEX IF NOT EXISTS idx_bookings_user_id ON public.bookings(user_id);
CREATE INDEX IF NOT EXISTS idx_bookings_consultant_id ON public.bookings(consultant_id);
CREATE INDEX IF NOT EXISTS idx_bookings_order_id ON public.bookings(order_id);
CREATE INDEX IF NOT EXISTS idx_bookings_status ON public.bookings(status);
CREATE INDEX IF NOT EXISTS idx_bookings_payment_status ON public.bookings(payment_status);
CREATE INDEX IF NOT EXISTS idx_bookings_payment_id ON public.bookings(payment_id);
CREATE INDEX IF NOT EXISTS idx_bookings_start_at ON public.bookings(start_at);
CREATE INDEX IF NOT EXISTS idx_bookings_user_status ON public.bookings(user_id, status);
CREATE INDEX IF NOT EXISTS idx_bookings_consultant_status ON public.bookings(consultant_id, status);

-- payments 인덱스
CREATE INDEX IF NOT EXISTS idx_payments_order_id ON public.payments(order_id);
CREATE INDEX IF NOT EXISTS idx_payments_payment_id ON public.payments(payment_id);
CREATE INDEX IF NOT EXISTS idx_payments_user_id ON public.payments(user_id);
CREATE INDEX IF NOT EXISTS idx_payments_booking_id ON public.payments(booking_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON public.payments(status);
CREATE INDEX IF NOT EXISTS idx_payments_created_at ON public.payments(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_payments_user_status ON public.payments(user_id, status);
CREATE INDEX IF NOT EXISTS idx_payments_paypal_data ON public.payments USING GIN(paypal_data);

-- purchases 인덱스
CREATE INDEX IF NOT EXISTS idx_purchases_user_id ON public.purchases(user_id);
CREATE INDEX IF NOT EXISTS idx_purchases_payment_id ON public.purchases(payment_id);
CREATE INDEX IF NOT EXISTS idx_purchases_order_id ON public.purchases(order_id);
CREATE INDEX IF NOT EXISTS idx_purchases_status ON public.purchases(status);
CREATE INDEX IF NOT EXISTS idx_purchases_provider ON public.purchases(provider);
CREATE INDEX IF NOT EXISTS idx_purchases_product_type ON public.purchases(product_type);
CREATE INDEX IF NOT EXISTS idx_purchases_created_at ON public.purchases(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_purchases_user_status ON public.purchases(user_id, status);
CREATE INDEX IF NOT EXISTS idx_purchases_product_data ON public.purchases USING GIN(product_data);
CREATE INDEX IF NOT EXISTS idx_purchases_paypal_data ON public.purchases USING GIN(paypal_data);

-- coupons 인덱스
CREATE INDEX IF NOT EXISTS idx_coupons_user_id ON public.coupons(user_id);
CREATE INDEX IF NOT EXISTS idx_coupons_type ON public.coupons(type);
CREATE INDEX IF NOT EXISTS idx_coupons_is_active ON public.coupons(is_active);
CREATE INDEX IF NOT EXISTS idx_coupons_expires_at ON public.coupons(expires_at);
CREATE INDEX IF NOT EXISTS idx_coupons_user_active ON public.coupons(user_id, is_active);

-- coupon_usage 인덱스
CREATE INDEX IF NOT EXISTS idx_coupon_usage_coupon_id ON public.coupon_usage(coupon_id);
CREATE INDEX IF NOT EXISTS idx_coupon_usage_user_id ON public.coupon_usage(user_id);
CREATE INDEX IF NOT EXISTS idx_coupon_usage_booking_id ON public.coupon_usage(booking_id);

-- vip_subscriptions 인덱스
CREATE INDEX IF NOT EXISTS idx_vip_subscriptions_user_id ON public.vip_subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_vip_subscriptions_status ON public.vip_subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_vip_subscriptions_plan_type ON public.vip_subscriptions(plan_type);

-- =====================================================
-- updated_at 자동 업데이트 함수 및 트리거
-- =====================================================

-- updated_at 자동 업데이트 함수
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 각 테이블에 트리거 적용
DROP TRIGGER IF EXISTS update_users_updated_at ON public.users;
CREATE TRIGGER update_users_updated_at 
    BEFORE UPDATE ON public.users
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_consultants_updated_at ON public.consultants;
CREATE TRIGGER update_consultants_updated_at 
    BEFORE UPDATE ON public.consultants
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_bookings_updated_at ON public.bookings;
CREATE TRIGGER update_bookings_updated_at 
    BEFORE UPDATE ON public.bookings
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_payments_updated_at ON public.payments;
CREATE TRIGGER update_payments_updated_at 
    BEFORE UPDATE ON public.payments
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_purchases_updated_at ON public.purchases;
CREATE TRIGGER update_purchases_updated_at 
    BEFORE UPDATE ON public.purchases
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_vip_subscriptions_updated_at ON public.vip_subscriptions;
CREATE TRIGGER update_vip_subscriptions_updated_at 
    BEFORE UPDATE ON public.vip_subscriptions
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- RLS (Row Level Security) 활성화
-- =====================================================

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.consultants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.purchases ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coupons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coupon_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vip_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vip_features ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- RLS 정책 생성
-- =====================================================

-- users 정책
DROP POLICY IF EXISTS "Users can view own profile" ON public.users;
CREATE POLICY "Users can view own profile" ON public.users
    FOR SELECT USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update own profile" ON public.users;
CREATE POLICY "Users can update own profile" ON public.users
    FOR UPDATE USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can insert own profile" ON public.users;
CREATE POLICY "Users can insert own profile" ON public.users
    FOR INSERT WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "Admins can manage all users" ON public.users;
CREATE POLICY "Admins can manage all users" ON public.users
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE public.users.id = auth.uid() 
            AND public.users.is_admin = true
        )
    );

-- consultants 정책
DROP POLICY IF EXISTS "Anyone can view active consultants" ON public.consultants;
CREATE POLICY "Anyone can view active consultants" ON public.consultants
    FOR SELECT USING (is_active = true);

DROP POLICY IF EXISTS "Consultants can view own profile" ON public.consultants;
CREATE POLICY "Consultants can view own profile" ON public.consultants
    FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Consultants can update own profile" ON public.consultants;
CREATE POLICY "Consultants can update own profile" ON public.consultants
    FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can create consultant profile" ON public.consultants;
CREATE POLICY "Users can create consultant profile" ON public.consultants
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- bookings 정책
DROP POLICY IF EXISTS "Users can view own bookings" ON public.bookings;
CREATE POLICY "Users can view own bookings" ON public.bookings
    FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can create own bookings" ON public.bookings;
CREATE POLICY "Users can create own bookings" ON public.bookings
    FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own bookings" ON public.bookings;
CREATE POLICY "Users can update own bookings" ON public.bookings
    FOR UPDATE USING (auth.uid() = user_id);

-- payments 정책
DROP POLICY IF EXISTS "Users can view own payments" ON public.payments;
CREATE POLICY "Users can view own payments" ON public.payments
    FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "System can create payments" ON public.payments;
CREATE POLICY "System can create payments" ON public.payments
    FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "System can update payments" ON public.payments;
CREATE POLICY "System can update payments" ON public.payments
    FOR UPDATE USING (true);

-- purchases 정책
DROP POLICY IF EXISTS "Users can view own purchases" ON public.purchases;
CREATE POLICY "Users can view own purchases" ON public.purchases
    FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "System can create purchases" ON public.purchases;
CREATE POLICY "System can create purchases" ON public.purchases
    FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "System can update purchases" ON public.purchases;
CREATE POLICY "System can update purchases" ON public.purchases
    FOR UPDATE USING (true);

-- coupons 정책
DROP POLICY IF EXISTS "Users can view own coupons" ON public.coupons;
CREATE POLICY "Users can view own coupons" ON public.coupons
    FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "System can create coupons" ON public.coupons;
CREATE POLICY "System can create coupons" ON public.coupons
    FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "System can update coupons" ON public.coupons;
CREATE POLICY "System can update coupons" ON public.coupons
    FOR UPDATE USING (true);

-- coupon_usage 정책
DROP POLICY IF EXISTS "Users can view own coupon usage" ON public.coupon_usage;
CREATE POLICY "Users can view own coupon usage" ON public.coupon_usage
    FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "System can create coupon usage" ON public.coupon_usage;
CREATE POLICY "System can create coupon usage" ON public.coupon_usage
    FOR INSERT WITH CHECK (true);

-- vip_subscriptions 정책
DROP POLICY IF EXISTS "Users can view own vip subscriptions" ON public.vip_subscriptions;
CREATE POLICY "Users can view own vip subscriptions" ON public.vip_subscriptions
    FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can create own vip subscriptions" ON public.vip_subscriptions;
CREATE POLICY "Users can create own vip subscriptions" ON public.vip_subscriptions
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- vip_features 정책
DROP POLICY IF EXISTS "Anyone can view vip features" ON public.vip_features;
CREATE POLICY "Anyone can view vip features" ON public.vip_features
    FOR SELECT USING (is_active = true);

-- 관리자 정책 (모든 테이블에 적용)
DO $$
BEGIN
    -- bookings 관리자 정책
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'public' 
        AND tablename = 'bookings' 
        AND policyname = 'Admins can manage all bookings'
    ) THEN
        CREATE POLICY "Admins can manage all bookings" ON public.bookings
            FOR ALL USING (
                EXISTS (
                    SELECT 1 FROM public.users 
                    WHERE public.users.id = auth.uid() 
                    AND public.users.is_admin = true
                )
            );
    END IF;

    -- payments 관리자 정책
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'public' 
        AND tablename = 'payments' 
        AND policyname = 'Admins can manage all payments'
    ) THEN
        CREATE POLICY "Admins can manage all payments" ON public.payments
            FOR ALL USING (
                EXISTS (
                    SELECT 1 FROM public.users 
                    WHERE public.users.id = auth.uid() 
                    AND public.users.is_admin = true
                )
            );
    END IF;

    -- purchases 관리자 정책
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'public' 
        AND tablename = 'purchases' 
        AND policyname = 'Admins can manage all purchases'
    ) THEN
        CREATE POLICY "Admins can manage all purchases" ON public.purchases
            FOR ALL USING (
                EXISTS (
                    SELECT 1 FROM public.users 
                    WHERE public.users.id = auth.uid() 
                    AND public.users.is_admin = true
                )
            );
    END IF;

    -- consultants 관리자 정책
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'public' 
        AND tablename = 'consultants' 
        AND policyname = 'Admins can manage all consultants'
    ) THEN
        CREATE POLICY "Admins can manage all consultants" ON public.consultants
            FOR ALL USING (
                EXISTS (
                    SELECT 1 FROM public.users 
                    WHERE public.users.id = auth.uid() 
                    AND public.users.is_admin = true
                )
            );
    END IF;
END $$;

-- =====================================================
-- 테스트 데이터 삽입
-- =====================================================

-- 주의: 테스트 사용자는 Supabase Auth에서 먼저 생성해야 합니다.
-- 아래 스크립트는 auth.users에 이미 사용자가 있다고 가정합니다.

-- 테스트 사용자 프로필 생성 (auth.users에 사용자가 있는 경우)
-- 실제 테스트 시에는 다음 단계를 따라하세요:
-- 1. Supabase Dashboard > Authentication > Users
-- 2. "Add user" 클릭
-- 3. Email: test@amiko.com, Password: test123456 설정
-- 4. 아래 스크립트가 자동으로 public.users에 프로필 생성

DO $$
DECLARE
    test_user_id UUID;
    test_user_exists BOOLEAN;
BEGIN
    -- auth.users에서 테스트 사용자 찾기
    SELECT id INTO test_user_id
    FROM auth.users
    WHERE email = 'test@amiko.com'
    LIMIT 1;

    IF test_user_id IS NOT NULL THEN
        -- public.users에 프로필이 있는지 확인
        SELECT EXISTS(SELECT 1 FROM public.users WHERE id = test_user_id) INTO test_user_exists;

        IF NOT test_user_exists THEN
            -- 테스트 사용자 프로필 생성
            INSERT INTO public.users (id, email, full_name, name, language, is_admin)
            VALUES (test_user_id, 'test@amiko.com', 'Test User', 'Test User', 'ko', false)
            ON CONFLICT (id) DO NOTHING;

            RAISE NOTICE '✅ 테스트 사용자 프로필 생성 완료: %', test_user_id;
        ELSE
            RAISE NOTICE 'ℹ️ 테스트 사용자 프로필이 이미 존재합니다: %', test_user_id;
        END IF;
    ELSE
        RAISE NOTICE '⚠️ 테스트 사용자를 생성하려면 먼저 Supabase Auth에서 사용자를 생성하세요:';
        RAISE NOTICE '   1. Dashboard > Authentication > Users > Add user';
        RAISE NOTICE '   2. Email: test@amiko.com, Password: test123456';
        RAISE NOTICE '   3. 이 스크립트를 다시 실행하세요.';
    END IF;
END $$;

-- 테스트 결제 기록 생성 (사용자가 있는 경우)
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
)
SELECT 
    (SELECT id FROM public.users LIMIT 1),
    'paypal',
    'PAYPAL-TEST-' || to_char(NOW(), 'YYYYMMDDHH24MISS'),
    'order-test-' || to_char(NOW(), 'YYYYMMDDHH24MISS'),
    1.99,
    'USD',
    'US',
    'paid',
    'coupon',
    '{"coupon_minutes": 20, "coupon_count": 1}'::jsonb,
    '{"id": "PAYPAL-TEST", "status": "COMPLETED"}'::jsonb
WHERE EXISTS (SELECT 1 FROM public.users LIMIT 1)
AND NOT EXISTS (
    SELECT 1 FROM public.purchases 
    WHERE payment_id LIKE 'PAYPAL-TEST-%'
    LIMIT 1
);

-- =====================================================
-- 완료 메시지
-- =====================================================

DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '✅ ========================================';
    RAISE NOTICE '✅ AMIKO 프로젝트 데이터베이스 초기화 완료!';
    RAISE NOTICE '✅ ========================================';
    RAISE NOTICE '';
    RAISE NOTICE '생성된 테이블:';
    RAISE NOTICE '  ✓ users (사용자)';
    RAISE NOTICE '  ✓ consultants (상담사)';
    RAISE NOTICE '  ✓ bookings (예약)';
    RAISE NOTICE '  ✓ payments (결제 기록)';
    RAISE NOTICE '  ✓ purchases (구매 기록)';
    RAISE NOTICE '  ✓ coupons (쿠폰)';
    RAISE NOTICE '  ✓ coupon_usage (쿠폰 사용 기록)';
    RAISE NOTICE '  ✓ vip_subscriptions (VIP 구독)';
    RAISE NOTICE '  ✓ vip_features (VIP 기능)';
    RAISE NOTICE '';
    RAISE NOTICE '다음 단계:';
    RAISE NOTICE '  1. Supabase Auth에서 테스트 사용자 생성';
    RAISE NOTICE '     - Dashboard > Authentication > Users > Add user';
    RAISE NOTICE '     - Email: test@amiko.com';
    RAISE NOTICE '     - Password: test123456';
    RAISE NOTICE '  2. 이 스크립트를 다시 실행하여 테스트 데이터 생성';
    RAISE NOTICE '  3. 로그인 및 결제 플로우 테스트';
    RAISE NOTICE '';
END $$;
