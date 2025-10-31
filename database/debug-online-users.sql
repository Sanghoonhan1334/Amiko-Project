-- 온라인 사용자 디버깅 쿼리

-- 1. 전체 한국인 사용자 확인
SELECT 
  id, 
  email, 
  full_name, 
  is_korean, 
  created_at, 
  updated_at,
  EXTRACT(EPOCH FROM (NOW() - created_at))/86400 as days_since_signup,
  EXTRACT(EPOCH FROM (NOW() - updated_at))/60 as minutes_since_update
FROM users 
WHERE is_korean = true
ORDER BY created_at DESC
LIMIT 10;

-- 2. 최근 30일 이내 가입한 한국인 사용자 확인
SELECT 
  id, 
  email, 
  full_name, 
  is_korean, 
  created_at
FROM users 
WHERE is_korean = true
AND created_at >= NOW() - INTERVAL '30 days'
ORDER BY created_at DESC
LIMIT 10;

-- 3. 현재 로그인 중인 사용자 확인 (created_at 기준으로 추정)
SELECT 
  id, 
  email, 
  full_name, 
  is_korean, 
  created_at,
  updated_at
FROM users 
WHERE is_korean = true
AND (created_at >= NOW() - INTERVAL '30 days' OR updated_at >= NOW() - INTERVAL '30 minutes')
ORDER BY created_at DESC
LIMIT 10;

-- 4. 특정 이메일로 사용자 검색 (현재 로그인 중인 사용자 확인)
-- SELECT id, email, full_name, is_korean, created_at, updated_at FROM users WHERE email = 'your-email@example.com';

