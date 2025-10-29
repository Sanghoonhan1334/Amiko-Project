-- 알림 시스템을 위한 테이블 생성

-- 알림 테이블
CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
    type VARCHAR(50) NOT NULL, -- 'booking_request', 'booking_approved', 'booking_rejected', 'schedule_confirmed' 등
    title VARCHAR(200) NOT NULL,
    message TEXT NOT NULL,
    related_id UUID, -- 관련 엔티티 ID (예: booking_request_id)
    is_read BOOLEAN DEFAULT FALSE,
    device_token TEXT, -- 푸시 알림 토큰 (앱 완성 후 사용)
    push_sent BOOLEAN DEFAULT FALSE, -- 푸시 전송 여부
    email_sent BOOLEAN DEFAULT FALSE, -- 이메일 전송 여부
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS 정책 설정
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- 기존 정책 삭제 (재실행 시 오류 방지)
DROP POLICY IF EXISTS "Users can view their own notifications" ON public.notifications;
DROP POLICY IF EXISTS "Users can update their own notifications" ON public.notifications;
DROP POLICY IF EXISTS "Users can insert their own notifications" ON public.notifications;

-- RLS 정책
CREATE POLICY "Users can view their own notifications" ON public.notifications
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own notifications" ON public.notifications
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own notifications" ON public.notifications
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 알림 생성 함수
CREATE OR REPLACE FUNCTION create_notification(
    p_user_id UUID,
    p_type VARCHAR,
    p_title VARCHAR,
    p_message TEXT,
    p_related_id UUID DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_notification_id UUID;
BEGIN
    INSERT INTO public.notifications (
        user_id,
        type,
        title,
        message,
        related_id
    ) VALUES (
        p_user_id,
        p_type,
        p_title,
        p_message,
        p_related_id
    )
    RETURNING id INTO v_notification_id;
    
    RETURN v_notification_id;
END;
$$;

-- 읽지 않은 알림 개수 조회 함수
CREATE OR REPLACE FUNCTION get_unread_notification_count(p_user_id UUID)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO v_count
    FROM public.notifications
    WHERE user_id = p_user_id AND is_read = FALSE;
    
    RETURN COALESCE(v_count, 0);
END;
$$;

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON public.notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON public.notifications(created_at);

