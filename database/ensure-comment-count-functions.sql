-- 댓글 수 증감 함수 생성/업데이트
-- Ensure comment count functions exist
-- 생성일: 2025-11-02

-- ============================================
-- 1. 댓글 수 증가 함수 (댓글 작성 시)
-- ============================================

CREATE OR REPLACE FUNCTION increment_comment_count(post_id UUID)
RETURNS VOID AS $$
BEGIN
    -- gallery_posts 테이블의 comment_count를 1 증가
    UPDATE gallery_posts 
    SET 
        comment_count = comment_count + 1,
        updated_at = NOW()
    WHERE id = post_id;
    
    RAISE NOTICE '댓글 수 증가: post_id = %, 새 카운트 = %', 
        post_id, 
        (SELECT comment_count FROM gallery_posts WHERE id = post_id);
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- 2. 댓글 수 감소 함수 (댓글 삭제 시)
-- ============================================

CREATE OR REPLACE FUNCTION decrement_comment_count(post_id UUID)
RETURNS VOID AS $$
BEGIN
    UPDATE gallery_posts 
    SET 
        comment_count = GREATEST(0, comment_count - 1),
        updated_at = NOW()
    WHERE id = post_id;
    
    RAISE NOTICE '댓글 수 감소: post_id = %, 새 카운트 = %', 
        post_id, 
        (SELECT comment_count FROM gallery_posts WHERE id = post_id);
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- 3. 함수 생성 확인
-- ============================================

SELECT 
    routine_name,
    routine_type,
    data_type
FROM information_schema.routines
WHERE routine_schema = 'public'
  AND routine_name IN ('increment_comment_count', 'decrement_comment_count')
ORDER BY routine_name;

-- ============================================
-- 4. 테스트 쿼리 - 공지사항의 실제 댓글 수 vs DB 댓글 수
-- ============================================

SELECT 
    gp.id,
    gp.title,
    gp.comment_count as "DB_댓글_수",
    (
        SELECT COUNT(*)
        FROM post_comments pc
        WHERE pc.post_id = gp.id
          AND pc.is_deleted = false
    ) as "실제_댓글_수",
    gp.is_notice
FROM gallery_posts gp
WHERE gp.is_notice = true
  AND gp.is_deleted = false
ORDER BY gp.created_at DESC
LIMIT 10;

-- ============================================
-- 5. 불일치하는 게시물 수정 (필요시 실행)
-- ============================================

UPDATE gallery_posts
SET comment_count = (
    SELECT COUNT(*)
    FROM post_comments
    WHERE post_comments.post_id = gallery_posts.id
      AND post_comments.is_deleted = false
)
WHERE id IN (
    SELECT gp.id
    FROM gallery_posts gp
    WHERE gp.is_notice = true
      AND gp.is_deleted = false
      AND gp.comment_count != (
        SELECT COUNT(*)
        FROM post_comments pc
        WHERE pc.post_id = gp.id
          AND pc.is_deleted = false
      )
);

