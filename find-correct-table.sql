-- 모든 테이블 목록 확인
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name LIKE '%post%'
ORDER BY table_name;

-- posts 테이블이 실제로 존재하는지 확인
SELECT EXISTS (
  SELECT 1 
  FROM information_schema.tables 
  WHERE table_schema = 'public' 
  AND table_name = 'posts'
) AS posts_exists;

-- gallery_posts 테이블이 존재하는지 확인
SELECT EXISTS (
  SELECT 1 
  FROM information_schema.tables 
  WHERE table_schema = 'public' 
  AND table_name = 'gallery_posts'
) AS gallery_posts_exists;

-- 만약 gallery_posts 테이블이 있다면 구조 확인
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'gallery_posts' 
ORDER BY ordinal_position;
