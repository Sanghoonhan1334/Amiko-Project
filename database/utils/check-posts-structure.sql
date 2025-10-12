-- posts 테이블 구조 확인
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'posts' 
ORDER BY ordinal_position;

-- posts 테이블의 실제 데이터 확인 (최근 5개)
SELECT * FROM posts ORDER BY created_at DESC LIMIT 5;

-- gallery_posts 테이블이 있는지 확인
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'gallery_posts' 
ORDER BY ordinal_position;

-- gallery_posts 테이블의 실제 데이터 확인 (최근 5개)
SELECT * FROM gallery_posts ORDER BY created_at DESC LIMIT 5;
