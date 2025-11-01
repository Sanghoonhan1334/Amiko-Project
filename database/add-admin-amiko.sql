-- admin@amiko.com을 관리자로 추가

-- 1단계: auth.users에서 admin@amiko.com의 실제 user_id 확인
SELECT id, email, created_at 
FROM auth.users 
WHERE email = 'admin@amiko.com';

-- 2단계: users 테이블에 is_admin = true 설정
UPDATE users 
SET is_admin = true 
WHERE email = 'admin@amiko.com';

-- 3단계: admin_users 테이블에도 추가 (존재하는 경우)
-- 먼저 user_id를 변수로 가져오기
DO $$
DECLARE
  admin_user_id UUID;
BEGIN
  -- admin@amiko.com의 user_id 가져오기
  SELECT id INTO admin_user_id
  FROM auth.users
  WHERE email = 'admin@amiko.com';
  
  -- admin_users 테이블이 존재하면 추가
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'admin_users') THEN
    INSERT INTO admin_users (user_id, email, role, permissions, is_active)
    VALUES (admin_user_id, 'admin@amiko.com', 'super_admin', '{"all": true}', true)
    ON CONFLICT (email) DO UPDATE 
    SET is_active = true, 
        role = 'super_admin',
        permissions = '{"all": true}',
        updated_at = NOW();
  END IF;
END $$;

-- 4단계: 확인
SELECT 
  u.id,
  u.email,
  u.is_admin,
  au.role,
  au.is_active
FROM users u
LEFT JOIN admin_users au ON u.id = au.user_id
WHERE u.email = 'admin@amiko.com';

