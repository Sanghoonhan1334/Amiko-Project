-- story_comments 테이블에 likes_count 컬럼 추가
ALTER TABLE story_comments ADD COLUMN IF NOT EXISTS likes_count INTEGER DEFAULT 0;

-- 기존 댓글들의 좋아요 수를 0으로 초기화
UPDATE story_comments SET likes_count = 0 WHERE likes_count IS NULL;
