-- K-매거진 뉴스 댓글 시스템 데이터베이스 설정
-- K-Magazine News Comment System Database Setup
-- 생성일: 2025-10-07

-- ============================================
-- 1. 뉴스 댓글 테이블 생성
-- ============================================

CREATE TABLE IF NOT EXISTS news_comments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  news_id UUID NOT NULL REFERENCES news(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  parent_comment_id UUID REFERENCES news_comments(id) ON DELETE CASCADE,
  like_count INTEGER DEFAULT 0,
  dislike_count INTEGER DEFAULT 0,
  is_deleted BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- 2. 뉴스 댓글 투표 테이블 생성
-- ============================================

CREATE TABLE IF NOT EXISTS news_comment_votes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  comment_id UUID NOT NULL REFERENCES news_comments(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  vote_type VARCHAR(10) NOT NULL CHECK (vote_type IN ('like', 'dislike')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(comment_id, user_id)
);

-- ============================================
-- 3. 인덱스 생성
-- ============================================

CREATE INDEX IF NOT EXISTS idx_news_comments_news_id ON news_comments(news_id);
CREATE INDEX IF NOT EXISTS idx_news_comments_user_id ON news_comments(user_id);
CREATE INDEX IF NOT EXISTS idx_news_comments_parent_id ON news_comments(parent_comment_id);
CREATE INDEX IF NOT EXISTS idx_news_comments_created_at ON news_comments(created_at);
CREATE INDEX IF NOT EXISTS idx_news_comments_not_deleted ON news_comments(news_id) WHERE is_deleted = false;

CREATE INDEX IF NOT EXISTS idx_news_comment_votes_comment_id ON news_comment_votes(comment_id);
CREATE INDEX IF NOT EXISTS idx_news_comment_votes_user_id ON news_comment_votes(user_id);
CREATE INDEX IF NOT EXISTS idx_news_comment_votes_comment_user ON news_comment_votes(comment_id, user_id);

-- ============================================
-- 4. 뉴스 댓글 수 증가 함수
-- ============================================

CREATE OR REPLACE FUNCTION increment_news_comment_count(news_id UUID)
RETURNS VOID AS $$
BEGIN
    -- news 테이블의 comment_count를 1 증가
    UPDATE news 
    SET 
        comment_count = COALESCE(comment_count, 0) + 1,
        updated_at = NOW()
    WHERE id = news_id;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- 5. 뉴스 댓글 수 감소 함수
-- ============================================

CREATE OR REPLACE FUNCTION decrement_news_comment_count(news_id UUID)
RETURNS VOID AS $$
BEGIN
    UPDATE news 
    SET 
        comment_count = GREATEST(0, COALESCE(comment_count, 0) - 1),
        updated_at = NOW()
    WHERE id = news_id;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- 6. 뉴스 댓글 투표 처리 함수
-- ============================================

CREATE OR REPLACE FUNCTION handle_news_comment_vote(
  p_comment_id UUID,
  p_user_id UUID,
  p_vote_type VARCHAR(10),
  p_like_change INTEGER,
  p_dislike_change INTEGER
)
RETURNS VOID AS $$
BEGIN
  -- 기존 투표 삭제 또는 업데이트
  IF p_vote_type IS NULL THEN
    -- 투표 취소
    DELETE FROM news_comment_votes 
    WHERE comment_id = p_comment_id AND user_id = p_user_id;
  ELSE
    -- 투표 추가 또는 업데이트
    INSERT INTO news_comment_votes (comment_id, user_id, vote_type)
    VALUES (p_comment_id, p_user_id, p_vote_type)
    ON CONFLICT (comment_id, user_id)
    DO UPDATE SET 
      vote_type = p_vote_type,
      updated_at = NOW();
  END IF;

  -- 댓글 카운트 업데이트
  UPDATE news_comments 
  SET 
    like_count = GREATEST(0, like_count + p_like_change),
    dislike_count = GREATEST(0, dislike_count + p_dislike_change),
    updated_at = NOW()
  WHERE id = p_comment_id;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- 7. 뉴스 테이블에 comment_count 컬럼 추가 (없을 경우)
-- ============================================

DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'news' 
        AND column_name = 'comment_count'
    ) THEN
        ALTER TABLE news 
        ADD COLUMN comment_count INTEGER DEFAULT 0;
        
        -- 기존 뉴스의 댓글 수 계산
        UPDATE news 
        SET comment_count = (
            SELECT COUNT(*)
            FROM news_comments nc
            WHERE nc.news_id = news.id 
            AND nc.is_deleted = false
        );
    END IF;
END $$;

-- ============================================
-- 8. RLS 정책 설정 (테스트용으로 비활성화)
-- ============================================

-- RLS 비활성화 (테스트용)
ALTER TABLE news_comments DISABLE ROW LEVEL SECURITY;
ALTER TABLE news_comment_votes DISABLE ROW LEVEL SECURITY;

-- 기존 정책 삭제 (있을 경우)
DROP POLICY IF EXISTS "Anyone can view news comments" ON news_comments;
DROP POLICY IF EXISTS "Users can insert their own news comments" ON news_comments;
DROP POLICY IF EXISTS "Users can update their own news comments" ON news_comments;
DROP POLICY IF EXISTS "Users can delete their own news comments" ON news_comments;

DROP POLICY IF EXISTS "Users can view their own news comment votes" ON news_comment_votes;
DROP POLICY IF EXISTS "Users can insert their own news comment votes" ON news_comment_votes;
DROP POLICY IF EXISTS "Users can update their own news comment votes" ON news_comment_votes;
DROP POLICY IF EXISTS "Users can delete their own news comment votes" ON news_comment_votes;

-- ============================================
-- 9. 뉴스 댓글 수 정확성 검증 및 재계산 함수
-- ============================================

CREATE OR REPLACE FUNCTION recalculate_news_comment_counts()
RETURNS void AS $$
BEGIN
    UPDATE news n
    SET comment_count = (
        SELECT COUNT(*)
        FROM news_comments nc
        WHERE nc.news_id = n.id 
        AND nc.is_deleted = false
    );
END;
$$ LANGUAGE plpgsql;

-- 모든 뉴스의 댓글 수 재계산
SELECT recalculate_news_comment_counts();

-- ============================================
-- 10. 테스트용 확인 쿼리
-- ============================================

-- 테이블 존재 확인
SELECT 
    'news_comments' as table_name,
    EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'news_comments'
    ) as exists;

SELECT 
    'news_comment_votes' as table_name,
    EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'news_comment_votes'
    ) as exists;

-- 함수 존재 확인
SELECT 
    'increment_news_comment_count' as function_name,
    EXISTS (
        SELECT FROM pg_proc 
        WHERE proname = 'increment_news_comment_count'
    ) as exists;

SELECT 
    'decrement_news_comment_count' as function_name,
    EXISTS (
        SELECT FROM pg_proc 
        WHERE proname = 'decrement_news_comment_count'
    ) as exists;

SELECT 
    'handle_news_comment_vote' as function_name,
    EXISTS (
        SELECT FROM pg_proc 
        WHERE proname = 'handle_news_comment_vote'
    ) as exists;

-- news 테이블에 comment_count 컬럼 확인
SELECT 
    'news.comment_count' as column_name,
    EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_name = 'news' 
        AND column_name = 'comment_count'
    ) as exists;

-- ============================================
-- 완료 메시지
-- ============================================

DO $$
BEGIN
    RAISE NOTICE '✅ K-매거진 뉴스 댓글 시스템 설정 완료!';
    RAISE NOTICE '1. news_comments 테이블이 생성되었습니다.';
    RAISE NOTICE '2. news_comment_votes 테이블이 생성되었습니다.';
    RAISE NOTICE '3. increment_news_comment_count 함수가 추가되었습니다.';
    RAISE NOTICE '4. decrement_news_comment_count 함수가 추가되었습니다.';
    RAISE NOTICE '5. handle_news_comment_vote 함수가 추가되었습니다.';
    RAISE NOTICE '6. news 테이블에 comment_count 컬럼이 추가되었습니다.';
    RAISE NOTICE '7. 인덱스가 최적화되었습니다.';
    RAISE NOTICE '8. 기존 데이터의 정합성이 재계산되었습니다.';
    RAISE NOTICE '';
    RAISE NOTICE '⚠️ 주의: 프로덕션 환경에서는 RLS 정책을 재설정해야 합니다!';
END $$;
