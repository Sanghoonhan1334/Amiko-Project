-- 공지사항 댓글 수 수정 (Fix Announcement Comment Counts)
-- 생성일: 2025-11-02
-- 
-- 문제: gallery_posts 테이블의 comment_count가 실제 댓글 수와 일치하지 않음
-- 해결: 실제 댓글 수를 계산하여 업데이트

-- ============================================
-- 1. 모든 게시물의 comment_count 업데이트
-- ============================================

UPDATE gallery_posts
SET comment_count = (
    SELECT COUNT(*)
    FROM post_comments
    WHERE post_comments.post_id = gallery_posts.id
      AND post_comments.is_deleted = false
)
WHERE id IN (
    SELECT DISTINCT post_id 
    FROM post_comments 
    WHERE is_deleted = false
);

-- ============================================
-- 2. 댓글이 없는 게시물의 comment_count를 0으로 설정
-- ============================================

UPDATE gallery_posts
SET comment_count = 0
WHERE id NOT IN (
    SELECT DISTINCT post_id 
    FROM post_comments 
    WHERE is_deleted = false
)
AND comment_count != 0;

-- ============================================
-- 3. 결과 확인
-- ============================================

SELECT 
    gp.id,
    gp.title,
    gp.comment_count as "현재_댓글_수",
    (
        SELECT COUNT(*)
        FROM post_comments pc
        WHERE pc.post_id = gp.id
          AND pc.is_deleted = false
    ) as "실제_댓글_수",
    gp.is_notice
FROM gallery_posts gp
WHERE gp.is_notice = true
ORDER BY gp.created_at DESC
LIMIT 10;

