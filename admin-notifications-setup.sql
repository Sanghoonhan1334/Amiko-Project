-- 관리자 알림 시스템 구축 스크립트
-- 이 스크립트는 Supabase SQL Editor에서 실행해야 합니다.

-- 1. 관리자 알림 테이블 생성
CREATE TABLE IF NOT EXISTS admin_notifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  type TEXT NOT NULL, -- 'new_booking', 'payment_completed', 'payment_failed', 'consultation_reminder', 'system_alert'
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  data JSONB, -- 추가 데이터 (예약 ID, 결제 정보 등)
  priority TEXT DEFAULT 'normal', -- 'low', 'normal', 'high', 'urgent'
  is_read BOOLEAN DEFAULT false,
  read_by UUID REFERENCES auth.users(id), -- 읽은 관리자
  read_at TIMESTAMP WITH TIME ZONE,
  target_roles TEXT[], -- 알림을 받을 역할들 ['admin', 'manager']
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE -- 알림 만료 시간 (선택사항)
);

-- 2. 관리자 알림 설정 테이블 생성
CREATE TABLE IF NOT EXISTS admin_notification_settings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  notification_type TEXT NOT NULL,
  email_enabled BOOLEAN DEFAULT true,
  push_enabled BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- 한 사용자당 한 타입의 설정만 가질 수 있음
  UNIQUE(user_id, notification_type)
);

-- 3. 인덱스 생성 (성능 향상)
CREATE INDEX IF NOT EXISTS idx_admin_notifications_type ON admin_notifications(type);
CREATE INDEX IF NOT EXISTS idx_admin_notifications_priority ON admin_notifications(priority);
CREATE INDEX IF NOT EXISTS idx_admin_notifications_created_at ON admin_notifications(created_at);
CREATE INDEX IF NOT EXISTS idx_admin_notifications_is_read ON admin_notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_admin_notifications_target_roles ON admin_notifications USING GIN(target_roles);

CREATE INDEX IF NOT EXISTS idx_admin_notification_settings_user_id ON admin_notification_settings(user_id);
CREATE INDEX IF NOT EXISTS idx_admin_notification_settings_type ON admin_notification_settings(notification_type);

-- 4. RLS (Row Level Security) 정책 설정
ALTER TABLE admin_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_notification_settings ENABLE ROW LEVEL SECURITY;

-- 관리자 알림 조회 정책
CREATE POLICY "Admins can view admin notifications" ON admin_notifications
  FOR SELECT USING (
    auth.uid() IN (
      SELECT user_id FROM user_roles WHERE role IN ('admin', 'manager')
    )
  );

-- 관리자 알림 생성 정책 (시스템에서만)
CREATE POLICY "System can create admin notifications" ON admin_notifications
  FOR INSERT WITH CHECK (true);

-- 관리자 알림 수정 정책 (읽음 상태 업데이트)
CREATE POLICY "Admins can update own read status" ON admin_notifications
  FOR UPDATE USING (
    auth.uid() IN (
      SELECT user_id FROM user_roles WHERE role IN ('admin', 'manager')
    )
  );

-- 알림 설정 조회/수정 정책
CREATE POLICY "Users can manage own notification settings" ON admin_notification_settings
  FOR ALL USING (auth.uid() = user_id);

-- 5. 컬럼 설명 추가
COMMENT ON TABLE admin_notifications IS '관리자 알림 및 시스템 메시지';
COMMENT ON COLUMN admin_notifications.type IS '알림 타입: new_booking, payment_completed, payment_failed, consultation_reminder, system_alert';
COMMENT ON COLUMN admin_notifications.priority IS '알림 우선순위: low, normal, high, urgent';
COMMENT ON COLUMN admin_notifications.data IS '추가 데이터 (JSON 형태)';
COMMENT ON COLUMN admin_notifications.target_roles IS '알림을 받을 역할들 배열';

COMMENT ON TABLE admin_notification_settings IS '관리자 알림 설정 (이메일/푸시 활성화 여부)';

-- 6. 함수 생성: 관리자 알림 생성
CREATE OR REPLACE FUNCTION create_admin_notification(
  notification_type TEXT,
  notification_title TEXT,
  notification_message TEXT,
  notification_data JSONB DEFAULT NULL,
  notification_priority TEXT DEFAULT 'normal',
  target_roles_array TEXT[] DEFAULT ARRAY['admin']
)
RETURNS UUID AS $$
DECLARE
  notification_id UUID;
BEGIN
  INSERT INTO admin_notifications (
    type, title, message, data, priority, target_roles
  ) VALUES (
    notification_type,
    notification_title,
    notification_message,
    notification_data,
    notification_priority,
    target_roles_array
  ) RETURNING id INTO notification_id;
  
  RETURN notification_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 7. 함수 생성: 관리자 알림 읽음 처리
CREATE OR REPLACE FUNCTION mark_admin_notification_read(
  notification_uuid UUID,
  admin_user_id UUID
)
RETURNS BOOLEAN AS $$
BEGIN
  UPDATE admin_notifications 
  SET is_read = true, read_by = admin_user_id, read_at = NOW()
  WHERE id = notification_uuid;
  
  RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 8. 함수 생성: 관리자 알림 일괄 읽음 처리
CREATE OR REPLACE FUNCTION mark_all_admin_notifications_read(
  admin_user_id UUID,
  notification_types TEXT[] DEFAULT NULL
)
RETURNS INTEGER AS $$
DECLARE
  updated_count INTEGER;
BEGIN
  UPDATE admin_notifications 
  SET is_read = true, read_by = admin_user_id, read_at = NOW()
  WHERE is_read = false 
    AND (notification_types IS NULL OR type = ANY(notification_types))
    AND target_roles && (
      SELECT ARRAY_AGG(role) FROM user_roles WHERE user_id = admin_user_id
    );
  
  GET DIAGNOSTICS updated_count = ROW_COUNT;
  RETURN updated_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 9. 함수 생성: 관리자 알림 정리 (만료된 알림 삭제)
CREATE OR REPLACE FUNCTION cleanup_expired_admin_notifications()
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM admin_notifications 
  WHERE expires_at IS NOT NULL AND expires_at < NOW();
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 10. 기본 알림 설정 데이터 삽입 (관리자 역할을 가진 사용자들)
INSERT INTO admin_notification_settings (user_id, notification_type, email_enabled, push_enabled)
SELECT 
  ur.user_id,
  unnest(ARRAY['new_booking', 'payment_completed', 'payment_failed', 'consultation_reminder', 'system_alert']),
  true,
  true
FROM user_roles ur
WHERE ur.role IN ('admin', 'manager')
ON CONFLICT (user_id, notification_type) DO NOTHING;

-- 11. 테이블 생성 확인
SELECT table_name, column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name IN ('admin_notifications', 'admin_notification_settings') 
ORDER BY table_name, ordinal_position;

-- 12. RLS 정책 확인
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE tablename IN ('admin_notifications', 'admin_notification_settings');

-- 13. 함수 확인
SELECT routine_name, routine_type, data_type 
FROM information_schema.routines 
WHERE routine_name LIKE '%admin_notification%';

-- 개발 단계에서 RLS 정책을 임시로 비활성화하는 스크립트
-- ⚠️ 주의: 프로덕션에서는 사용하지 마세요!
-- ALTER TABLE admin_notifications DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE admin_notification_settings DISABLE ROW LEVEL SECURITY;
