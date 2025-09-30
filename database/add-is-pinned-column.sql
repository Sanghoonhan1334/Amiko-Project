-- 뉴스 테이블에 고정 상태 컬럼 추가
-- Add is_pinned column to korean_news table

ALTER TABLE korean_news 
ADD COLUMN is_pinned BOOLEAN DEFAULT FALSE;

-- 기존 뉴스들은 모두 고정되지 않은 상태로 설정
UPDATE korean_news 
SET is_pinned = FALSE 
WHERE is_pinned IS NULL;

-- 인덱스 추가 (고정된 뉴스를 빠르게 조회하기 위해)
CREATE INDEX IF NOT EXISTS idx_korean_news_is_pinned 
ON korean_news(is_pinned);

-- 댓글 추가
COMMENT ON COLUMN korean_news.is_pinned IS '뉴스 고정 상태 (TRUE: 고정됨, FALSE: 고정되지 않음)';
