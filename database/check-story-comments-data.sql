-- 스토리 댓글 데이터 확인
-- Check story comments data

-- 1. 테이블 구조 확인
SELECT 
  column_name, 
  data_type, 
  is_nullable
FROM information_schema.columns
WHERE table_name = 'story_comments'
ORDER BY ordinal_position;

-- 2. 현재 댓글 데이터 확인 (parent_comment_id 포함)
SELECT 
  id,
  story_id,
  user_id,
  content,
  parent_comment_id,
  created_at
FROM story_comments
ORDER BY created_at DESC
LIMIT 20;

-- 3. 답글 개수 확인
SELECT 
  CASE 
    WHEN parent_comment_id IS NULL THEN '최상위 댓글'
    ELSE '답글'
  END as comment_type,
  COUNT(*) as count
FROM story_comments
GROUP BY parent_comment_id IS NULL;

