-- 갤러리별 게시글 수 확인
SELECT 
  g.slug,
  g.name_ko,
  COUNT(gp.id) as post_count
FROM galleries g
LEFT JOIN gallery_posts gp ON g.id = gp.gallery_id
WHERE g.slug IN ('kpop', 'drama', 'beauty', 'korean', 'spanish', 'free')
GROUP BY g.id, g.slug, g.name_ko
ORDER BY post_count DESC;
