-- category는 K-POP인데 gallery_id는 kpop이 아닌 게시글 찾기
SELECT 
  gp.id,
  gp.title,
  gp.category,
  gp.gallery_id,
  g.slug as actual_gallery,
  g.name_ko as gallery_name,
  gp.created_at
FROM gallery_posts gp
LEFT JOIN galleries g ON gp.gallery_id = g.id
WHERE gp.category = 'K-POP 게시판'
  AND gp.is_deleted = FALSE
ORDER BY gp.created_at DESC;

-- 반대로 gallery_id는 kpop인데 category가 다른 것들
SELECT 
  gp.id,
  gp.title,
  gp.category,
  g.slug as gallery_slug,
  g.name_ko as gallery_name,
  gp.created_at
FROM gallery_posts gp
JOIN galleries g ON gp.gallery_id = g.id
WHERE g.slug = 'kpop'
  AND gp.is_deleted = FALSE
ORDER BY gp.created_at DESC;

