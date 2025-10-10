-- 댓글 테이블의 외래키 제약조건 제거
-- Remove Foreign Key Constraints from Comments Table
-- 생성일: 2025-10-07

-- ============================================
-- 1. comments 테이블의 외래키 제약조건 제거
-- ============================================

DO $$ 
BEGIN
    -- post_id 외래키 제약조건 삭제
    ALTER TABLE comments 
    DROP CONSTRAINT IF EXISTS comments_post_id_fkey;
    
    RAISE NOTICE 'comments_post_id_fkey 제약조건이 제거되었습니다.';

    -- 다른 외래키 제약조건들도 확인 및 제거
    ALTER TABLE comments 
    DROP CONSTRAINT IF EXISTS comments_author_id_fkey;
    
    RAISE NOTICE 'comments_author_id_fkey 제약조건이 제거되었습니다 (있었다면).';

    ALTER TABLE comments 
    DROP CONSTRAINT IF EXISTS comments_parent_id_fkey;
    
    RAISE NOTICE 'comments_parent_id_fkey 제약조건이 제거되었습니다 (있었다면).';
END $$;

-- ============================================
-- 2. 인덱스는 유지 (성능을 위해)
-- ============================================

CREATE INDEX IF NOT EXISTS idx_comments_post_id ON comments(post_id);
CREATE INDEX IF NOT EXISTS idx_comments_author_id ON comments(author_id);
CREATE INDEX IF NOT EXISTS idx_comments_parent_id ON comments(parent_id);
CREATE INDEX IF NOT EXISTS idx_comments_created_at ON comments(created_at DESC);

-- ============================================
-- 3. 최종 확인
-- ============================================

DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '==================================================';
    RAISE NOTICE '✅ 댓글 테이블 외래키 제약조건 제거 완료!';
    RAISE NOTICE '==================================================';
    RAISE NOTICE '1. comments.post_id 외래키 제약조건 제거';
    RAISE NOTICE '2. comments.author_id 외래키 제약조건 제거 (있었다면)';
    RAISE NOTICE '3. comments.parent_id 외래키 제약조건 제거 (있었다면)';
    RAISE NOTICE '4. 인덱스는 유지됨';
    RAISE NOTICE '';
    RAISE NOTICE '이제 K-매거진과 일반 게시물 모두 댓글을 사용할 수 있습니다!';
    RAISE NOTICE '==================================================';
END $$;

