-- 익명으로 표시되는 댓글 분석
-- 뉴스 댓글이 "Anónimo"로 표시되는 문제 확인

-- 1. 최근 뉴스 댓글 조회 (작성자 정보 포함)
SELECT 
  c.id,
  c.content,
  c.author_id,
  c.created_at,
  c.post_id,
  u.nickname,
  u.full_name,
  u.spanish_name,
  u.korean_name
FROM comments c
LEFT JOIN users u ON c.author_id = u.id
WHERE c.post_id IN (
  SELECT id FROM korean_news ORDER BY created_at DESC LIMIT 10
)
ORDER BY c.created_at DESC
LIMIT 20;

-- 2. 하드코딩된 defaultUserId의 사용자 정보 확인
SELECT 
  id,
  email,
  nickname,
  full_name,
  spanish_name,
  korean_name,
  created_at
FROM users
WHERE id = '5f83ab21-fd61-4666-94b5-087d73477476';

-- 3. author_id가 NULL이거나 사용자 정보가 없는 댓글
SELECT 
  c.id,
  c.content,
  c.author_id,
  c.created_at,
  CASE 
    WHEN c.author_id IS NULL THEN 'NULL author_id'
    WHEN u.id IS NULL THEN 'User not found'
    WHEN u.nickname IS NULL AND u.full_name IS NULL THEN 'No name/nickname'
    ELSE 'OK'
  END as issue
FROM comments c
LEFT JOIN users u ON c.author_id = u.id
WHERE c.post_id IN (SELECT id FROM korean_news)
  AND (
    c.author_id IS NULL OR 
    u.id IS NULL OR 
    (u.nickname IS NULL AND u.full_name IS NULL AND u.spanish_name IS NULL AND u.korean_name IS NULL)
  )
ORDER BY c.created_at DESC
LIMIT 20;

-- 4. 해결: defaultUserId에 닉네임 설정 (없는 경우)
UPDATE users 
SET 
  nickname = COALESCE(nickname, spanish_name, korean_name, full_name, 'Usuario'),
  full_name = COALESCE(full_name, nickname, spanish_name, 'Amiko User')
WHERE id = '5f83ab21-fd61-4666-94b5-087d73477476'
  AND (nickname IS NULL OR nickname = '');

-- 5. 확인
SELECT 
  id,
  email,
  nickname,
  full_name,
  spanish_name,
  korean_name
FROM users
WHERE id = '5f83ab21-fd61-4666-94b5-087d73477476';

