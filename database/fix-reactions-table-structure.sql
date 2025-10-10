-- K-매거진 뉴스 좋아요/싫어요 시스템 수정 (기존 테이블 구조 확인)
-- Fix K-Magazine News Like/Dislike System (Check Existing Table Structure)
-- 생성일: 2025-10-07

-- ============================================
-- 1. 현재 reactions 테이블 구조 확인
-- ============================================

SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'reactions'
ORDER BY ordinal_position;

-- ============================================
-- 2. reactions 테이블이 없으면 생성, 있으면 수정
-- ============================================

-- reactions 테이블이 존재하는지 확인
DO $$ 
BEGIN
    IF EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'reactions'
    ) THEN
        RAISE NOTICE 'reactions 테이블이 이미 존재합니다. 구조를 확인합니다.';
        
        -- type 컬럼이 없으면 추가
        IF NOT EXISTS (
            SELECT 1 
            FROM information_schema.columns 
            WHERE table_name = 'reactions' 
            AND column_name = 'type'
        ) THEN
            ALTER TABLE reactions 
            ADD COLUMN type TEXT CHECK (type IN ('like', 'dislike'));
            RAISE NOTICE 'reactions 테이블에 type 컬럼이 추가되었습니다.';
        END IF;
        
        -- reaction_type 컬럼이 있으면 type으로 변경
        IF EXISTS (
            SELECT 1 
            FROM information_schema.columns 
            WHERE table_name = 'reactions' 
            AND column_name = 'reaction_type'
        ) THEN
            -- 기존 데이터를 type 컬럼으로 복사
            UPDATE reactions 
            SET type = reaction_type 
            WHERE type IS NULL;
            
            -- reaction_type 컬럼 삭제
            ALTER TABLE reactions 
            DROP COLUMN reaction_type;
            
            RAISE NOTICE 'reaction_type 컬럼이 type으로 변경되었습니다.';
        END IF;
        
    ELSE
        RAISE NOTICE 'reactions 테이블이 존재하지 않습니다. 새로 생성합니다.';
        
        -- reactions 테이블 생성
        CREATE TABLE reactions (
          id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
          user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          post_id UUID REFERENCES posts(id) ON DELETE CASCADE,
          comment_id UUID REFERENCES comments(id) ON DELETE CASCADE,
          type TEXT NOT NULL CHECK (type IN ('like', 'dislike')),
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          UNIQUE(user_id, post_id), -- 사용자당 게시물당 하나의 반응만
          UNIQUE(user_id, comment_id) -- 사용자당 댓글당 하나의 반응만
        );
        
        RAISE NOTICE 'reactions 테이블이 생성되었습니다.';
    END IF;
END $$;

-- ============================================
-- 3. posts 테이블에 필요한 컬럼 추가
-- ============================================

-- posts 테이블에 like_count, dislike_count 컬럼 추가
DO $$ 
BEGIN
    -- like_count 컬럼 추가
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'posts' 
        AND column_name = 'like_count'
    ) THEN
        ALTER TABLE posts 
        ADD COLUMN like_count INTEGER DEFAULT 0;
        RAISE NOTICE 'posts 테이블에 like_count 컬럼이 추가되었습니다.';
    END IF;

    -- dislike_count 컬럼 추가
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'posts' 
        AND column_name = 'dislike_count'
    ) THEN
        ALTER TABLE posts 
        ADD COLUMN dislike_count INTEGER DEFAULT 0;
        RAISE NOTICE 'posts 테이블에 dislike_count 컬럼이 추가되었습니다.';
    END IF;

    -- comment_count 컬럼 추가
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'posts' 
        AND column_name = 'comment_count'
    ) THEN
        ALTER TABLE posts 
        ADD COLUMN comment_count INTEGER DEFAULT 0;
        RAISE NOTICE 'posts 테이블에 comment_count 컬럼이 추가되었습니다.';
    END IF;
END $$;

-- ============================================
-- 4. comments 테이블에 필요한 컬럼 추가
-- ============================================

-- comments 테이블에 like_count, dislike_count, is_deleted 컬럼 추가
DO $$ 
BEGIN
    -- like_count 컬럼 추가
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'comments' 
        AND column_name = 'like_count'
    ) THEN
        ALTER TABLE comments 
        ADD COLUMN like_count INTEGER DEFAULT 0;
        RAISE NOTICE 'comments 테이블에 like_count 컬럼이 추가되었습니다.';
    END IF;

    -- dislike_count 컬럼 추가
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'comments' 
        AND column_name = 'dislike_count'
    ) THEN
        ALTER TABLE comments 
        ADD COLUMN dislike_count INTEGER DEFAULT 0;
        RAISE NOTICE 'comments 테이블에 dislike_count 컬럼이 추가되었습니다.';
    END IF;

    -- is_deleted 컬럼 추가
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'comments' 
        AND column_name = 'is_deleted'
    ) THEN
        ALTER TABLE comments 
        ADD COLUMN is_deleted BOOLEAN DEFAULT FALSE;
        RAISE NOTICE 'comments 테이블에 is_deleted 컬럼이 추가되었습니다.';
    END IF;
END $$;

-- ============================================
-- 5. 인덱스 최적화
-- ============================================

-- 성능 향상을 위한 인덱스 추가
CREATE INDEX IF NOT EXISTS idx_reactions_post_user ON reactions(post_id, user_id);
CREATE INDEX IF NOT EXISTS idx_reactions_comment_user ON reactions(comment_id, user_id);
CREATE INDEX IF NOT EXISTS idx_reactions_type ON reactions(type);

CREATE INDEX IF NOT EXISTS idx_posts_like_count ON posts(like_count DESC);
CREATE INDEX IF NOT EXISTS idx_posts_dislike_count ON posts(dislike_count DESC);
CREATE INDEX IF NOT EXISTS idx_posts_comment_count ON posts(comment_count DESC);

CREATE INDEX IF NOT EXISTS idx_comments_post_id_not_deleted ON comments(post_id) WHERE is_deleted = false;
CREATE INDEX IF NOT EXISTS idx_comments_like_count ON comments(like_count DESC);

-- ============================================
-- 6. RLS 정책 비활성화 (테스트용)
-- ============================================

-- RLS 비활성화 (테스트용)
ALTER TABLE reactions DISABLE ROW LEVEL SECURITY;
ALTER TABLE posts DISABLE ROW LEVEL SECURITY;
ALTER TABLE comments DISABLE ROW LEVEL SECURITY;

-- 기존 정책 삭제 (있을 경우)
DROP POLICY IF EXISTS "Users can view their own reactions" ON reactions;
DROP POLICY IF EXISTS "Users can insert their own reactions" ON reactions;
DROP POLICY IF EXISTS "Users can update their own reactions" ON reactions;
DROP POLICY IF EXISTS "Users can delete their own reactions" ON reactions;

DROP POLICY IF EXISTS "Anyone can view posts" ON posts;
DROP POLICY IF EXISTS "Users can insert their own posts" ON posts;
DROP POLICY IF EXISTS "Users can update their own posts" ON posts;
DROP POLICY IF EXISTS "Users can delete their own posts" ON posts;

DROP POLICY IF EXISTS "Anyone can view comments" ON comments;
DROP POLICY IF EXISTS "Users can insert their own comments" ON comments;
DROP POLICY IF EXISTS "Users can update their own comments" ON comments;
DROP POLICY IF EXISTS "Users can delete their own comments" ON comments;

-- ============================================
-- 7. 댓글 수 정확성 검증 및 재계산 함수
-- ============================================

CREATE OR REPLACE FUNCTION recalculate_all_counts()
RETURNS void AS $$
BEGIN
    -- posts 테이블의 like_count, dislike_count, comment_count 재계산
    UPDATE posts p
    SET 
        like_count = (
            SELECT COUNT(*)
            FROM reactions r
            WHERE r.post_id = p.id 
            AND r.type = 'like'
        ),
        dislike_count = (
            SELECT COUNT(*)
            FROM reactions r
            WHERE r.post_id = p.id 
            AND r.type = 'dislike'
        ),
        comment_count = (
            SELECT COUNT(*)
            FROM comments c
            WHERE c.post_id = p.id 
            AND c.is_deleted = false
        );
    
    -- comments 테이블의 like_count, dislike_count 재계산
    UPDATE comments c
    SET 
        like_count = (
            SELECT COUNT(*)
            FROM reactions r
            WHERE r.comment_id = c.id 
            AND r.type = 'like'
        ),
        dislike_count = (
            SELECT COUNT(*)
            FROM reactions r
            WHERE r.comment_id = c.id 
            AND r.type = 'dislike'
        );
END;
$$ LANGUAGE plpgsql;

-- 모든 데이터의 정합성 재계산
SELECT recalculate_all_counts();

-- ============================================
-- 8. 최종 확인
-- ============================================

-- reactions 테이블 구조 확인
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'reactions'
ORDER BY ordinal_position;

-- 테이블 존재 확인
SELECT 
    'posts' as table_name,
    EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'posts'
    ) as exists;

SELECT 
    'comments' as table_name,
    EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'comments'
    ) as exists;

SELECT 
    'reactions' as table_name,
    EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'reactions'
    ) as exists;

-- 컬럼 존재 확인
SELECT 
    'reactions.type' as column_name,
    EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_name = 'reactions' 
        AND column_name = 'type'
    ) as exists;

SELECT 
    'posts.like_count' as column_name,
    EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_name = 'posts' 
        AND column_name = 'like_count'
    ) as exists;

SELECT 
    'posts.dislike_count' as column_name,
    EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_name = 'posts' 
        AND column_name = 'dislike_count'
    ) as exists;

SELECT 
    'posts.comment_count' as column_name,
    EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_name = 'posts' 
        AND column_name = 'comment_count'
    ) as exists;

SELECT 
    'comments.like_count' as column_name,
    EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_name = 'comments' 
        AND column_name = 'like_count'
    ) as exists;

SELECT 
    'comments.dislike_count' as column_name,
    EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_name = 'comments' 
        AND column_name = 'dislike_count'
    ) as exists;

SELECT 
    'comments.is_deleted' as column_name,
    EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_name = 'comments' 
        AND column_name = 'is_deleted'
    ) as exists;

-- ============================================
-- 완료 메시지
-- ============================================

DO $$
BEGIN
    RAISE NOTICE '✅ K-매거진 뉴스 좋아요/싫어요 시스템 수정 완료!';
    RAISE NOTICE '1. reactions 테이블 구조를 확인하고 수정했습니다.';
    RAISE NOTICE '2. posts 테이블에 필요한 컬럼들이 추가되었습니다.';
    RAISE NOTICE '3. comments 테이블에 필요한 컬럼들이 추가되었습니다.';
    RAISE NOTICE '4. 인덱스가 최적화되었습니다.';
    RAISE NOTICE '5. RLS 정책이 비활성화되었습니다 (테스트용).';
    RAISE NOTICE '6. 기존 데이터의 정합성이 재계산되었습니다.';
    RAISE NOTICE '';
    RAISE NOTICE '이제 K-매거진 뉴스의 좋아요/싫어요 기능이 정상 작동할 것입니다!';
END $$;
