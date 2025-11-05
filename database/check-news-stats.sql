-- 뉴스 통계 컬럼 확인 및 추가
-- 조회수, 좋아요, 댓글 수가 모두 0으로 표시되는 문제 해결

-- 1. 현재 korean_news 테이블 컬럼 확인
SELECT 
  column_name, 
  data_type, 
  column_default,
  is_nullable
FROM information_schema.columns
WHERE table_name = 'korean_news'
  AND column_name IN ('view_count', 'comment_count', 'like_count')
ORDER BY column_name;

-- 2. 통계 컬럼이 없다면 추가
DO $$ 
BEGIN
  -- view_count 컬럼 추가 (조회수)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'korean_news' AND column_name = 'view_count'
  ) THEN
    ALTER TABLE korean_news ADD COLUMN view_count INTEGER DEFAULT 0;
    COMMENT ON COLUMN korean_news.view_count IS '조회수';
  END IF;

  -- comment_count 컬럼 추가 (댓글 수)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'korean_news' AND column_name = 'comment_count'
  ) THEN
    ALTER TABLE korean_news ADD COLUMN comment_count INTEGER DEFAULT 0;
    COMMENT ON COLUMN korean_news.comment_count IS '댓글 수';
  END IF;

  -- like_count 컬럼 추가 (좋아요 수)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'korean_news' AND column_name = 'like_count'
  ) THEN
    ALTER TABLE korean_news ADD COLUMN like_count INTEGER DEFAULT 0;
    COMMENT ON COLUMN korean_news.like_count IS '좋아요 수';
  END IF;
END $$;

-- 3. 현재 뉴스 데이터 확인
SELECT 
  id,
  title,
  title_es,
  view_count,
  comment_count,
  like_count,
  created_at
FROM korean_news
ORDER BY created_at DESC
LIMIT 10;

-- 4. NULL 값을 0으로 업데이트 (있다면)
UPDATE korean_news 
SET 
  view_count = COALESCE(view_count, 0),
  comment_count = COALESCE(comment_count, 0),
  like_count = COALESCE(like_count, 0)
WHERE 
  view_count IS NULL OR 
  comment_count IS NULL OR 
  like_count IS NULL;

-- 5. 통계 확인
SELECT 
  COUNT(*) AS total_news,
  SUM(view_count) AS total_views,
  SUM(comment_count) AS total_comments,
  SUM(like_count) AS total_likes,
  AVG(view_count) AS avg_views
FROM korean_news;

