-- 스토리 좋아요 테이블 생성
CREATE TABLE IF NOT EXISTS story_likes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  story_id UUID NOT NULL REFERENCES stories(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(story_id, user_id) -- 한 사용자가 한 스토리에 한 번만 좋아요 가능
);

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_story_likes_story_id ON story_likes(story_id);
CREATE INDEX IF NOT EXISTS idx_story_likes_user_id ON story_likes(user_id);

-- RLS 정책 설정
ALTER TABLE story_likes ENABLE ROW LEVEL SECURITY;

-- 사용자는 모든 좋아요를 볼 수 있음
CREATE POLICY "Users can view all story likes" ON story_likes
  FOR SELECT USING (true);

-- 사용자는 좋아요를 생성할 수 있음
CREATE POLICY "Users can create story likes" ON story_likes
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 사용자는 자신의 좋아요를 삭제할 수 있음
CREATE POLICY "Users can delete their own story likes" ON story_likes
  FOR DELETE USING (auth.uid() = user_id);

-- 스토리 댓글 테이블 생성 (이미 있다면 무시)
CREATE TABLE IF NOT EXISTS story_comments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  story_id UUID NOT NULL REFERENCES stories(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_story_comments_story_id ON story_comments(story_id);
CREATE INDEX IF NOT EXISTS idx_story_comments_user_id ON story_comments(user_id);

-- RLS 정책 설정
ALTER TABLE story_comments ENABLE ROW LEVEL SECURITY;

-- 사용자는 모든 댓글을 볼 수 있음
CREATE POLICY "Users can view all story comments" ON story_comments
  FOR SELECT USING (true);

-- 사용자는 댓글을 생성할 수 있음
CREATE POLICY "Users can create story comments" ON story_comments
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 사용자는 자신의 댓글을 수정할 수 있음
CREATE POLICY "Users can update their own story comments" ON story_comments
  FOR UPDATE USING (auth.uid() = user_id);

-- 사용자는 자신의 댓글을 삭제할 수 있음
CREATE POLICY "Users can delete their own story comments" ON story_comments
  FOR DELETE USING (auth.uid() = user_id);

-- updated_at 자동 업데이트 트리거
CREATE OR REPLACE FUNCTION update_story_comments_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_story_comments_updated_at
  BEFORE UPDATE ON story_comments
  FOR EACH ROW
  EXECUTE FUNCTION update_story_comments_updated_at();
