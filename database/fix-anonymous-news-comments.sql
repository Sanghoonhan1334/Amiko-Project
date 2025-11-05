-- 뉴스 댓글 익명 표시 문제 해결
-- 1단계: 원인 분석, 2단계: 운영자 확인, 3단계: 해결

-- ==========================================
-- 1단계: 원인 분석
-- ==========================================

-- 1-1. defaultUserId의 사용자 정보 확인
SELECT 
  id,
  email,
  nickname,
  full_name,
  spanish_name,
  korean_name,
  is_admin,
  created_at
FROM users
WHERE id = '5f83ab21-fd61-4666-94b5-087d73477476';

-- 1-2. 이 ID가 auth.users에는 있는지 확인 (admin 권한 필요)
-- Supabase Dashboard → Authentication → Users에서 수동 확인

-- 1-3. 모든 운영자 계정 확인
SELECT 
  u.id,
  u.email,
  u.nickname,
  u.full_name,
  u.is_admin,
  a.role,
  a.is_active
FROM users u
LEFT JOIN admin_users a ON u.id = a.user_id
WHERE u.is_admin = TRUE OR a.user_id IS NOT NULL
ORDER BY u.created_at DESC;

-- ==========================================
-- 2단계: 해결 방법 결정
-- ==========================================

-- 옵션 A: defaultUserId가 users 테이블에 없는 경우
-- → 운영자 계정 생성 또는 실제 운영자 ID로 댓글 업데이트

-- 옵션 B: defaultUserId는 있지만 닉네임이 없는 경우
-- → 닉네임 설정

-- 옵션 C: 완전히 다른 문제
-- → 추가 분석 필요

-- ==========================================
-- 3단계: 임시 해결 (일단 운영자 닉네임 설정)
-- ==========================================

-- 3-1. defaultUserId가 존재하면 운영자 닉네임 설정
UPDATE users 
SET 
  nickname = 'Operador',
  spanish_name = 'Operador',
  full_name = 'AMIKO Operador'
WHERE id = '5f83ab21-fd61-4666-94b5-087d73477476'
  AND (nickname IS NULL OR nickname = '' OR full_name IS NULL);

-- 3-2. defaultUserId가 없으면 생성 (운영자로)
INSERT INTO users (
  id,
  email,
  nickname,
  full_name,
  spanish_name,
  is_admin,
  is_korean,
  language,
  created_at
)
SELECT 
  '5f83ab21-fd61-4666-94b5-087d73477476',
  'operador@amiko.com',
  'Operador',
  'AMIKO Operador',
  'Operador',
  TRUE,
  FALSE,
  'es',
  NOW()
WHERE NOT EXISTS (
  SELECT 1 FROM users WHERE id = '5f83ab21-fd61-4666-94b5-087d73477476'
);

-- ==========================================
-- 4단계: 확인
-- ==========================================

-- 4-1. 업데이트된 사용자 정보 확인
SELECT 
  id,
  email,
  nickname,
  full_name,
  spanish_name,
  is_admin
FROM users
WHERE id = '5f83ab21-fd61-4666-94b5-087d73477476';

-- 4-2. 댓글이 이제 "Operador"로 표시되는지 확인
SELECT 
  c.id,
  c.content,
  c.author_id,
  u.nickname,
  u.full_name,
  c.created_at
FROM comments c
LEFT JOIN users u ON c.author_id = u.id
WHERE c.post_id IN (SELECT id FROM korean_news)
ORDER BY c.created_at DESC
LIMIT 10;

