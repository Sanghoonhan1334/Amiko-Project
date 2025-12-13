-- =====================================================
-- Payment System Tables Update Script
-- Description: Updates existing tables to support the complete payment system
-- Date: 2025-12-12
-- =====================================================

-- This script updates existing database tables to support:
-- 1. Purchases table with all product types (coupon, vip_subscription, lecture)
-- 2. Lectures and lecture enrollments for online courses
-- 3. VIP subscriptions management
-- 4. Coupon system integration

BEGIN;

-- =====================================================
-- 1. Update Purchases Table
-- =====================================================

-- Add lecture product type to existing purchases table if not already present
DO $$
BEGIN
    -- Check if the constraint exists and update it
    IF EXISTS (
        SELECT 1 FROM information_schema.check_constraints
        WHERE constraint_name = 'purchases_product_type_check'
        AND constraint_schema = 'public'
    ) THEN
        -- Drop existing constraint
        ALTER TABLE public.purchases DROP CONSTRAINT purchases_product_type_check;
    END IF;

    -- Add updated constraint with all product types
    ALTER TABLE public.purchases
    ADD CONSTRAINT purchases_product_type_check
    CHECK (product_type IN ('coupon', 'vip_subscription', 'lecture'));
END $$;

-- Ensure all necessary columns exist in purchases table
DO $$
BEGIN
    -- Add product_data column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'purchases'
        AND column_name = 'product_data'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE public.purchases ADD COLUMN product_data JSONB DEFAULT '{}';
    END IF;

    -- Add paypal_data column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'purchases'
        AND column_name = 'paypal_data'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE public.purchases ADD COLUMN paypal_data JSONB;
    END IF;
END $$;

-- Create indexes for purchases table if they don't exist
CREATE INDEX IF NOT EXISTS idx_purchases_product_type ON public.purchases(product_type);
CREATE INDEX IF NOT EXISTS idx_purchases_product_data ON public.purchases USING GIN(product_data);
CREATE INDEX IF NOT EXISTS idx_purchases_paypal_data ON public.purchases USING GIN(paypal_data);

-- =====================================================
-- 2. Create/Update Lectures Table
-- =====================================================

-- Create lectures table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.lectures (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    price_usd NUMERIC(10, 2) NOT NULL,
    price_krw NUMERIC(10, 2),
    max_participants INTEGER NOT NULL,
    current_participants INTEGER DEFAULT 0,
    instructor_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
    schedule_date TIMESTAMP WITH TIME ZONE,
    status TEXT NOT NULL DEFAULT 'upcoming' CHECK (status IN ('upcoming', 'ongoing', 'completed', 'cancelled')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create lecture_enrollments table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.lecture_enrollments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    lecture_id UUID REFERENCES public.lectures(id) ON DELETE CASCADE,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    purchase_id UUID REFERENCES public.purchases(id) ON DELETE SET NULL,
    enrolled_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    status TEXT NOT NULL DEFAULT 'enrolled' CHECK (status IN ('enrolled', 'attended', 'absent', 'cancelled'))
);

-- Create indexes for lectures tables
CREATE INDEX IF NOT EXISTS idx_lectures_instructor_id ON public.lectures(instructor_id);
CREATE INDEX IF NOT EXISTS idx_lectures_status ON public.lectures(status);
CREATE INDEX IF NOT EXISTS idx_lectures_schedule_date ON public.lectures(schedule_date);
CREATE INDEX IF NOT EXISTS idx_lectures_created_at ON public.lectures(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_lecture_enrollments_lecture_id ON public.lecture_enrollments(lecture_id);
CREATE INDEX IF NOT EXISTS idx_lecture_enrollments_user_id ON public.lecture_enrollments(user_id);
CREATE INDEX IF NOT EXISTS idx_lecture_enrollments_purchase_id ON public.lecture_enrollments(purchase_id);
CREATE INDEX IF NOT EXISTS idx_lecture_enrollments_status ON public.lecture_enrollments(status);

-- Composite indexes
CREATE INDEX IF NOT EXISTS idx_lectures_status_schedule ON public.lectures(status, schedule_date);
CREATE INDEX IF NOT EXISTS idx_lecture_enrollments_lecture_user ON public.lecture_enrollments(lecture_id, user_id);

-- =====================================================
-- 3. Create/Update VIP Subscriptions Table
-- =====================================================

-- Create VIP subscriptions table if it doesn't exist
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

-- Create VIP features table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.vip_features (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    feature_key TEXT UNIQUE NOT NULL,
    feature_name TEXT NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create VIP subscription history table if it doesn't exist
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

-- Create indexes for VIP tables
CREATE INDEX IF NOT EXISTS idx_vip_subscriptions_user_id ON public.vip_subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_vip_subscriptions_plan_type ON public.vip_subscriptions(plan_type);
CREATE INDEX IF NOT EXISTS idx_vip_subscriptions_status ON public.vip_subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_vip_subscriptions_end_date ON public.vip_subscriptions(end_date);

CREATE INDEX IF NOT EXISTS idx_vip_subscription_history_subscription_id ON public.vip_subscription_history(subscription_id);
CREATE INDEX IF NOT EXISTS idx_vip_subscription_history_created_at ON public.vip_subscription_history(created_at DESC);

-- =====================================================
-- 4. Update Coupons Table
-- =====================================================

-- Ensure coupons table has all necessary columns
DO $$
BEGIN
    -- Add source column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'coupons'
        AND column_name = 'source'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE public.coupons ADD COLUMN source TEXT DEFAULT 'purchase' CHECK (source IN ('purchase', 'gift', 'promotion', 'admin', 'event'));
    END IF;

    -- Add description column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'coupons'
        AND column_name = 'description'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE public.coupons ADD COLUMN description TEXT;
    END IF;
END $$;

-- =====================================================
-- 5. Enable RLS and Create Policies
-- =====================================================

-- Enable RLS on all tables
ALTER TABLE public.purchases ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lectures ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lecture_enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vip_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vip_features ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vip_subscription_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coupons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coupon_usage ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist and recreate them
DROP POLICY IF EXISTS "Users can view own purchases" ON public.purchases;
DROP POLICY IF EXISTS "Users can view lectures" ON public.lectures;
DROP POLICY IF EXISTS "Users can view own enrollments" ON public.lecture_enrollments;
DROP POLICY IF EXISTS "Users can view own vip subscriptions" ON public.vip_subscriptions;
DROP POLICY IF EXISTS "Users can view vip features" ON public.vip_features;
DROP POLICY IF EXISTS "Users can view own coupons" ON public.coupons;
DROP POLICY IF EXISTS "Users can view own coupon usage" ON public.coupon_usage;

-- Create RLS policies
CREATE POLICY "Users can view own purchases" ON public.purchases
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can view lectures" ON public.lectures
    FOR SELECT USING (true); -- Public read access for lectures

CREATE POLICY "Users can view own enrollments" ON public.lecture_enrollments
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can view own vip subscriptions" ON public.vip_subscriptions
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can view vip features" ON public.vip_features
    FOR SELECT USING (true); -- Public read access for features

CREATE POLICY "Users can view own coupons" ON public.coupons
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can view own coupon usage" ON public.coupon_usage
    FOR SELECT USING (auth.uid() = user_id);

-- =====================================================
-- 6. Create Triggers for Automatic Updates
-- =====================================================

-- Function to update lecture participant count
CREATE OR REPLACE FUNCTION update_lecture_participants()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE public.lectures
        SET current_participants = current_participants + 1
        WHERE id = NEW.lecture_id;
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE public.lectures
        SET current_participants = current_participants - 1
        WHERE id = OLD.lecture_id;
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for lecture participant count updates
DROP TRIGGER IF EXISTS trigger_update_lecture_participants ON public.lecture_enrollments;
CREATE TRIGGER trigger_update_lecture_participants
    AFTER INSERT OR DELETE ON public.lecture_enrollments
    FOR EACH ROW EXECUTE FUNCTION update_lecture_participants();

-- Function to update timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at columns
DROP TRIGGER IF EXISTS trigger_update_purchases_updated_at ON public.purchases;
CREATE TRIGGER trigger_update_purchases_updated_at
    BEFORE UPDATE ON public.purchases
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trigger_update_lectures_updated_at ON public.lectures;
CREATE TRIGGER trigger_update_lectures_updated_at
    BEFORE UPDATE ON public.lectures
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trigger_update_vip_subscriptions_updated_at ON public.vip_subscriptions;
CREATE TRIGGER trigger_update_vip_subscriptions_updated_at
    BEFORE UPDATE ON public.vip_subscriptions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- 7. Insert Sample Data (Optional)
-- =====================================================

-- Insert sample lectures if table is empty
INSERT INTO public.lectures (title, description, price_usd, price_krw, max_participants, instructor_id, status)
SELECT
    '한국 문화 기초 강의',
    '한국 문화의 기초를 배우는 온라인 강의입니다.',
    55.00,
    80000.00,
    10,
    NULL::uuid,
    'upcoming'
WHERE NOT EXISTS (SELECT 1 FROM public.lectures WHERE title = '한국 문화 기초 강의')
UNION ALL
SELECT
    '고급 한국어 실력 향상',
    '한국어 실력을 한 단계 높이는 고급 강의입니다.',
    75.00,
    110000.00,
    8,
    NULL::uuid,
    'upcoming'
WHERE NOT EXISTS (SELECT 1 FROM public.lectures WHERE title = '고급 한국어 실력 향상')
UNION ALL
SELECT
    'K-Pop & 엔터테인먼트 문화',
    'K-Pop과 한국 엔터테인먼트 문화를 탐구하는 강의입니다.',
    65.00,
    95000.00,
    12,
    NULL::uuid,
    'upcoming'
WHERE NOT EXISTS (SELECT 1 FROM public.lectures WHERE title = 'K-Pop & 엔터테인먼트 문화');

-- Insert sample VIP features if table is empty
INSERT INTO public.vip_features (feature_key, feature_name, description, is_active)
SELECT * FROM (VALUES
    ('priority_support', '우선 지원', '고객 지원 우선 처리', true),
    ('unlimited_calls', '무제한 통화', '무제한 화상 통화', true),
    ('premium_content', '프리미엄 콘텐츠', '독점 콘텐츠 접근', true),
    ('early_access', '얼리 액세스', '새 기능 우선 이용', true)
) AS v(feature_key, feature_name, description, is_active)
WHERE NOT EXISTS (SELECT 1 FROM public.vip_features WHERE feature_key = v.feature_key);

-- =====================================================
-- 8. Verification Queries
-- =====================================================

-- You can run these queries to verify the setup:

-- Check if all tables exist
-- SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_name IN ('purchases', 'lectures', 'lecture_enrollments', 'vip_subscriptions', 'vip_features', 'vip_subscription_history', 'coupons', 'coupon_usage');

-- Check RLS status
-- SELECT schemaname, tablename, rowsecurity FROM pg_tables WHERE schemaname = 'public' AND tablename IN ('purchases', 'lectures', 'lecture_enrollments', 'vip_subscriptions', 'coupons');

-- Check constraints
-- SELECT conname, conrelid::regclass, pg_get_constraintdef(oid) FROM pg_constraint WHERE conrelid::regclass::text IN ('public.purchases', 'public.lectures', 'public.lecture_enrollments', 'public.vip_subscriptions', 'public.coupons') ORDER BY conrelid::regclass, conname;

COMMIT;
