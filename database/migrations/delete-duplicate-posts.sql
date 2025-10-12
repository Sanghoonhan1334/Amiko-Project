-- 자유게시판(free)에서 잘못된 카테고리의 게시글들 삭제
DELETE FROM gallery_posts 
WHERE gallery_id = (
  SELECT id FROM galleries WHERE slug = 'free'
)
AND category IN ('K-POP 게시판', 'K-Drama 게시판', '뷰티 게시판', '한국어 게시판', '스페인어 게시판');

-- 정리 후 결과 확인
SELECT 
  g.slug,
  g.name_ko,
  COUNT(gp.id) as post_count
FROM galleries g
LEFT JOIN gallery_posts gp ON g.id = gp.gallery_id
WHERE g.slug IN ('kpop', 'drama', 'beauty', 'korean', 'spanish', 'free')
GROUP BY g.id, g.slug, g.name_ko
ORDER BY post_count DESC;
