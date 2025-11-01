-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- 현재 게시글 상태 확인
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

-- 1. 전체 게시글 개수 확인
SELECT 
  COUNT(*) as total_posts,
  COUNT(CASE WHEN is_deleted = false THEN 1 END) as active_posts,
  COUNT(CASE WHEN is_hot = true THEN 1 END) as hot_posts
FROM gallery_posts;

-- 2. is_deleted = false인 게시글 확인
SELECT 
  id,
  title,
  is_hot,
  is_deleted,
  view_count,
  like_count,
  created_at
FROM gallery_posts
WHERE is_deleted = false
ORDER BY created_at DESC
LIMIT 10;

-- 3. is_hot = true인 게시글 확인
SELECT 
  id,
  title,
  is_hot,
  is_deleted,
  view_count,
  like_count,
  created_at
FROM gallery_posts
WHERE is_hot = true
LIMIT 10;

-- 4. 모든 게시글 (is_deleted 포함)
SELECT 
  id,
  title,
  is_hot,
  is_deleted,
  created_at
FROM gallery_posts
ORDER BY created_at DESC
LIMIT 10;

-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- 이 결과를 알려주세요!
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

