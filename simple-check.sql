-- 간단한 확인 쿼리들

-- 1. gallery_posts 테이블의 최근 5개 게시글 확인
SELECT id, title, gallery_id, created_at 
FROM gallery_posts 
ORDER BY created_at DESC 
LIMIT 5;

-- 2. 갤러리별 게시글 수 확인
SELECT 
  g.slug,
  g.name_ko,
  COUNT(gp.id) as post_count
FROM galleries g
LEFT JOIN gallery_posts gp ON g.id = gp.gallery_id
WHERE g.slug IN ('kpop', 'drama', 'beauty', 'korean', 'spanish', 'free')
GROUP BY g.id, g.slug, g.name_ko
ORDER BY post_count DESC;

-- 3. 최근 게시글의 갤러리 정보 확인
SELECT 
  gp.title,
  gp.gallery_id,
  g.slug as gallery_slug,
  g.name_ko as gallery_name
FROM gallery_posts gp
LEFT JOIN galleries g ON gp.gallery_id = g.id
ORDER BY gp.created_at DESC
LIMIT 3;
