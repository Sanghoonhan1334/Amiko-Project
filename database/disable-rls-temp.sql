-- 개발 단계에서 RLS 정책을 임시로 비활성화하는 스크립트
-- ⚠️ 주의: 프로덕션에서는 사용하지 마세요!

-- 1. RLS 정책 비활성화
ALTER TABLE push_subscriptions DISABLE ROW LEVEL SECURITY;
ALTER TABLE push_notification_logs DISABLE ROW LEVEL SECURITY;

-- 2. 현재 RLS 정책 상태 확인
SELECT 
  schemaname,
  tablename,
  rowsecurity
FROM pg_tables 
WHERE tablename IN ('push_subscriptions', 'push_notification_logs');

-- 3. 테이블에 직접 데이터 삽입 테스트
-- INSERT INTO push_subscriptions (user_id, endpoint, p256dh_key, auth_key) 
-- VALUES ('test-user-id', 'test-endpoint', 'test-p256dh', 'test-auth');

-- 4. 프로덕션 배포 시 RLS 재활성화 방법:
-- ALTER TABLE push_subscriptions ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE push_notification_logs ENABLE ROW LEVEL SECURITY;
