-- 모든 게시글 확인 (카테고리별)
SELECT 
  id,
  title,
  category,
  gallery_id,
  created_at,
  is_deleted
FROM gallery_posts
WHERE is_deleted = FALSE
ORDER BY created_at DESC
LIMIT 50;

-- 갤러리별 게시글 수
SELECT 
  g.slug,
  g.name_ko,
  COUNT(gp.id) as post_count
FROM galleries g
LEFT JOIN gallery_posts gp ON g.id = gp.gallery_id AND gp.is_deleted = FALSE
GROUP BY g.id, g.slug, g.name_ko
ORDER BY post_count DESC;

-- K-POP 갤러리 ID 확인
SELECT id, slug, name_ko 
FROM galleries 
WHERE slug = 'kpop';

