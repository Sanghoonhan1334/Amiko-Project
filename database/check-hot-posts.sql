-- 핫글 디버깅: 게시글 확인

-- 1. 전체 게시글 수
SELECT 
  COUNT(*) as total_posts,
  COUNT(CASE WHEN is_hot = true THEN 1 END) as hot_posts,
  COUNT(CASE WHEN is_notice = true THEN 1 END) as notice_posts,
  COUNT(CASE WHEN is_deleted = false THEN 1 END) as active_posts
FROM gallery_posts;

-- 2. 최근 게시글 10개 (is_deleted = false)
SELECT 
  id,
  title,
  category,
  is_hot,
  is_notice,
  is_deleted,
  like_count,
  view_count,
  comment_count,
  created_at,
  gallery_id
FROM gallery_posts
WHERE is_deleted = false
ORDER BY created_at DESC
LIMIT 10;

-- 3. is_hot = true인 게시글
SELECT 
  id,
  title,
  category,
  is_hot,
  is_notice,
  like_count,
  created_at
FROM gallery_posts
WHERE is_hot = true AND is_deleted = false
ORDER BY created_at DESC;

-- 4. 갤러리별 게시글 수
SELECT 
  g.name_ko,
  g.slug,
  COUNT(gp.id) as post_count
FROM galleries g
LEFT JOIN gallery_posts gp ON g.id = gp.gallery_id AND gp.is_deleted = false
GROUP BY g.id, g.name_ko, g.slug
ORDER BY post_count DESC;

