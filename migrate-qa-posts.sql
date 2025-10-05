-- Q&A 관련 게시물을 자유게시판에서 Q&A 갤러리로 이동하는 스크립트

-- 1. 먼저 이동할 게시물들을 확인
-- Q&A 관련 키워드가 포함된 게시물들을 찾아서 Q&A 갤러리로 이동

-- 갤러리 ID 확인
-- 자유게시판 ID: f15a74a3-d50b-4f4b-82dc-743b961f6be9
-- Q&A 갤러리 ID: ae52aa5e-dc2f-4ffa-8593-bcc4949bf445

-- Q&A 관련 키워드로 이동할 게시물들 찾기
-- (제목이나 내용에 질문 관련 키워드가 포함된 게시물들)
UPDATE gallery_posts 
SET gallery_id = 'ae52aa5e-dc2f-4ffa-8593-bcc4949bf445',  -- Q&A 갤러리 ID
    category_name = 'Q&A'
WHERE gallery_id = 'f15a74a3-d50b-4f4b-82dc-743b961f6be9'  -- 자유게시판 ID
  AND is_deleted = false
  AND (
    -- 제목에 질문 관련 키워드가 포함된 경우
    LOWER(title) LIKE '%질문%' OR
    LOWER(title) LIKE '%궁금%' OR
    LOWER(title) LIKE '%문의%' OR
    LOWER(title) LIKE '%도움%' OR
    LOWER(title) LIKE '%help%' OR
    LOWER(title) LIKE '%question%' OR
    LOWER(title) LIKE '%?%' OR
    LOWER(title) LIKE '%ㅇㅇ%' OR
    -- 내용에 질문 관련 키워드가 포함된 경우
    LOWER(content) LIKE '%질문%' OR
    LOWER(content) LIKE '%궁금%' OR
    LOWER(content) LIKE '%문의%' OR
    LOWER(content) LIKE '%도움%' OR
    LOWER(content) LIKE '%help%' OR
    LOWER(content) LIKE '%question%' OR
    LOWER(content) LIKE '%어떻게%' OR
    LOWER(content) LIKE '%방법%' OR
    LOWER(content) LIKE '%어디%' OR
    LOWER(content) LIKE '%언제%' OR
    LOWER(content) LIKE '%왜%' OR
    LOWER(content) LIKE '%무엇%'
  );

-- 이동된 게시물 수 확인
SELECT 
  '자유게시판' as gallery_name,
  COUNT(*) as post_count
FROM gallery_posts 
WHERE gallery_id = 'f15a74a3-d50b-4f4b-82dc-743b961f6be9' 
  AND is_deleted = false

UNION ALL

SELECT 
  'Q&A' as gallery_name,
  COUNT(*) as post_count
FROM gallery_posts 
WHERE gallery_id = 'ae52aa5e-dc2f-4ffa-8593-bcc4949bf445' 
  AND is_deleted = false;

-- 갤러리별 게시물 수 업데이트
UPDATE galleries 
SET post_count = (
  SELECT COUNT(*) 
  FROM gallery_posts 
  WHERE gallery_id = galleries.id 
    AND is_deleted = false
)
WHERE slug IN ('free', 'qa');
