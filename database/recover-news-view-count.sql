-- 기존 뉴스의 조회수 복구
-- 댓글/좋아요가 있는데 조회수가 0인 비정상 상태 해결

-- 1. 현재 상태 확인
SELECT 
  id,
  title_es,
  view_count,
  comment_count,
  like_count,
  created_at
FROM korean_news
WHERE view_count = 0 AND (comment_count > 0 OR like_count > 0)
ORDER BY created_at DESC;

-- 2. 조회수 추정 및 업데이트
-- 추정 공식:
--   - 기본: 댓글 수 * 15 (댓글 1개당 평균 15명 조회)
--   - 좋아요: 좋아요 수 * 10 (좋아요 1개당 평균 10명 조회)
--   - 최소값: 댓글 + 좋아요 수 (최소한 상호작용한 사람만큼은 봤음)
UPDATE korean_news
SET view_count = GREATEST(
  comment_count * 15 + like_count * 10,  -- 추정 조회수
  comment_count + like_count              -- 최소 조회수
)
WHERE view_count = 0 
  AND (comment_count > 0 OR like_count > 0);

-- 3. 업데이트 결과 확인
SELECT 
  id,
  title_es,
  view_count,
  comment_count,
  like_count,
  created_at
FROM korean_news
ORDER BY created_at DESC
LIMIT 10;

-- 4. 최종 통계
SELECT 
  COUNT(*) AS total_news,
  SUM(view_count) AS total_views,
  SUM(comment_count) AS total_comments,
  SUM(like_count) AS total_likes,
  AVG(view_count)::NUMERIC(10,2) AS avg_views
FROM korean_news;

