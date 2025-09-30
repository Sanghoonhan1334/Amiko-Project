-- 운영진 추가 스크립트 (테이블 생성 후 실행)

-- 1단계: 현재 auth.users에서 운영진 이메일 확인
SELECT id, email, created_at 
FROM auth.users 
WHERE email IN (
  'admin@helloamiko.com',
  'info@helloamiko.com',
  'support@helloamiko.com',
  'news@helloamiko.com'
);

-- 2단계: 운영진 추가 (위에서 확인한 실제 user_id로 교체)
-- 예시: admin@helloamiko.com의 실제 user_id가 'abc123-def456-...'라면
/*
INSERT INTO admin_users (user_id, email, role, permissions) VALUES
  ('실제_admin_user_id', 'admin@helloamiko.com', 'super_admin', '{"all": true}'),
  ('실제_info_user_id', 'info@helloamiko.com', 'admin', '{"news": {"create": true, "edit": true, "delete": true}}'),
  ('실제_support_user_id', 'support@helloamiko.com', 'admin', '{"users": {"view": true, "support": true}}'),
  ('실제_news_user_id', 'news@helloamiko.com', 'news_manager', '{"news": {"create": true, "edit": true, "delete": true}}')
ON CONFLICT (email) DO NOTHING;
*/

-- 3단계: 운영진 목록 확인
SELECT 
  au.id,
  au.email,
  au.role,
  au.permissions,
  au.is_active,
  au.created_at,
  u.email as auth_email
FROM admin_users au
LEFT JOIN auth.users u ON au.user_id = u.id
ORDER BY au.created_at;

-- 4단계: 운영진 권한 수정 예시
/*
UPDATE admin_users 
SET permissions = '{"news": {"create": true, "edit": true, "delete": true}, "users": {"view": true}}'
WHERE email = 'news@helloamiko.com';
*/

-- 5단계: 운영진 비활성화 예시
/*
UPDATE admin_users 
SET is_active = false 
WHERE email = 'support@helloamiko.com';
*/
