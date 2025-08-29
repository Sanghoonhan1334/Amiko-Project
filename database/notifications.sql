-- 알림 시스템 테이블 생성
CREATE TABLE IF NOT EXISTS notifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type VARCHAR(50) NOT NULL CHECK (type IN (
    'booking_created',
    'payment_confirmed', 
    'consultation_reminder',
    'consultation_completed',
    'review_reminder',
    'system'
  )),
  title VARCHAR(200) NOT NULL,
  message TEXT NOT NULL,
  data JSONB DEFAULT '{}',
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  read_at TIMESTAMP WITH TIME ZONE,
  
  -- 인덱스 생성
  CONSTRAINT notifications_user_id_idx UNIQUE (user_id, created_at)
);

-- 알림 읽음 상태 인덱스
CREATE INDEX IF NOT EXISTS idx_notifications_user_read ON notifications(user_id, is_read);

-- 알림 타입별 인덱스
CREATE INDEX IF NOT EXISTS idx_notifications_type ON notifications(type);

-- 알림 생성 시간 인덱스
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at);

-- RLS (Row Level Security) 활성화
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- RLS 정책: 사용자는 자신의 알림만 볼 수 있음
CREATE POLICY "Users can view own notifications" ON notifications
  FOR SELECT USING (auth.uid() = user_id);

-- RLS 정책: 사용자는 자신의 알림만 수정할 수 있음
CREATE POLICY "Users can update own notifications" ON notifications
  FOR UPDATE USING (auth.uid() = user_id);

-- RLS 정책: 시스템에서 알림 생성 가능
CREATE POLICY "System can create notifications" ON notifications
  FOR INSERT WITH CHECK (true);

-- 알림 설정 테이블 (사용자별 알림 설정)
CREATE TABLE IF NOT EXISTS notification_settings (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email_enabled BOOLEAN DEFAULT TRUE,
  push_enabled BOOLEAN DEFAULT TRUE,
  in_app_enabled BOOLEAN DEFAULT TRUE,
  email_types TEXT[] DEFAULT ARRAY[
    'booking_created',
    'payment_confirmed',
    'consultation_reminder',
    'consultation_completed',
    'review_reminder'
  ],
  push_types TEXT[] DEFAULT ARRAY[
    'payment_confirmed',
    'consultation_reminder',
    'consultation_completed'
  ],
  in_app_types TEXT[] DEFAULT ARRAY[
    'booking_created',
    'payment_confirmed',
    'consultation_reminder',
    'consultation_completed',
    'review_reminder',
    'system'
  ],
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS 활성화
ALTER TABLE notification_settings ENABLE ROW LEVEL SECURITY;

-- RLS 정책: 사용자는 자신의 설정만 볼 수 있음
CREATE POLICY "Users can view own notification settings" ON notification_settings
  FOR SELECT USING (auth.uid() = user_id);

-- RLS 정책: 사용자는 자신의 설정만 수정할 수 있음
CREATE POLICY "Users can update own notification settings" ON notification_settings
  FOR UPDATE USING (auth.uid() = user_id);

-- RLS 정책: 사용자는 자신의 설정만 생성할 수 있음
CREATE POLICY "Users can insert own notification settings" ON notification_settings
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 알림 로그 테이블 (알림 전송 기록)
CREATE TABLE IF NOT EXISTS notification_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  notification_id UUID REFERENCES notifications(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type VARCHAR(50) NOT NULL,
  channel VARCHAR(20) NOT NULL CHECK (channel IN ('email', 'push', 'in_app')),
  status VARCHAR(20) NOT NULL CHECK (status IN ('sent', 'failed', 'pending')),
  error_message TEXT,
  sent_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- 인덱스 생성
  CONSTRAINT notification_logs_user_id_idx UNIQUE (user_id, sent_at)
);

-- RLS 활성화
ALTER TABLE notification_logs ENABLE ROW LEVEL SECURITY;

-- RLS 정책: 시스템에서 로그 생성 가능
CREATE POLICY "System can create notification logs" ON notification_logs
  FOR INSERT WITH CHECK (true);

-- RLS 정책: 사용자는 자신의 로그만 볼 수 있음
CREATE POLICY "Users can view own notification logs" ON notification_logs
  FOR SELECT USING (auth.uid() = user_id);

-- 함수: 알림 설정 자동 생성
CREATE OR REPLACE FUNCTION create_notification_settings()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO notification_settings (user_id)
  VALUES (NEW.id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 트리거: 새 사용자 가입 시 알림 설정 자동 생성
CREATE TRIGGER trigger_create_notification_settings
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION create_notification_settings();

-- 함수: 알림 읽음 처리
CREATE OR REPLACE FUNCTION mark_notification_read(notification_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  UPDATE notifications 
  SET is_read = TRUE, read_at = NOW()
  WHERE id = notification_id AND user_id = auth.uid();
  
  RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 함수: 모든 알림 읽음 처리
CREATE OR REPLACE FUNCTION mark_all_notifications_read()
RETURNS INTEGER AS $$
DECLARE
  updated_count INTEGER;
BEGIN
  UPDATE notifications 
  SET is_read = TRUE, read_at = NOW()
  WHERE user_id = auth.uid() AND is_read = FALSE;
  
  GET DIAGNOSTICS updated_count = ROW_COUNT;
  RETURN updated_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
