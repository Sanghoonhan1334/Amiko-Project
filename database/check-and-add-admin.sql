-- info@helloamiko.com 관리자 권한 확인 및 추가
-- Check and Add admin for info@helloamiko.com

-- ============================================
-- 1. 현재 admin_users 테이블 확인
-- ============================================

SELECT * FROM admin_users 
WHERE email = 'info@helloamiko.com' OR email ILIKE '%helloamiko%';

-- ============================================
-- 2. info@helloamiko.com의 user_id 찾기
-- ============================================

SELECT id, email, created_at 
FROM auth.users 
WHERE email = 'info@helloamiko.com';

-- ============================================
-- 3. admin_users에 추가 (user_id를 2번 결과에서 확인 후 입력)
-- ============================================

-- 아래 'YOUR_USER_ID_HERE'를 2번 쿼리 결과의 id로 교체하세요
-- 예시:
-- INSERT INTO admin_users (user_id, email, role, permissions, is_active)
-- VALUES (
--   'YOUR_USER_ID_HERE',  -- 2번 쿼리에서 나온 id
--   'info@helloamiko.com',
--   'admin',
--   ARRAY['all'],
--   true
-- );

-- ============================================
-- 4. 또는 이메일로 바로 추가 (user_id 자동 조회)
-- ============================================

DO $$
DECLARE
  v_user_id UUID;
BEGIN
  -- info@helloamiko.com의 user_id 찾기
  SELECT id INTO v_user_id
  FROM auth.users
  WHERE email = 'info@helloamiko.com';

  -- user_id를 찾은 경우에만 admin_users에 추가
  IF v_user_id IS NOT NULL THEN
    -- 이미 존재하는지 확인
    IF NOT EXISTS (
      SELECT 1 FROM admin_users 
      WHERE user_id = v_user_id
    ) THEN
      -- 새로 추가
      INSERT INTO admin_users (user_id, email, role, permissions, is_active)
      VALUES (
        v_user_id,
        'info@helloamiko.com',
        'admin',
        '["all"]'::jsonb,
        true
      );
      RAISE NOTICE 'info@helloamiko.com이 관리자로 추가되었습니다.';
    ELSE
      -- 이미 존재하면 활성화 상태 업데이트
      UPDATE admin_users
      SET is_active = true,
          role = 'admin',
          permissions = '["all"]'::jsonb
      WHERE user_id = v_user_id;
      RAISE NOTICE 'info@helloamiko.com의 관리자 권한이 활성화되었습니다.';
    END IF;
  ELSE
    RAISE NOTICE 'info@helloamiko.com 사용자를 찾을 수 없습니다.';
  END IF;
END $$;

-- ============================================
-- 5. 확인
-- ============================================

SELECT 
  au.*,
  u.email as user_email,
  u.created_at as user_created_at
FROM admin_users au
LEFT JOIN auth.users u ON au.user_id = u.id
WHERE au.email = 'info@helloamiko.com' OR u.email = 'info@helloamiko.com';

