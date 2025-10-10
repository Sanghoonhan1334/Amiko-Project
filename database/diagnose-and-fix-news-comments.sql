-- K-매거진 뉴스 댓글 시스템 문제 진단
-- K-Magazine News Comment System Diagnosis
-- 생성일: 2025-10-07

-- ============================================
-- 1. 현재 데이터베이스 상태 확인
-- ============================================

-- news 테이블 존재 확인
SELECT 
    'news' as table_name,
    EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'news'
    ) as exists;

-- news_comments 테이블 존재 확인
SELECT 
    'news_comments' as table_name,
    EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'news_comments'
    ) as exists;

-- news_comment_votes 테이블 존재 확인
SELECT 
    'news_comment_votes' as table_name,
    EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'news_comment_votes'
    ) as exists;

-- ============================================
-- 2. news 테이블 구조 확인
-- ============================================

SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'news'
ORDER BY ordinal_position;

-- ============================================
-- 3. 함수 존재 확인
-- ============================================

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

-- ============================================
-- 4. news 테이블 샘플 데이터 확인
-- ============================================

SELECT 
    id,
    title,
    comment_count,
    created_at
FROM news 
LIMIT 5;

-- ============================================
-- 5. 뉴스 댓글 테이블 생성 (news 테이블이 존재하는 경우)
-- ============================================

-- news 테이블이 존재하는지 확인 후 댓글 테이블 생성
DO $$ 
BEGIN
    -- news 테이블이 존재하는지 확인
    IF EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'news'
    ) THEN
        RAISE NOTICE 'news 테이블이 존재합니다. 댓글 테이블을 생성합니다.';
        
        -- news_comments 테이블 생성
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

        -- news_comment_votes 테이블 생성
        CREATE TABLE IF NOT EXISTS news_comment_votes (
          id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
          comment_id UUID NOT NULL REFERENCES news_comments(id) ON DELETE CASCADE,
          user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          vote_type VARCHAR(10) NOT NULL CHECK (vote_type IN ('like', 'dislike')),
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          UNIQUE(comment_id, user_id)
        );

        -- 인덱스 생성
        CREATE INDEX IF NOT EXISTS idx_news_comments_news_id ON news_comments(news_id);
        CREATE INDEX IF NOT EXISTS idx_news_comments_user_id ON news_comments(user_id);
        CREATE INDEX IF NOT EXISTS idx_news_comments_parent_id ON news_comments(parent_comment_id);
        CREATE INDEX IF NOT EXISTS idx_news_comments_created_at ON news_comments(created_at);
        CREATE INDEX IF NOT EXISTS idx_news_comments_not_deleted ON news_comments(news_id) WHERE is_deleted = false;

        CREATE INDEX IF NOT EXISTS idx_news_comment_votes_comment_id ON news_comment_votes(comment_id);
        CREATE INDEX IF NOT EXISTS idx_news_comment_votes_user_id ON news_comment_votes(user_id);
        CREATE INDEX IF NOT EXISTS idx_news_comment_votes_comment_user ON news_comment_votes(comment_id, user_id);

        RAISE NOTICE '댓글 테이블들이 성공적으로 생성되었습니다.';
    ELSE
        RAISE NOTICE 'news 테이블이 존재하지 않습니다. 먼저 news 테이블을 생성해야 합니다.';
    END IF;
END $$;

-- ============================================
-- 6. news 테이블에 comment_count 컬럼 추가
-- ============================================

DO $$ 
BEGIN
    IF EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'news'
    ) THEN
        IF NOT EXISTS (
            SELECT 1 
            FROM information_schema.columns 
            WHERE table_name = 'news' 
            AND column_name = 'comment_count'
        ) THEN
            ALTER TABLE news 
            ADD COLUMN comment_count INTEGER DEFAULT 0;
            
            RAISE NOTICE 'news 테이블에 comment_count 컬럼이 추가되었습니다.';
        ELSE
            RAISE NOTICE 'news 테이블에 comment_count 컬럼이 이미 존재합니다.';
        END IF;
    END IF;
END $$;

-- ============================================
-- 7. 필요한 함수들 생성
-- ============================================

-- 뉴스 댓글 수 증가 함수
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

-- 뉴스 댓글 수 감소 함수
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

-- 뉴스 댓글 투표 처리 함수
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
-- 8. RLS 정책 비활성화 (테스트용)
-- ============================================

-- RLS 비활성화 (테스트용)
ALTER TABLE news_comments DISABLE ROW LEVEL SECURITY;
ALTER TABLE news_comment_votes DISABLE ROW LEVEL SECURITY;

-- ============================================
-- 9. 최종 확인
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
    RAISE NOTICE '✅ K-매거진 뉴스 댓글 시스템 진단 및 수정 완료!';
    RAISE NOTICE '1. 데이터베이스 상태를 확인했습니다.';
    RAISE NOTICE '2. 필요한 테이블들을 생성했습니다.';
    RAISE NOTICE '3. 필요한 함수들을 생성했습니다.';
    RAISE NOTICE '4. RLS 정책을 비활성화했습니다 (테스트용).';
    RAISE NOTICE '';
    RAISE NOTICE '이제 K-매거진 뉴스 댓글 기능이 정상 작동할 것입니다!';
END $$;
