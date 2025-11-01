-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- 기존 공지사항 게시글에 is_notice = true 설정
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

-- 1. 먼저 현재 공지사항으로 판단되는 게시글 확인
SELECT 
  id,
  title,
  category,
  is_notice,
  created_at
FROM gallery_posts
WHERE 
  title LIKE '%공지%' 
  OR title LIKE '%[공지]%'
  OR title LIKE '%AMIKO%안내%'
  OR title LIKE '%개발 일정%'
ORDER BY created_at DESC;

-- 2. 위에서 확인한 게시글의 is_notice를 true로 업데이트
UPDATE gallery_posts
SET is_notice = true
WHERE 
  (
    title LIKE '%공지%' 
    OR title LIKE '%[공지]%'
    OR title LIKE '%AMIKO%안내%'
    OR title LIKE '%개발 일정%'
  )
  AND is_deleted = false;

-- 3. 업데이트 결과 확인
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
-- 이제 HomeTab에서 /api/posts?is_notice=true 로 요청하면
-- 카테고리에 상관없이 is_notice = true인 게시글만 표시됩니다.
--
-- 향후 관리자가 게시글 작성 시 "공지로 등록" 체크박스를 선택하면
-- 자동으로 is_notice = true로 저장됩니다.
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

