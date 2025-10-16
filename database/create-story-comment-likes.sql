-- 댓글 좋아요 테이블 생성
CREATE TABLE IF NOT EXISTS story_comment_likes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  comment_id UUID NOT NULL REFERENCES story_comments(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(comment_id, user_id)
);

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_story_comment_likes_comment_id ON story_comment_likes(comment_id);
CREATE INDEX IF NOT EXISTS idx_story_comment_likes_user_id ON story_comment_likes(user_id);

-- RLS 활성화
ALTER TABLE story_comment_likes ENABLE ROW LEVEL SECURITY;

-- 정책 생성
CREATE POLICY "Users can view all comment likes" ON story_comment_likes
  FOR SELECT USING (true);

CREATE POLICY "Users can like their own comments" ON story_comment_likes
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can unlike their own comments" ON story_comment_likes
  FOR DELETE USING (auth.uid() = user_id);

-- 댓글 좋아요 수를 증가/감소시키는 함수
CREATE OR REPLACE FUNCTION increment_comment_like_count(comment_id_param UUID)
RETURNS void AS $$
BEGIN
  UPDATE story_comments 
  SET likes_count = COALESCE(likes_count, 0) + 1
  WHERE id = comment_id_param;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION decrement_comment_like_count(comment_id_param UUID)
RETURNS void AS $$
BEGIN
  UPDATE story_comments 
  SET likes_count = GREATEST(COALESCE(likes_count, 0) - 1, 0)
  WHERE id = comment_id_param;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 트리거 생성 (좋아요 추가 시)
CREATE OR REPLACE FUNCTION handle_comment_like_insert()
RETURNS TRIGGER AS $$
BEGIN
  PERFORM increment_comment_like_count(NEW.comment_id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_comment_like_insert
  AFTER INSERT ON story_comment_likes
  FOR EACH ROW EXECUTE FUNCTION handle_comment_like_insert();

-- 트리거 생성 (좋아요 삭제 시)
CREATE OR REPLACE FUNCTION handle_comment_like_delete()
RETURNS TRIGGER AS $$
BEGIN
  PERFORM decrement_comment_like_count(OLD.comment_id);
  RETURN OLD;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_comment_like_delete
  AFTER DELETE ON story_comment_likes
  FOR EACH ROW EXECUTE FUNCTION handle_comment_like_delete();
