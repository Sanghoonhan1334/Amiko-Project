-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- 테스트 게시글을 공지사항에서 제외
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

-- 1. "ㅎㅎ" 게시글 is_notice를 false로 업데이트
UPDATE gallery_posts
SET is_notice = FALSE
WHERE id = 'a521b047-7523-45c0-8da4-98604ff50306';

-- 2. "gg" 게시글 is_notice를 false로 업데이트
UPDATE gallery_posts
SET is_notice = FALSE
WHERE id = '6d8e5405-fa11-4d24-bd95-ada9e6c44c61';

-- 3. 변경 결과 확인
SELECT
  id,
  title,
  category,
  is_notice,
  created_at
FROM gallery_posts
WHERE id IN ('a521b047-7523-45c0-8da4-98604ff50306', '6d8e5405-fa11-4d24-bd95-ada9e6c44c61');

-- 4. 현재 is_notice = true인 모든 게시글 확인
SELECT
  id,
  title,
  category,
  is_notice,
  created_at
FROM gallery_posts
WHERE is_notice = true
ORDER BY created_at DESC;

-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- ✅ 완료!
-- 
-- 이제 "ㅎㅎ"과 "gg" 게시글이 공지사항에서 제외됩니다.
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

