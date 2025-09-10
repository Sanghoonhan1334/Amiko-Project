-- notification_settings 테이블만 생성 (빠른 해결용)
-- 이 파일을 Supabase SQL Editor에서 실행하세요

-- notification_settings 테이블 생성
CREATE TABLE IF NOT EXISTS notification_settings (
  user_id UUID PRIMARY KEY,
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

-- 기본 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_notification_settings_user_id ON notification_settings(user_id);

-- 완료 메시지
SELECT 'notification_settings 테이블이 성공적으로 생성되었습니다!' as message;
