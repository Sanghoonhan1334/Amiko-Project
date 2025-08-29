-- 푸시 알림 시스템을 위한 데이터베이스 테이블
-- 이 스크립트는 Supabase SQL Editor에서 실행해야 합니다.

-- 1. 푸시 구독 테이블 생성
CREATE TABLE IF NOT EXISTS push_subscriptions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  endpoint TEXT NOT NULL,
  p256dh_key TEXT NOT NULL,
  auth_key TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- 사용자별 엔드포인트는 유일해야 함
  UNIQUE(user_id, endpoint)
);

-- 2. 푸시 알림 로그 테이블 생성
CREATE TABLE IF NOT EXISTS push_notification_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  subscription_id UUID REFERENCES push_subscriptions(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  data JSONB DEFAULT '{}',
  status TEXT NOT NULL DEFAULT 'pending', -- pending, sent, failed, delivered
  sent_at TIMESTAMP WITH TIME ZONE,
  delivered_at TIMESTAMP WITH TIME ZONE,
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. 인덱스 생성 (성능 향상)
CREATE INDEX IF NOT EXISTS idx_push_subscriptions_user_id ON push_subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_push_subscriptions_endpoint ON push_subscriptions(endpoint);
CREATE INDEX IF NOT EXISTS idx_push_notification_logs_user_id ON push_notification_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_push_notification_logs_status ON push_notification_logs(status);
CREATE INDEX IF NOT EXISTS idx_push_notification_logs_created_at ON push_notification_logs(created_at);

-- 4. RLS (Row Level Security) 정책 설정
ALTER TABLE push_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE push_notification_logs ENABLE ROW LEVEL SECURITY;

-- 5. 푸시 구독 테이블 RLS 정책
-- 사용자는 자신의 구독만 조회/수정/삭제 가능
CREATE POLICY "Users can view own push subscriptions" ON push_subscriptions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own push subscriptions" ON push_subscriptions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own push subscriptions" ON push_subscriptions
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own push subscriptions" ON push_subscriptions
  FOR DELETE USING (auth.uid() = user_id);

-- 6. 푸시 알림 로그 테이블 RLS 정책
-- 사용자는 자신의 알림 로그만 조회 가능
CREATE POLICY "Users can view own notification logs" ON push_notification_logs
  FOR SELECT USING (auth.uid() = user_id);

-- 관리자는 모든 알림 로그 조회 가능 (선택사항)
-- CREATE POLICY "Admins can view all notification logs" ON push_notification_logs
--   FOR SELECT USING (auth.uid() IN (SELECT user_id FROM user_roles WHERE role = 'admin'));

-- 7. 컬럼 설명 추가
COMMENT ON TABLE push_subscriptions IS '웹 푸시 알림 구독 정보';
COMMENT ON COLUMN push_subscriptions.user_id IS '사용자 ID';
COMMENT ON COLUMN push_subscriptions.endpoint IS '푸시 서비스 엔드포인트';
COMMENT ON COLUMN push_subscriptions.p256dh_key IS 'P-256 DH 공개키';
COMMENT ON COLUMN push_subscriptions.auth_key IS '인증 키';

COMMENT ON TABLE push_notification_logs IS '푸시 알림 발송 로그';
COMMENT ON COLUMN push_notification_logs.user_id IS '수신자 사용자 ID';
COMMENT ON COLUMN push_notification_logs.subscription_id IS '구독 정보 ID';
COMMENT ON COLUMN push_notification_logs.title IS '알림 제목';
COMMENT ON COLUMN push_notification_logs.body IS '알림 내용';
COMMENT ON COLUMN push_notification_logs.data IS '추가 데이터 (JSON)';
COMMENT ON COLUMN push_notification_logs.status IS '알림 상태';
COMMENT ON COLUMN push_notification_logs.sent_at IS '발송 시간';
COMMENT ON COLUMN push_notification_logs.delivered_at IS '전달 시간';
COMMENT ON COLUMN push_notification_logs.error_message IS '오류 메시지';

-- 8. 함수 생성: 알림 상태 업데이트
CREATE OR REPLACE FUNCTION update_notification_status(
  notification_id UUID,
  new_status TEXT,
  error_msg TEXT DEFAULT NULL
) RETURNS VOID AS $$
BEGIN
  UPDATE push_notification_logs 
  SET 
    status = new_status,
    sent_at = CASE WHEN new_status = 'sent' THEN NOW() ELSE sent_at END,
    delivered_at = CASE WHEN new_status = 'delivered' THEN NOW() ELSE delivered_at END,
    error_message = error_msg,
    updated_at = NOW()
  WHERE id = notification_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 9. 함수 생성: 사용자별 구독 조회
CREATE OR REPLACE FUNCTION get_user_push_subscriptions(user_uuid UUID)
RETURNS TABLE(
  id UUID,
  endpoint TEXT,
  p256dh_key TEXT,
  auth_key TEXT,
  created_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    ps.id,
    ps.endpoint,
    ps.p256dh_key,
    ps.auth_key,
    ps.created_at
  FROM push_subscriptions ps
  WHERE ps.user_id = user_uuid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 10. 테이블 생성 확인
SELECT 
  table_name,
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns 
WHERE table_name IN ('push_subscriptions', 'push_notification_logs')
ORDER BY table_name, ordinal_position;

-- 11. RLS 정책 확인
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual
FROM pg_policies 
WHERE tablename IN ('push_subscriptions', 'push_notification_logs');
