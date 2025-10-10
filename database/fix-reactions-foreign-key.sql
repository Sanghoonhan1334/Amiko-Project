-- K-매거진 뉴스 좋아요/싫어요 외래키 제약조건 수정
-- Fix Foreign Key Constraint for K-Magazine News Reactions
-- 생성일: 2025-10-07

-- ============================================
-- 1. reactions 테이블의 외래키 제약조건 제거
-- ============================================

DO $$ 
BEGIN
    -- 기존 외래키 제약조건 삭제
    ALTER TABLE reactions 
    DROP CONSTRAINT IF EXISTS reactions_post_id_fkey;

    ALTER TABLE reactions 
    DROP CONSTRAINT IF EXISTS reactions_comment_id_fkey;

    RAISE NOTICE '외래키 제약조건이 제거되었습니다.';
END $$;

-- ============================================
-- 2. korean_news 테이블에 필요한 컬럼 추가
-- ============================================

DO $$ 
BEGIN
    -- like_count 컬럼 확인 및 추가
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'korean_news' 
        AND column_name = 'like_count'
    ) THEN
        ALTER TABLE korean_news 
        ADD COLUMN like_count INTEGER DEFAULT 0;
        RAISE NOTICE 'korean_news 테이블에 like_count 컬럼이 추가되었습니다.';
    ELSE
        RAISE NOTICE 'korean_news.like_count 컬럼이 이미 존재합니다.';
    END IF;

    -- dislike_count 컬럼 확인 및 추가
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'korean_news' 
        AND column_name = 'dislike_count'
    ) THEN
        ALTER TABLE korean_news 
        ADD COLUMN dislike_count INTEGER DEFAULT 0;
        RAISE NOTICE 'korean_news 테이블에 dislike_count 컬럼이 추가되었습니다.';
    ELSE
        RAISE NOTICE 'korean_news.dislike_count 컬럼이 이미 존재합니다.';
    END IF;
END $$;

-- ============================================
-- 3. 인덱스 추가
-- ============================================

CREATE INDEX IF NOT EXISTS idx_korean_news_like_count ON korean_news(like_count DESC);
CREATE INDEX IF NOT EXISTS idx_korean_news_dislike_count ON korean_news(dislike_count DESC);

-- ============================================
-- 4. 기존 데이터 정합성 재계산
-- ============================================

-- korean_news 테이블의 카운트 재계산
DO $$
BEGIN
    UPDATE korean_news kn
    SET 
      like_count = COALESCE((
        SELECT COUNT(*)
        FROM reactions r
        WHERE r.post_id = kn.id 
        AND r.type = 'like'
      ), 0),
      dislike_count = COALESCE((
        SELECT COUNT(*)
        FROM reactions r
        WHERE r.post_id = kn.id 
        AND r.type = 'dislike'
      ), 0);

    RAISE NOTICE 'korean_news 테이블의 카운트가 재계산되었습니다.';
END $$;

-- ============================================
-- 5. 최종 확인
-- ============================================

DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '==================================================';
    RAISE NOTICE '✅ K-매거진 뉴스 외래키 제약조건 수정 완료!';
    RAISE NOTICE '==================================================';
    RAISE NOTICE '1. reactions 테이블의 외래키 제약조건 제거';
    RAISE NOTICE '2. korean_news 테이블에 like_count, dislike_count 컬럼 추가';
    RAISE NOTICE '3. 인덱스 추가';
    RAISE NOTICE '4. 기존 데이터 정합성 재계산';
    RAISE NOTICE '';
    RAISE NOTICE '이제 K-매거진 뉴스의 좋아요/싫어요 기능이 작동합니다!';
    RAISE NOTICE '==================================================';
END $$;
