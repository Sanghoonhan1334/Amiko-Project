-- 갤러리 관련 테이블 확인
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name LIKE 'gallery%'
ORDER BY table_name;
