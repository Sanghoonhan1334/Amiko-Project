-- 스토리 테이블 생성
CREATE TABLE IF NOT EXISTS stories (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  text_content TEXT NOT NULL,
  is_public BOOLEAN DEFAULT true,
  is_expired BOOLEAN DEFAULT false,
  expires_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '24 hours'),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_stories_user_id ON stories(user_id);
CREATE INDEX IF NOT EXISTS idx_stories_created_at ON stories(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_stories_is_public ON stories(is_public);
CREATE INDEX IF NOT EXISTS idx_stories_is_expired ON stories(is_expired);

-- 만료된 스토리 자동 삭제를 위한 함수
CREATE OR REPLACE FUNCTION delete_expired_stories()
RETURNS void AS $$
BEGIN
  DELETE FROM stories 
  WHERE expires_at < NOW() AND is_expired = false;
  
  -- 만료된 스토리를 표시
  UPDATE stories 
  SET is_expired = true 
  WHERE expires_at < NOW() AND is_expired = false;
END;
$$ LANGUAGE plpgsql;

-- RLS 정책 설정
ALTER TABLE stories ENABLE ROW LEVEL SECURITY;

-- 사용자는 자신의 스토리를 볼 수 있음
CREATE POLICY "Users can view their own stories" ON stories
  FOR SELECT USING (auth.uid() = user_id);

-- 공개 스토리는 모든 인증된 사용자가 볼 수 있음
CREATE POLICY "Users can view public stories" ON stories
  FOR SELECT USING (is_public = true AND is_expired = false);

-- 사용자는 자신의 스토리를 생성할 수 있음
CREATE POLICY "Users can create their own stories" ON stories
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 사용자는 자신의 스토리를 수정할 수 있음
CREATE POLICY "Users can update their own stories" ON stories
  FOR UPDATE USING (auth.uid() = user_id);

-- 사용자는 자신의 스토리를 삭제할 수 있음
CREATE POLICY "Users can delete their own stories" ON stories
  FOR DELETE USING (auth.uid() = user_id);

-- updated_at 자동 업데이트 트리거
CREATE OR REPLACE FUNCTION update_stories_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_stories_updated_at
  BEFORE UPDATE ON stories
  FOR EACH ROW
  EXECUTE FUNCTION update_stories_updated_at();
