-- 스토리 댓글 API 응답 시뮬레이션
-- Test Story Comments API Response

-- 1. 특정 스토리의 모든 댓글 조회 (parent_comment_id 포함)
-- Replace 'YOUR_STORY_ID' with actual story ID
SELECT 
  id,
  story_id,
  user_id,
  content,
  parent_comment_id,
  created_at,
  CASE 
    WHEN parent_comment_id IS NULL THEN '최상위 댓글'
    ELSE '답글'
  END as comment_type
FROM story_comments
-- WHERE story_id = 'YOUR_STORY_ID'  -- 실제 story_id로 교체하세요
ORDER BY created_at ASC
LIMIT 20;

-- 2. 계층 구조 확인
WITH RECURSIVE comment_tree AS (
  -- 최상위 댓글
  SELECT 
    id,
    story_id,
    content,
    parent_comment_id,
    created_at,
    0 as depth,
    ARRAY[id] as path
  FROM story_comments
  WHERE parent_comment_id IS NULL
  -- AND story_id = 'YOUR_STORY_ID'  -- 실제 story_id로 교체하세요
  
  UNION ALL
  
  -- 답글
  SELECT 
    sc.id,
    sc.story_id,
    sc.content,
    sc.parent_comment_id,
    sc.created_at,
    ct.depth + 1,
    ct.path || sc.id
  FROM story_comments sc
  INNER JOIN comment_tree ct ON sc.parent_comment_id = ct.id
)
SELECT 
  id,
  REPEAT('  ', depth) || content as content_indented,
  depth,
  parent_comment_id,
  created_at
FROM comment_tree
ORDER BY path;

-- 3. 최상위 댓글과 그 답글 개수
SELECT 
  parent.id,
  parent.content as parent_content,
  COUNT(reply.id) as reply_count
FROM story_comments parent
LEFT JOIN story_comments reply ON reply.parent_comment_id = parent.id
WHERE parent.parent_comment_id IS NULL
-- AND parent.story_id = 'YOUR_STORY_ID'  -- 실제 story_id로 교체하세요
GROUP BY parent.id, parent.content
ORDER BY parent.created_at DESC;


