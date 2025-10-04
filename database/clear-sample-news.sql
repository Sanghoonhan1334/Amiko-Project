-- 예시 뉴스 데이터 삭제
-- Clear sample news data

-- 현재 뉴스 데이터 확인
SELECT id, title, source, author, created_at 
FROM korean_news 
ORDER BY created_at DESC;

-- 연합뉴스, 동아일보 등의 예시 뉴스 삭제
DELETE FROM korean_news 
WHERE source IN ('연합뉴스', '동아일보', 'Yonhap News', 'Dong-A Ilbo');

-- 또는 특정 작성자로 작성된 예시 뉴스 삭제
DELETE FROM korean_news 
WHERE author = 'info@helloamiko.com';

-- 또는 특정 제목 패턴의 예시 뉴스 삭제
DELETE FROM korean_news 
WHERE title LIKE '%BTS%' 
   OR title LIKE '%칸 영화제%'
   OR title LIKE '%빌보드%';

-- 삭제 후 확인
SELECT COUNT(*) as remaining_news_count FROM korean_news;

-- 남은 뉴스 데이터 확인
SELECT id, title, source, author, created_at 
FROM korean_news 
ORDER BY created_at DESC;
