-- 최근 게시글의 갤러리 정보 확인
SELECT
  p.id AS post_id,
  p.title,
  p.gallery_id,
  g.slug AS gallery_slug,
  g.name_ko AS gallery_name_ko,
  p.created_at
FROM
  posts p
LEFT JOIN
  galleries g ON p.gallery_id = g.id
ORDER BY
  p.created_at DESC
LIMIT 10;

-- 갤러리별 게시글 수 확인
SELECT
  g.slug AS gallery_slug,
  g.name_ko AS gallery_name_ko,
  COUNT(p.id) AS post_count
FROM
  galleries g
LEFT JOIN
  posts p ON g.id = p.gallery_id
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
  FROM posts 
  ORDER BY created_at DESC 
  LIMIT 5
);
