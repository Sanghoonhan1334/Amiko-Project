-- 사용자 닉네임 확인

-- 1. users 테이블 구조 확인
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'users'
ORDER BY ordinal_position;

-- 2. 현재 로그인한 사용자 정보 확인 (운영자 계정)
SELECT 
  id,
  email,
  full_name,
  nickname,
  CASE 
    WHEN nickname IS NOT NULL AND nickname != '' THEN 'nickname 있음'
    ELSE 'nickname 없음'
  END as nickname_status
FROM users
WHERE email LIKE '%admin%' OR is_admin = true
LIMIT 5;

-- 3. user_profiles 테이블 확인 (display_name이 nickname일 수 있음)
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'user_profiles'
ORDER BY ordinal_position;

-- 4. user_profiles에서 사용자 정보 확인
SELECT 
  up.user_id,
  up.display_name,
  u.full_name,
  u.nickname,
  u.email
FROM user_profiles up
JOIN users u ON up.user_id = u.id
WHERE u.email LIKE '%admin%' OR u.is_admin = true
LIMIT 5;

-- 5. 모든 사용자 nickname vs full_name 비교
SELECT 
  id,
  email,
  full_name,
  nickname,
  CASE 
    WHEN nickname IS NULL OR nickname = '' THEN 'nickname 비어있음'
    WHEN nickname = full_name THEN 'nickname = full_name'
    ELSE 'nickname 다름'
  END as comparison
FROM users
LIMIT 10;

