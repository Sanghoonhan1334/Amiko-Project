-- notification_settings 테이블 RLS 정책 수정
-- 이 파일을 Supabase SQL Editor에서 실행하세요

-- 1. 기존 정책 확인
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd
FROM pg_policies 
WHERE tablename = 'notification_settings';

-- 2. RLS 상태 확인
SELECT 
  schemaname,
  tablename,
  rowsecurity
FROM pg_tables 
WHERE tablename = 'notification_settings';

-- 3. 기존 정책 삭제 (있다면)
DROP POLICY IF EXISTS "Users can view own notification settings" ON notification_settings;
DROP POLICY IF EXISTS "Users can update own notification settings" ON notification_settings;
DROP POLICY IF EXISTS "Users can insert own notification settings" ON notification_settings;
DROP POLICY IF EXISTS "Enable read access for all users" ON notification_settings;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON notification_settings;
DROP POLICY IF EXISTS "Enable update for users based on user_id" ON notification_settings;

-- 4. RLS 비활성화 (테스트용)
ALTER TABLE notification_settings DISABLE ROW LEVEL SECURITY;

-- 5. 테스트 데이터 삽입
INSERT INTO notification_settings (
  user_id,
  email_enabled,
  push_enabled,
  in_app_enabled,
  email_types,
  push_types,
  in_app_types
) VALUES (
  '51c2700d-611e-4875-ac7a-29f3e62dbd94',
  true,
  true,
  true,
  ARRAY['booking_created', 'payment_confirmed', 'consultation_reminder'],
  ARRAY['payment_confirmed', 'consultation_reminder'],
  ARRAY['booking_created', 'payment_confirmed', 'consultation_reminder', 'system']
) ON CONFLICT (user_id) DO UPDATE SET
  updated_at = NOW();

-- 6. 데이터 확인
SELECT * FROM notification_settings WHERE user_id = '51c2700d-611e-4875-ac7a-29f3e62dbd94';

-- 7. 완료 메시지
SELECT 'notification_settings 테이블 RLS 정책이 수정되고 테스트 데이터가 삽입되었습니다!' as message;
