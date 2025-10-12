-- 고정된 게시글 확인
SELECT id, title, category, is_pinned, created_at
FROM gallery_posts
WHERE is_pinned = TRUE
ORDER BY created_at DESC;

-- 모든 게시글의 is_pinned 상태 확인
SELECT 
  category,
  COUNT(*) as total,
  COUNT(CASE WHEN is_pinned = TRUE THEN 1 END) as pinned_count
FROM gallery_posts
WHERE is_deleted = FALSE
GROUP BY category;

