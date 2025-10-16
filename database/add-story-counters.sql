-- 스토리 테이블에 좋아요 수와 댓글 수 컬럼 추가
ALTER TABLE stories 
ADD COLUMN IF NOT EXISTS like_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS comment_count INTEGER DEFAULT 0;

-- 기존 스토리의 카운터를 0으로 초기화
UPDATE stories 
SET like_count = 0, comment_count = 0 
WHERE like_count IS NULL OR comment_count IS NULL;

-- 좋아요 수 증가 함수
CREATE OR REPLACE FUNCTION increment_story_like_count(story_id_param UUID)
RETURNS void AS $$
BEGIN
  UPDATE stories 
  SET like_count = COALESCE(like_count, 0) + 1
  WHERE id = story_id_param;
END;
$$ LANGUAGE plpgsql;

-- 좋아요 수 감소 함수
CREATE OR REPLACE FUNCTION decrement_story_like_count(story_id_param UUID)
RETURNS void AS $$
BEGIN
  UPDATE stories 
  SET like_count = GREATEST(COALESCE(like_count, 0) - 1, 0)
  WHERE id = story_id_param;
END;
$$ LANGUAGE plpgsql;

-- 댓글 수 증가 함수
CREATE OR REPLACE FUNCTION increment_story_comment_count(story_id_param UUID)
RETURNS void AS $$
BEGIN
  UPDATE stories 
  SET comment_count = COALESCE(comment_count, 0) + 1
  WHERE id = story_id_param;
END;
$$ LANGUAGE plpgsql;

-- 댓글 수 감소 함수
CREATE OR REPLACE FUNCTION decrement_story_comment_count(story_id_param UUID)
RETURNS void AS $$
BEGIN
  UPDATE stories 
  SET comment_count = GREATEST(COALESCE(comment_count, 0) - 1, 0)
  WHERE id = story_id_param;
END;
$$ LANGUAGE plpgsql;
