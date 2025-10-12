-- gallery_posts 테이블의 최근 게시글과 갤러리 정보 확인
SELECT
  gp.id AS post_id,
  gp.title,
  gp.gallery_id,
  g.slug AS gallery_slug,
  g.name_ko AS gallery_name_ko,
  gp.created_at
FROM
  gallery_posts gp
LEFT JOIN
  galleries g ON gp.gallery_id = g.id
ORDER BY
  gp.created_at DESC
LIMIT 10;

-- 갤러리별 게시글 수 확인
SELECT
  g.slug AS gallery_slug,
  g.name_ko AS gallery_name_ko,
  COUNT(gp.id) AS post_count
FROM
  galleries g
LEFT JOIN
  gallery_posts gp ON g.id = gp.gallery_id
WHERE
  g.slug IN ('kpop', 'drama', 'beauty', 'korean', 'spanish', 'free')
GROUP BY
  g.id, g.slug, g.name_ko
ORDER BY
  post_count DESC;

-- 특정 갤러리 ID가 어떤 갤러리인지 확인
SELECT 
  id, 
  slug, 
  name_ko 
FROM galleries 
WHERE id IN (
  SELECT DISTINCT gallery_id 
  FROM gallery_posts 
  LIMIT 5
)
ORDER BY name_ko;
