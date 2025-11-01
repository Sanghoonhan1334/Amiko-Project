-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- 테스트용: 최근 게시글을 인기글로 설정
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

-- 1. 현재 게시글 상태 확인
SELECT 
  id,
  title,
  view_count,
  like_count,
  is_hot,
  created_at
FROM gallery_posts
WHERE is_deleted = false
ORDER BY created_at DESC
LIMIT 10;

-- 2. 최근 게시글 5개를 is_hot = true로 설정
UPDATE gallery_posts
SET is_hot = true
WHERE id IN (
  SELECT id 
  FROM gallery_posts 
  WHERE is_deleted = false 
  ORDER BY created_at DESC 
  LIMIT 5
);

-- 3. 변경 결과 확인
SELECT 
  id,
  title,
  view_count,
  like_count,
  is_hot,
  created_at
FROM gallery_posts
WHERE is_hot = true
ORDER BY created_at DESC;

-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- ✅ 완료!
-- 
-- 이제 HomeTab의 "Posts Populares" 섹션에
-- 5개의 인기글이 표시됩니다!
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

