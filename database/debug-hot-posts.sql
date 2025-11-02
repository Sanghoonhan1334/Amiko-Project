-- 핫글 데이터 디버깅

-- 1. gallery_posts 테이블에 게시글이 있는지 확인
SELECT 
  COUNT(*) as total_posts,
  COUNT(CASE WHEN is_deleted = false THEN 1 END) as active_posts,
  COUNT(CASE WHEN is_hot = true AND is_deleted = false THEN 1 END) as hot_posts,
  COUNT(CASE WHEN is_notice = true AND is_deleted = false THEN 1 END) as notice_posts
FROM gallery_posts;

-- 2. 최근 게시글 5개 확인
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
  user_id,
  gallery_id
FROM gallery_posts
WHERE is_deleted = false
ORDER BY created_at DESC
LIMIT 5;

-- 3. is_hot = true 게시글 확인
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

-- 4. user 테이블 확인 (조인이 제대로 되는지)
SELECT 
  gp.id,
  gp.title,
  gp.user_id,
  u.id as user_table_id,
  u.full_name,
  u.nickname
FROM gallery_posts gp
LEFT JOIN users u ON gp.user_id = u.id
WHERE gp.is_deleted = false
ORDER BY gp.created_at DESC
LIMIT 5;

-- 5. galleries 테이블 확인 (조인이 제대로 되는지)
SELECT 
  gp.id,
  gp.title,
  gp.gallery_id,
  g.id as gallery_table_id,
  g.slug,
  g.name_ko,
  g.name_es
FROM gallery_posts gp
LEFT JOIN galleries g ON gp.gallery_id = g.id
WHERE gp.is_deleted = false
ORDER BY gp.created_at DESC
LIMIT 5;

