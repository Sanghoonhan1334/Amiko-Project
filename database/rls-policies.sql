-- Row Level Security (RLS) 정책 - 데이터 보안 정책
-- PayPal 전용 Amiko Project

-- RLS 활성화 (조건부)
DO $$
BEGIN
    -- users 테이블 RLS 활성화
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'users' AND table_schema = 'public') THEN
        ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
    END IF;
    
    -- consultants 테이블 RLS 활성화
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'consultants' AND table_schema = 'public') THEN
        ALTER TABLE public.consultants ENABLE ROW LEVEL SECURITY;
    END IF;
    
    -- bookings 테이블 RLS 활성화
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'bookings' AND table_schema = 'public') THEN
        ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;
    END IF;
    
    -- payments 테이블 RLS 활성화
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'payments' AND table_schema = 'public') THEN
        ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
    END IF;
    
    -- notifications 테이블 RLS 활성화
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'notifications' AND table_schema = 'public') THEN
        ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
    END IF;
    
    -- notification_settings 테이블 RLS 활성화
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'notification_settings' AND table_schema = 'public') THEN
        ALTER TABLE public.notification_settings ENABLE ROW LEVEL SECURITY;
    END IF;
    
    -- reviews 테이블 RLS 활성화
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'reviews' AND table_schema = 'public') THEN
        ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
    END IF;
    
    -- coupons 테이블 RLS 활성화
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'coupons' AND table_schema = 'public') THEN
        ALTER TABLE public.coupons ENABLE ROW LEVEL SECURITY;
    END IF;
    
    -- vip_subscriptions 테이블 RLS 활성화
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'vip_subscriptions' AND table_schema = 'public') THEN
        ALTER TABLE public.vip_subscriptions ENABLE ROW LEVEL SECURITY;
    END IF;
END $$;

-- 1. 사용자 테이블 정책 (Users Table Policies)
CREATE POLICY "Users can view own profile" ON public.users
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.users
    FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON public.users
    FOR INSERT WITH CHECK (auth.uid() = id);

-- 2. 상담사 테이블 정책 (Consultants Table Policies)
CREATE POLICY "Anyone can view active consultants" ON public.consultants
    FOR SELECT USING (is_active = true);

CREATE POLICY "Consultants can update own profile" ON public.consultants
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Consultants can insert own profile" ON public.consultants
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 3. 예약 테이블 정책 (Bookings Table Policies)
CREATE POLICY "Users can view own bookings" ON public.bookings
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Consultants can view their bookings" ON public.bookings
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.consultants 
            WHERE consultants.id = bookings.consultant_id 
            AND consultants.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can create bookings" ON public.bookings
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own bookings" ON public.bookings
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Consultants can update their bookings" ON public.bookings
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM public.consultants 
            WHERE consultants.id = bookings.consultant_id 
            AND consultants.user_id = auth.uid()
        )
    );

-- 4. 결제 테이블 정책 (Payments Table Policies)
CREATE POLICY "Users can view own payments" ON public.payments
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "System can insert payments" ON public.payments
    FOR INSERT WITH CHECK (true);

CREATE POLICY "System can update payments" ON public.payments
    FOR UPDATE USING (true);

-- 5. 알림 테이블 정책 (Notifications Table Policies)
CREATE POLICY "Users can view own notifications" ON public.notifications
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own notifications" ON public.notifications
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "System can insert notifications" ON public.notifications
    FOR INSERT WITH CHECK (true);

-- 6. 알림설정 테이블 정책 (Notification Settings Table Policies)
CREATE POLICY "Users can view own notification settings" ON public.notification_settings
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own notification settings" ON public.notification_settings
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own notification settings" ON public.notification_settings
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 7. 후기 테이블 정책 (Reviews Table Policies)
CREATE POLICY "Anyone can view public reviews" ON public.reviews
    FOR SELECT USING (is_public = true);

CREATE POLICY "Users can view own reviews" ON public.reviews
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create reviews for their bookings" ON public.reviews
    FOR INSERT WITH CHECK (
        auth.uid() = user_id AND
        EXISTS (
            SELECT 1 FROM public.bookings 
            WHERE bookings.id = reviews.booking_id 
            AND bookings.user_id = auth.uid()
            AND bookings.status = 'completed'
        )
    );

CREATE POLICY "Users can update own reviews" ON public.reviews
    FOR UPDATE USING (auth.uid() = user_id);

-- 8. 쿠폰 테이블 정책 (Coupons Table Policies)
CREATE POLICY "Users can view own coupons" ON public.coupons
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "System can insert coupons" ON public.coupons
    FOR INSERT WITH CHECK (true);

CREATE POLICY "System can update coupons" ON public.coupons
    FOR UPDATE USING (true);

-- 9. VIP구독 테이블 정책 (VIP Subscriptions Table Policies)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'vip_subscriptions' AND table_schema = 'public') THEN
        -- Users can view own VIP subscription
        IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can view own VIP subscription' AND tablename = 'vip_subscriptions') THEN
            CREATE POLICY "Users can view own VIP subscription" ON public.vip_subscriptions
                FOR SELECT USING (auth.uid() = user_id);
        END IF;
        
        -- System can insert VIP subscriptions
        IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'System can insert VIP subscriptions' AND tablename = 'vip_subscriptions') THEN
            CREATE POLICY "System can insert VIP subscriptions" ON public.vip_subscriptions
                FOR INSERT WITH CHECK (true);
        END IF;
        
        -- System can update VIP subscriptions
        IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'System can update VIP subscriptions' AND tablename = 'vip_subscriptions') THEN
            CREATE POLICY "System can update VIP subscriptions" ON public.vip_subscriptions
                FOR UPDATE USING (true);
        END IF;
    END IF;
END $$;

-- 관리자 정책 (Admin Policies) - is_admin = true인 사용자
CREATE POLICY "Admins can view all data" ON public.users
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE users.id = auth.uid() 
            AND users.is_admin = true
        )
    );

CREATE POLICY "Admins can view all consultants" ON public.consultants
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE users.id = auth.uid() 
            AND users.is_admin = true
        )
    );

CREATE POLICY "Admins can view all bookings" ON public.bookings
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE users.id = auth.uid() 
            AND users.is_admin = true
        )
    );

CREATE POLICY "Admins can view all payments" ON public.payments
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE users.id = auth.uid() 
            AND users.is_admin = true
        )
    );

CREATE POLICY "Admins can update consultants" ON public.consultants
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE users.id = auth.uid() 
            AND users.is_admin = true
        )
    );

CREATE POLICY "Admins can update bookings" ON public.bookings
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE users.id = auth.uid() 
            AND users.is_admin = true
        )
    );
