-- 주제별 게시판에서 오래된 글 삭제
-- 이미지에서 확인된 두 개의 글을 삭제합니다:
-- 1. "sdaadsd" (자유게시판)
-- 2. "삐 오늘 이쁘네..." (자유게시판)

-- 먼저 해당 글들이 어느 테이블에 있는지 확인
-- 1. 갤러리 시스템 테이블에서 확인
SELECT 'gallery_posts' as table_name, id, title, content, created_at 
FROM gallery_posts 
WHERE title = 'sdaadsd' OR title = '삐 오늘 이쁘네...' OR content LIKE '%삐 오늘 이쁘네%'
ORDER BY created_at DESC;

-- 2. 기존 posts 테이블에서 확인
SELECT 'posts' as table_name, id, title, content, created_at 
FROM posts 
WHERE title = 'sdaadsd' OR title = '삐 오늘 이쁘네...' OR content LIKE '%삐 오늘 이쁘네%'
ORDER BY created_at DESC;

-- 확인 후 아래 주석을 해제하여 삭제 실행
-- 갤러리 게시물에서 삭제
DELETE FROM gallery_posts 
WHERE title = 'sdaadsd' OR title = '삐 오늘 이쁘네...' OR content LIKE '%삐 오늘 이쁘네%';

-- 기존 posts 테이블에서 삭제
-- DELETE FROM posts 
-- WHERE title = 'sdaadsd' OR title = '삐 오늘 이쁘네...' OR content LIKE '%삐 오늘 이쁘네%';

-- 삭제 후 확인
-- SELECT 'After deletion - gallery_posts' as table_name, COUNT(*) as remaining_count FROM gallery_posts;
-- SELECT 'After deletion - posts' as table_name, COUNT(*) as remaining_count FROM posts;
