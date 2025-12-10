-- =====================================================
-- PayPal 결제 시스템 통합 스키마
-- Amiko Project - PayPal Payment Integration
-- Date: 2025-12-09
-- =====================================================
-- 
-- 이 스키마는 다음 PayPal 결제 플로우를 지원합니다:
-- 1. create-order: 주문 생성 (purchases 테이블에 pending 상태로 저장)
-- 2. approve-order: 주문 승인 (payments 테이블에 저장, bookings 테이블 업데이트)
-- 3. webhook: PayPal 웹훅 처리 (purchases 테이블 업데이트)
--
-- 실행 방법:
-- 1. Supabase Dashboard > SQL Editor에서 실행
-- 2. 또는 Supabase CLI로 마이그레이션 실행
-- =====================================================

-- 필요한 확장 기능 활성화
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- 1. 사용자 테이블 (Users Table)
-- =====================================================
-- 참고: Supabase Auth와 연동되어 있다고 가정
-- 이미 존재하는 경우 스킵됨 (CREATE TABLE IF NOT EXISTS)

CREATE TABLE IF NOT EXISTS public.users (
    id UUID REFERENCES auth.users(id) PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    full_name TEXT,
    name TEXT,
    avatar_url TEXT,
    phone TEXT,
    one_line_intro TEXT,
    language TEXT DEFAULT 'ko',
    is_admin BOOLEAN DEFAULT FALSE,
    is_korean BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- 2. 상담사 테이블 (Consultants Table)
-- =====================================================
-- 예약과 연결된 상담사 정보

CREATE TABLE IF NOT EXISTS public.consultants (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    specialty TEXT NOT NULL,
    description TEXT,
    hourly_rate DECIMAL(10, 2) NOT NULL,
    currency TEXT DEFAULT 'USD',
    languages TEXT[] DEFAULT ARRAY['English'],
    available_hours JSONB DEFAULT '{}',
    rating DECIMAL(3, 2) DEFAULT 0.0,
    total_sessions INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    profile_image_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- 3. 예약 테이블 (Bookings Table)
-- =====================================================
-- 상담 예약 정보 (결제와 연결)

CREATE TABLE IF NOT EXISTS public.bookings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    consultant_id UUID REFERENCES public.consultants(id) ON DELETE SET NULL,
    order_id TEXT UNIQUE NOT NULL, -- 내부 주문 번호 (예: order-1234567890-abc123)
    topic TEXT NOT NULL,
    description TEXT,
    start_at TIMESTAMP WITH TIME ZONE NOT NULL,
    end_at TIMESTAMP WITH TIME ZONE NOT NULL,
    duration INTEGER NOT NULL, -- 분 단위
    price DECIMAL(10, 2) NOT NULL, -- USD 단위
    currency TEXT DEFAULT 'USD',
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'cancelled', 'completed', 'no_show')),
    payment_status TEXT DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'failed', 'refunded')), -- 결제 상태
    payment_method TEXT DEFAULT 'paypal', -- 결제 방법
    payment_id TEXT, -- PayPal Order ID (payments 테이블의 payment_id와 연결)
    meeting_link TEXT,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- 4. 결제 테이블 (Payments Table)
-- =====================================================
-- PayPal 결제 기록 (approve-order에서 저장)

CREATE TABLE IF NOT EXISTS public.payments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    order_id TEXT NOT NULL, -- 내부 주문 번호 (bookings.order_id와 연결)
    payment_id TEXT UNIQUE NOT NULL, -- PayPal Order ID (예: 5O190127TN364715T)
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    booking_id UUID REFERENCES public.bookings(id) ON DELETE SET NULL,
    amount INTEGER NOT NULL, -- 센트 단위 (예: 199 = $1.99)
    currency TEXT NOT NULL DEFAULT 'USD',
    status TEXT NOT NULL CHECK (status IN ('pending', 'completed', 'failed', 'cancelled', 'refunded')),
    payment_method TEXT DEFAULT 'paypal',
    paypal_data JSONB, -- PayPal API 응답 전체 데이터 저장
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- 5. 구매 기록 테이블 (Purchases Table)
-- =====================================================
-- 쿠폰, VIP 구독 등 상품 구매 기록 (create-order에서 pending으로 저장, webhook에서 업데이트)

CREATE TABLE IF NOT EXISTS public.purchases (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    provider TEXT NOT NULL CHECK (provider IN ('paypal', 'toss', 'stripe')),
    payment_id TEXT UNIQUE NOT NULL, -- PayPal Order ID
    order_id TEXT NOT NULL, -- 내부 주문 번호
    amount DECIMAL(10, 2) NOT NULL, -- USD 단위
    currency TEXT NOT NULL DEFAULT 'USD',
    country TEXT, -- 결제 국가 (선택적)
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'failed', 'canceled', 'refunded')),
    product_type TEXT NOT NULL CHECK (product_type IN ('coupon', 'vip_subscription', 'booking')), -- 상품 타입
    product_data JSONB DEFAULT '{}', -- 상품 상세 정보 (예: {coupon_minutes: 20, coupon_count: 1})
    paypal_data JSONB, -- PayPal API 응답 전체 데이터
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- 6. 인덱스 생성 (성능 최적화)
-- =====================================================

-- Users 인덱스
CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email);
CREATE INDEX IF NOT EXISTS idx_users_language ON public.users(language);

-- Consultants 인덱스
CREATE INDEX IF NOT EXISTS idx_consultants_user_id ON public.consultants(user_id);
CREATE INDEX IF NOT EXISTS idx_consultants_is_active ON public.consultants(is_active);

-- Bookings 인덱스
CREATE INDEX IF NOT EXISTS idx_bookings_user_id ON public.bookings(user_id);
CREATE INDEX IF NOT EXISTS idx_bookings_consultant_id ON public.bookings(consultant_id);
CREATE INDEX IF NOT EXISTS idx_bookings_order_id ON public.bookings(order_id);
CREATE INDEX IF NOT EXISTS idx_bookings_status ON public.bookings(status);
CREATE INDEX IF NOT EXISTS idx_bookings_payment_status ON public.bookings(payment_status);
CREATE INDEX IF NOT EXISTS idx_bookings_payment_id ON public.bookings(payment_id);
CREATE INDEX IF NOT EXISTS idx_bookings_start_at ON public.bookings(start_at);
CREATE INDEX IF NOT EXISTS idx_bookings_user_status ON public.bookings(user_id, status);
CREATE INDEX IF NOT EXISTS idx_bookings_consultant_status ON public.bookings(consultant_id, status);

-- Payments 인덱스
CREATE INDEX IF NOT EXISTS idx_payments_order_id ON public.payments(order_id);
CREATE INDEX IF NOT EXISTS idx_payments_payment_id ON public.payments(payment_id);
CREATE INDEX IF NOT EXISTS idx_payments_user_id ON public.payments(user_id);
CREATE INDEX IF NOT EXISTS idx_payments_booking_id ON public.payments(booking_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON public.payments(status);
CREATE INDEX IF NOT EXISTS idx_payments_created_at ON public.payments(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_payments_user_status ON public.payments(user_id, status);
CREATE INDEX IF NOT EXISTS idx_payments_booking_status ON public.payments(booking_id, status);

-- Payments JSONB 인덱스 (PayPal 데이터 검색용)
CREATE INDEX IF NOT EXISTS idx_payments_paypal_data ON public.payments USING GIN(paypal_data);

-- Purchases 인덱스
CREATE INDEX IF NOT EXISTS idx_purchases_user_id ON public.purchases(user_id);
CREATE INDEX IF NOT EXISTS idx_purchases_payment_id ON public.purchases(payment_id);
CREATE INDEX IF NOT EXISTS idx_purchases_order_id ON public.purchases(order_id);
CREATE INDEX IF NOT EXISTS idx_purchases_status ON public.purchases(status);
CREATE INDEX IF NOT EXISTS idx_purchases_provider ON public.purchases(provider);
CREATE INDEX IF NOT EXISTS idx_purchases_product_type ON public.purchases(product_type);
CREATE INDEX IF NOT EXISTS idx_purchases_created_at ON public.purchases(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_purchases_user_status ON public.purchases(user_id, status);
CREATE INDEX IF NOT EXISTS idx_purchases_provider_status ON public.purchases(provider, status);

-- Purchases JSONB 인덱스
CREATE INDEX IF NOT EXISTS idx_purchases_product_data ON public.purchases USING GIN(product_data);
CREATE INDEX IF NOT EXISTS idx_purchases_paypal_data ON public.purchases USING GIN(paypal_data);

-- =====================================================
-- 7. 업데이트 시간 자동 갱신 함수
-- =====================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- 8. 업데이트 트리거 적용
-- =====================================================

-- Users 트리거
DROP TRIGGER IF EXISTS update_users_updated_at ON public.users;
CREATE TRIGGER update_users_updated_at 
    BEFORE UPDATE ON public.users
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Consultants 트리거
DROP TRIGGER IF EXISTS update_consultants_updated_at ON public.consultants;
CREATE TRIGGER update_consultants_updated_at 
    BEFORE UPDATE ON public.consultants
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Bookings 트리거
DROP TRIGGER IF EXISTS update_bookings_updated_at ON public.bookings;
CREATE TRIGGER update_bookings_updated_at 
    BEFORE UPDATE ON public.bookings
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Payments 트리거
DROP TRIGGER IF EXISTS update_payments_updated_at ON public.payments;
CREATE TRIGGER update_payments_updated_at 
    BEFORE UPDATE ON public.payments
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Purchases 트리거
DROP TRIGGER IF EXISTS update_purchases_updated_at ON public.purchases;
CREATE TRIGGER update_purchases_updated_at 
    BEFORE UPDATE ON public.purchases
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- 9. RLS (Row Level Security) 활성화
-- =====================================================

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.consultants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.purchases ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- 10. RLS 정책 생성
-- =====================================================

-- Users 정책
DROP POLICY IF EXISTS "Users can view own profile" ON public.users;
CREATE POLICY "Users can view own profile" ON public.users
    FOR SELECT USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update own profile" ON public.users;
CREATE POLICY "Users can update own profile" ON public.users
    FOR UPDATE USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can insert own profile" ON public.users;
CREATE POLICY "Users can insert own profile" ON public.users
    FOR INSERT WITH CHECK (auth.uid() = id);

-- Bookings 정책
DROP POLICY IF EXISTS "Users can view own bookings" ON public.bookings;
CREATE POLICY "Users can view own bookings" ON public.bookings
    FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can create own bookings" ON public.bookings;
CREATE POLICY "Users can create own bookings" ON public.bookings
    FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own bookings" ON public.bookings;
CREATE POLICY "Users can update own bookings" ON public.bookings
    FOR UPDATE USING (auth.uid() = user_id);

-- Payments 정책
DROP POLICY IF EXISTS "Users can view own payments" ON public.payments;
CREATE POLICY "Users can view own payments" ON public.payments
    FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "System can create payments" ON public.payments;
CREATE POLICY "System can create payments" ON public.payments
    FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "System can update payments" ON public.payments;
CREATE POLICY "System can update payments" ON public.payments
    FOR UPDATE USING (true);

-- Purchases 정책
DROP POLICY IF EXISTS "Users can view own purchases" ON public.purchases;
CREATE POLICY "Users can view own purchases" ON public.purchases
    FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "System can create purchases" ON public.purchases;
CREATE POLICY "System can create purchases" ON public.purchases
    FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "System can update purchases" ON public.purchases;
CREATE POLICY "System can update purchases" ON public.purchases
    FOR UPDATE USING (true);

-- 관리자 정책 (모든 테이블)
DO $$
BEGIN
    -- Users 관리자 정책
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'public' 
        AND tablename = 'users' 
        AND policyname = 'Admins can manage all users'
    ) THEN
        CREATE POLICY "Admins can manage all users" ON public.users
            FOR ALL USING (
                EXISTS (
                    SELECT 1 FROM public.users 
                    WHERE public.users.id = auth.uid() 
                    AND public.users.is_admin = true
                )
            );
    END IF;

    -- Bookings 관리자 정책
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

    -- Payments 관리자 정책
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

    -- Purchases 관리자 정책
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
END $$;

-- =====================================================
-- 11. 테스트용 샘플 데이터 삽입
-- =====================================================

-- 테스트용 사용자 1명 생성 (auth.users에 이미 존재한다고 가정)
-- 주의: 실제 auth.users에 사용자가 있어야 함
DO $$
DECLARE
    test_user_id UUID;
BEGIN
    -- 기존 테스트 사용자 확인 또는 생성
    SELECT id INTO test_user_id 
    FROM public.users 
    WHERE email = 'test@amiko.com'
    LIMIT 1;

    -- 사용자가 없으면 생성 (auth.users에 먼저 생성되어 있어야 함)
    IF test_user_id IS NULL THEN
        -- auth.users에 사용자가 있다고 가정하고 public.users에만 추가
        -- 실제로는 Supabase Auth에서 사용자를 먼저 생성해야 함
        RAISE NOTICE '테스트 사용자를 생성하려면 먼저 Supabase Auth에서 사용자를 생성하세요.';
    END IF;
END $$;

-- 테스트용 결제 데이터 1건 삽입
-- 주의: 실제 user_id와 booking_id가 존재해야 함
INSERT INTO public.payments (
    order_id,
    payment_id,
    user_id,
    booking_id,
    amount,
    currency,
    status,
    payment_method,
    paypal_data
) 
SELECT 
    'order-test-001',
    'PAYPAL-TEST-001',
    (SELECT id FROM public.users LIMIT 1),
    (SELECT id FROM public.bookings LIMIT 1),
    199, -- $1.99
    'USD',
    'completed',
    'paypal',
    '{"id": "PAYPAL-TEST-001", "status": "COMPLETED"}'::jsonb
WHERE NOT EXISTS (
    SELECT 1 FROM public.payments WHERE payment_id = 'PAYPAL-TEST-001'
)
ON CONFLICT (payment_id) DO NOTHING;

-- =====================================================
-- 12. 스키마 검증 쿼리
-- =====================================================

-- 테이블 존재 확인
DO $$
DECLARE
    table_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO table_count
    FROM information_schema.tables
    WHERE table_schema = 'public'
    AND table_name IN ('users', 'bookings', 'payments', 'purchases', 'consultants');
    
    RAISE NOTICE '생성된 테이블 수: %', table_count;
END $$;

-- =====================================================
-- 완료 메시지
-- =====================================================

DO $$
BEGIN
    RAISE NOTICE '✅ PayPal 결제 시스템 스키마 생성 완료!';
    RAISE NOTICE '';
    RAISE NOTICE '생성된 테이블:';
    RAISE NOTICE '  - users (사용자)';
    RAISE NOTICE '  - consultants (상담사)';
    RAISE NOTICE '  - bookings (예약)';
    RAISE NOTICE '  - payments (결제 기록)';
    RAISE NOTICE '  - purchases (구매 기록)';
    RAISE NOTICE '';
    RAISE NOTICE '다음 단계:';
    RAISE NOTICE '  1. Supabase Auth에서 테스트 사용자 생성';
    RAISE NOTICE '  2. 테스트 결제 진행';
    RAISE NOTICE '  3. 데이터 확인';
END $$;
