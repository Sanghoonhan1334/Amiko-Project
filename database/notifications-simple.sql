-- 간단한 알림 시스템 테이블 생성 (테스트용)
-- 이 파일을 Supabase SQL Editor에서 실행하세요

-- 1. notifications 테이블
CREATE TABLE IF NOT EXISTS notifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  type VARCHAR(50) NOT NULL,
  title VARCHAR(200) NOT NULL,
  message TEXT NOT NULL,
  data JSONB DEFAULT '{}',
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  read_at TIMESTAMP WITH TIME ZONE
);

-- 2. notification_settings 테이블
CREATE TABLE IF NOT EXISTS notification_settings (
  user_id UUID PRIMARY KEY,
  email_enabled BOOLEAN DEFAULT TRUE,
  push_enabled BOOLEAN DEFAULT TRUE,
  in_app_enabled BOOLEAN DEFAULT TRUE,
  email_types TEXT[] DEFAULT ARRAY['booking_created', 'payment_confirmed', 'consultation_reminder'],
  push_types TEXT[] DEFAULT ARRAY['payment_confirmed', 'consultation_reminder'],
  in_app_types TEXT[] DEFAULT ARRAY['booking_created', 'payment_confirmed', 'consultation_reminder', 'system'],
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. notification_logs 테이블
CREATE TABLE IF NOT EXISTS notification_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  notification_id UUID,
  user_id UUID NOT NULL,
  type VARCHAR(50) NOT NULL,
  channel VARCHAR(20) NOT NULL,
  status VARCHAR(20) NOT NULL,
  error_message TEXT,
  sent_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. 기본 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON notifications(user_id, is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at);

-- 5. 테스트 데이터 삽입 (선택사항)
-- INSERT INTO notification_settings (user_id) VALUES ('51c2700d-611e-4875-ac7a-29f3e62dbd94');

-- 완료 메시지
SELECT '알림 시스템 테이블이 성공적으로 생성되었습니다!' as message;
