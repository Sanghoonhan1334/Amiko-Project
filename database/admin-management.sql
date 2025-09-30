-- 운영진 관리 스크립트
-- 실제 사용자 ID로 운영진 추가하는 방법

-- 1. 먼저 auth.users에서 운영진 이메일의 실제 user_id를 확인
SELECT id, email, created_at 
FROM auth.users 
WHERE email IN (
  'admin@helloamiko.com',
  'info@helloamiko.com',
  'support@helloamiko.com',
  'news@helloamiko.com'
);

-- 2. 실제 user_id로 운영진 추가 (위에서 확인한 ID로 교체)
-- 예시: admin@helloamiko.com의 실제 user_id가 'abc123...'라면
INSERT INTO admin_users (user_id, email, role, permissions) VALUES
  ('실제_user_id_1', 'admin@helloamiko.com', 'super_admin', '{"all": true}'),
  ('실제_user_id_2', 'info@helloamiko.com', 'admin', '{"news": {"create": true, "edit": true, "delete": true}}'),
  ('실제_user_id_3', 'support@helloamiko.com', 'admin', '{"users": {"view": true, "support": true}}'),
  ('실제_user_id_4', 'news@helloamiko.com', 'news_manager', '{"news": {"create": true, "edit": true, "delete": true}}')
ON CONFLICT (email) DO NOTHING;

-- 3. 운영진 목록 확인
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

-- 4. 운영진 권한 수정 예시
-- UPDATE admin_users 
-- SET permissions = '{"news": {"create": true, "edit": true, "delete": true}, "users": {"view": true}}'
-- WHERE email = 'news@helloamiko.com';

-- 5. 운영진 비활성화 예시
-- UPDATE admin_users 
-- SET is_active = false 
-- WHERE email = 'support@helloamiko.com';

-- 6. 운영진 삭제 예시 (주의: 실제로는 비활성화 권장)
-- DELETE FROM admin_users WHERE email = 'old-admin@helloamiko.com';
