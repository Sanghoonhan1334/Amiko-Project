-- 현재 갤러리별 게시글 수 확인
SELECT 
  g.slug,
  g.name_ko,
  COUNT(gp.id) as post_count
FROM galleries g
LEFT JOIN gallery_posts gp ON g.id = gp.gallery_id
WHERE g.slug IN ('kpop', 'drama', 'beauty', 'korean', 'spanish', 'free')
GROUP BY g.id, g.slug, g.name_ko
ORDER BY post_count DESC;

-- 자유게시판(free)에 있는 잘못된 게시글들 확인
SELECT 
  gp.id,
  gp.title,
  gp.category,
  g.slug as gallery_slug,
  g.name_ko as gallery_name
FROM gallery_posts gp
JOIN galleries g ON gp.gallery_id = g.id
WHERE g.slug = 'free' 
AND gp.category != '자유게시판'
ORDER BY gp.created_at DESC
LIMIT 10;
