-- K-POP 게시판의 모든 게시글 확인 (최신순)
SELECT 
  id,
  title,
  category,
  created_at,
  is_pinned,
  is_deleted
FROM gallery_posts
WHERE category = 'K-POP 게시판'
  AND is_deleted = FALSE
ORDER BY created_at DESC
LIMIT 20;

-- 같은 제목의 게시글이 여러 개 있는지 확인
SELECT 
  title,
  COUNT(*) as count,
  STRING_AGG(id::text, ', ') as post_ids
FROM gallery_posts
WHERE category = 'K-POP 게시판'
  AND is_deleted = FALSE
GROUP BY title
HAVING COUNT(*) > 1;

-- 10시간 전에 작성된 게시글 찾기
SELECT 
  id,
  title,
  category,
  created_at,
  NOW() - created_at as age
FROM gallery_posts
WHERE category = 'K-POP 게시판'
  AND is_deleted = FALSE
  AND created_at > NOW() - INTERVAL '11 hours'
  AND created_at < NOW() - INTERVAL '9 hours'
ORDER BY created_at DESC;

