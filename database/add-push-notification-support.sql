-- 앱 완성 후 푸시 알림 지원을 위한 테이블
-- (지금 실행할 필요 없음, 앱이 준비되면 실행)

-- users 테이블에 device_token 컬럼 추가
ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS device_token TEXT,
ADD COLUMN IF NOT EXISTS device_type VARCHAR(10) CHECK (device_type IN ('ios', 'android', 'web'));

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_users_device_token ON public.users(device_token);

-- 푸시 전송 기록 테이블 (선택사항)
CREATE TABLE IF NOT EXISTS public.push_notification_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
    notification_id UUID REFERENCES public.notifications(id) ON DELETE CASCADE,
    device_token TEXT NOT NULL,
    success BOOLEAN DEFAULT FALSE,
    error_message TEXT,
    sent_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_push_logs_user_id ON public.push_notification_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_push_logs_notification_id ON public.push_notification_logs(notification_id);

-- RLS 정책 설정
ALTER TABLE public.push_notification_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own push logs" ON public.push_notification_logs
    FOR SELECT USING (auth.uid() = user_id);

