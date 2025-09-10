-- =====================================================
-- 알림 테이블 (Notifications Table)
-- Description: 사용자 알림을 관리하는 테이블
-- Date: 2024-12-19
-- =====================================================

-- 1. 알림 테이블 (Notifications Table)
CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    type TEXT NOT NULL CHECK (type IN (
        'booking_confirmed', 
        'booking_cancelled', 
        'booking_reminder', 
        'payment_completed', 
        'payment_failed', 
        'payment_refunded',
        'review_received',
        'system_announcement',
        'coupon_received',
        'vip_subscription',
        'community_mention',
        'community_reaction',
        'consultant_available',
        'ako_earned',
        'general'
    )),
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    data JSONB DEFAULT '{}', -- 추가 데이터 (예: 예약 ID, 결제 ID 등)
    is_read BOOLEAN DEFAULT FALSE,
    read_at TIMESTAMP WITH TIME ZONE, -- 읽은 시간
    priority TEXT DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
    expires_at TIMESTAMP WITH TIME ZONE, -- 만료 시간 (선택적)
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_type ON public.notifications(type);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON public.notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_priority ON public.notifications(priority);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON public.notifications(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_expires_at ON public.notifications(expires_at);

-- 복합 인덱스 (자주 함께 조회되는 필드들)
CREATE INDEX IF NOT EXISTS idx_notifications_user_read ON public.notifications(user_id, is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_user_type ON public.notifications(user_id, type);
CREATE INDEX IF NOT EXISTS idx_notifications_user_priority ON public.notifications(user_id, priority);

-- JSONB 인덱스 (데이터 검색용)
CREATE INDEX IF NOT EXISTS idx_notifications_data ON public.notifications USING GIN(data);

-- 3. RLS 활성화
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- 4. RLS 정책 생성
-- 사용자는 자신의 알림만 볼 수 있음
CREATE POLICY "Users can view own notifications" ON public.notifications
    FOR SELECT USING (auth.uid() = user_id);

-- 사용자는 자신의 알림을 업데이트할 수 있음 (읽음 처리 등)
CREATE POLICY "Users can update own notifications" ON public.notifications
    FOR UPDATE USING (auth.uid() = user_id);

-- 시스템은 모든 사용자에게 알림을 생성할 수 있음
CREATE POLICY "System can create notifications" ON public.notifications
    FOR INSERT WITH CHECK (true);

-- 관리자는 모든 알림을 관리할 수 있음
CREATE POLICY "Admins can manage all notifications" ON public.notifications
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE public.users.id = auth.uid() 
            AND public.users.is_admin = true
        )
    );

-- 5. 알림 생성 함수
CREATE OR REPLACE FUNCTION create_notification(
    target_user_id UUID,
    notification_type TEXT,
    notification_title TEXT,
    notification_message TEXT,
    notification_data JSONB DEFAULT '{}',
    notification_priority TEXT DEFAULT 'normal',
    notification_expires_at TIMESTAMP WITH TIME ZONE DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
    notification_id UUID;
BEGIN
    -- 알림 생성
    INSERT INTO public.notifications (
        user_id,
        type,
        title,
        message,
        data,
        priority,
        expires_at
    ) VALUES (
        target_user_id,
        notification_type,
        notification_title,
        notification_message,
        notification_data,
        notification_priority,
        notification_expires_at
    ) RETURNING id INTO notification_id;
    
    RETURN notification_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. 알림 읽음 처리 함수
CREATE OR REPLACE FUNCTION mark_notification_read(
    notification_uuid UUID,
    user_uuid UUID DEFAULT NULL
)
RETURNS BOOLEAN AS $$
BEGIN
    -- 사용자 ID가 제공되지 않은 경우 현재 인증된 사용자 사용
    IF user_uuid IS NULL THEN
        user_uuid := auth.uid();
    END IF;
    
    -- 알림 읽음 처리
    UPDATE public.notifications
    SET 
        is_read = TRUE,
        read_at = NOW()
    WHERE id = notification_uuid 
        AND user_id = user_uuid
        AND is_read = FALSE;
    
    RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 7. 사용자별 읽지 않은 알림 수 조회 함수
CREATE OR REPLACE FUNCTION get_unread_notification_count(
    user_uuid UUID DEFAULT NULL
)
RETURNS INTEGER AS $$
DECLARE
    unread_count INTEGER;
BEGIN
    -- 사용자 ID가 제공되지 않은 경우 현재 인증된 사용자 사용
    IF user_uuid IS NULL THEN
        user_uuid := auth.uid();
    END IF;
    
    -- 읽지 않은 알림 수 조회
    SELECT COUNT(*) INTO unread_count
    FROM public.notifications
    WHERE user_id = user_uuid 
        AND is_read = FALSE
        AND (expires_at IS NULL OR expires_at > NOW());
    
    RETURN COALESCE(unread_count, 0);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 8. 알림 정리 함수 (만료된 알림 삭제)
CREATE OR REPLACE FUNCTION cleanup_expired_notifications()
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    -- 만료된 알림 삭제
    DELETE FROM public.notifications
    WHERE expires_at IS NOT NULL 
        AND expires_at < NOW();
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 9. 알림 통계 조회 함수
CREATE OR REPLACE FUNCTION get_notification_stats(
    user_uuid UUID DEFAULT NULL,
    start_date TIMESTAMP WITH TIME ZONE DEFAULT NULL,
    end_date TIMESTAMP WITH TIME ZONE DEFAULT NULL
)
RETURNS TABLE (
    total_notifications BIGINT,
    unread_notifications BIGINT,
    read_notifications BIGINT,
    notifications_by_type JSONB
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COUNT(*) as total_notifications,
        COUNT(*) FILTER (WHERE is_read = FALSE) as unread_notifications,
        COUNT(*) FILTER (WHERE is_read = TRUE) as read_notifications,
        jsonb_object_agg(type, type_count) as notifications_by_type
    FROM (
        SELECT 
            type,
            COUNT(*) as type_count
        FROM public.notifications
        WHERE (user_uuid IS NULL OR user_id = user_uuid)
            AND (start_date IS NULL OR created_at >= start_date)
            AND (end_date IS NULL OR created_at <= end_date)
        GROUP BY type
    ) type_stats;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 10. 알림 설정 테이블 (사용자별 알림 설정)
CREATE TABLE IF NOT EXISTS public.notification_settings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE UNIQUE,
    email_notifications BOOLEAN DEFAULT TRUE,
    push_notifications BOOLEAN DEFAULT TRUE,
    booking_reminders BOOLEAN DEFAULT TRUE,
    marketing_emails BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 알림 설정 인덱스
CREATE INDEX IF NOT EXISTS idx_notification_settings_user_id ON public.notification_settings(user_id);

-- 알림 설정 RLS 활성화
ALTER TABLE public.notification_settings ENABLE ROW LEVEL SECURITY;

-- 알림 설정 정책
CREATE POLICY "Users can manage own notification settings" ON public.notification_settings
    FOR ALL USING (auth.uid() = user_id);

-- 알림 설정 업데이트 트리거
CREATE TRIGGER update_notification_settings_updated_at 
    BEFORE UPDATE ON public.notification_settings
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- 11. 알림 설정 기본값 생성 함수
CREATE OR REPLACE FUNCTION create_default_notification_settings(
    user_uuid UUID
)
RETURNS UUID AS $$
DECLARE
    settings_id UUID;
BEGIN
    -- 기본 알림 설정 생성
    INSERT INTO public.notification_settings (
        user_id,
        email_notifications,
        push_notifications,
        booking_reminders,
        marketing_emails
    ) VALUES (
        user_uuid,
        TRUE,  -- 이메일 알림
        TRUE,  -- 푸시 알림
        TRUE,  -- 예약 알림
        FALSE  -- 마케팅 이메일
    ) RETURNING id INTO settings_id;
    
    RETURN settings_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 12. 사용자 생성 시 기본 알림 설정 생성 트리거
CREATE OR REPLACE FUNCTION create_user_notification_settings()
RETURNS TRIGGER AS $$
BEGIN
    -- 새 사용자 생성 시 기본 알림 설정 생성
    PERFORM create_default_notification_settings(NEW.id);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 사용자 테이블에 트리거 적용
CREATE TRIGGER create_notification_settings_trigger
    AFTER INSERT ON public.users
    FOR EACH ROW 
    EXECUTE FUNCTION create_user_notification_settings();

-- 13. 샘플 데이터 (테스트용)
-- INSERT INTO public.notifications (
--     user_id,
--     type,
--     title,
--     message,
--     data,
--     priority
-- ) VALUES 
-- (
--     '00000000-0000-0000-0000-000000000001',
--     'system_announcement',
--     'Amiko 서비스 오픈',
--     'Amiko 서비스가 정식 오픈되었습니다!',
--     '{"announcement_id": "001"}'::jsonb,
--     'high'
-- );

-- =====================================================
-- 추가 설명
-- =====================================================

/*
알림 테이블 필드 설명:

1. id: 알림 고유 ID (UUID)
2. user_id: 사용자 테이블 참조 (CASCADE 삭제)
3. type: 알림 타입 (booking_confirmed, payment_completed 등)
4. title: 알림 제목
5. message: 알림 메시지
6. data: 추가 데이터 (JSONB)
7. is_read: 읽음 여부 (기본값: FALSE)
8. read_at: 읽은 시간
9. priority: 우선순위 (low, normal, high, urgent)
10. expires_at: 만료 시간 (선택적)
11. created_at: 생성 시간

알림 설정 테이블 필드 설명:

1. id: 설정 고유 ID (UUID)
2. user_id: 사용자 테이블 참조 (CASCADE 삭제, 고유값)
3. email_notifications: 이메일 알림 설정
4. push_notifications: 푸시 알림 설정
5. booking_reminders: 예약 알림 설정
6. marketing_emails: 마케팅 이메일 설정
7. created_at: 생성 시간
8. updated_at: 수정 시간

RLS 정책:
- 사용자는 자신의 알림만 조회/수정 가능
- 시스템은 모든 사용자에게 알림 생성 가능
- 관리자는 모든 알림 관리 가능

함수:
- create_notification(): 알림 생성
- mark_notification_read(): 알림 읽음 처리
- get_unread_notification_count(): 읽지 않은 알림 수 조회
- cleanup_expired_notifications(): 만료된 알림 정리
- get_notification_stats(): 알림 통계 조회
- create_default_notification_settings(): 기본 알림 설정 생성

트리거:
- 사용자 생성 시 기본 알림 설정 자동 생성

알림 타입:
- booking_confirmed: 예약 확정
- booking_cancelled: 예약 취소
- booking_reminder: 예약 알림
- payment_completed: 결제 완료
- payment_failed: 결제 실패
- payment_refunded: 환불 완료
- review_received: 후기 수신
- system_announcement: 시스템 공지
- coupon_received: 쿠폰 수신
- vip_subscription: VIP 구독
- community_mention: 커뮤니티 멘션
- community_reaction: 커뮤니티 반응
- consultant_available: 상담사 이용 가능
- ako_earned: AKO 획득
- general: 일반 알림
*/
