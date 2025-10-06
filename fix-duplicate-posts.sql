-- 잘못된 게시글들을 올바른 갤러리로 이동
-- K-POP 게시글들을 kpop 갤러리로 이동
UPDATE gallery_posts 
SET gallery_id = (
  SELECT id FROM galleries WHERE slug = 'kpop'
)
WHERE gallery_id = (
  SELECT id FROM galleries WHERE slug = 'free'
)
AND category = 'K-POP 게시판';

-- K-Drama 게시글들을 drama 갤러리로 이동
UPDATE gallery_posts 
SET gallery_id = (
  SELECT id FROM galleries WHERE slug = 'drama'
)
WHERE gallery_id = (
  SELECT id FROM galleries WHERE slug = 'free'
)
AND category = 'K-Drama 게시판';

-- 뷰티 게시글들을 beauty 갤러리로 이동
UPDATE gallery_posts 
SET gallery_id = (
  SELECT id FROM galleries WHERE slug = 'beauty'
)
WHERE gallery_id = (
  SELECT id FROM galleries WHERE slug = 'free'
)
AND category = '뷰티 게시판';

-- 한국어 게시글들을 korean 갤러리로 이동
UPDATE gallery_posts 
SET gallery_id = (
  SELECT id FROM galleries WHERE slug = 'korean'
)
WHERE gallery_id = (
  SELECT id FROM galleries WHERE slug = 'free'
)
AND category = '한국어 게시판';

-- 스페인어 게시글들을 spanish 갤러리로 이동
UPDATE gallery_posts 
SET gallery_id = (
  SELECT id FROM galleries WHERE slug = 'spanish'
)
WHERE gallery_id = (
  SELECT id FROM galleries WHERE slug = 'free'
)
AND category = '스페인어 게시판';

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
