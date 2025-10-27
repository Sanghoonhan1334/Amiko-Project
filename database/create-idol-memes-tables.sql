-- Idol Memes 게시판 테이블
CREATE TABLE IF NOT EXISTS idol_memes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  content TEXT,
  media_url TEXT,
  media_type TEXT CHECK (media_type IN ('image', 'video')),
  thumbnail_url TEXT,
  author_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  author_name TEXT,
  views INTEGER DEFAULT 0,
  likes_count INTEGER DEFAULT 0,
  comments_count INTEGER DEFAULT 0,
  category TEXT,  -- 그룹명 (예: 'BTS', 'BLACKPINK', 'NewJeans')
  tags TEXT[],
  is_pinned BOOLEAN DEFAULT FALSE,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 좋아요 테이블
CREATE TABLE IF NOT EXISTS idol_memes_likes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID REFERENCES idol_memes(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(post_id, user_id)
);

-- 댓글 테이블
CREATE TABLE IF NOT EXISTS idol_memes_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID REFERENCES idol_memes(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_idol_memes_created_at ON idol_memes(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_idol_memes_views ON idol_memes(views DESC);
CREATE INDEX IF NOT EXISTS idx_idol_memes_likes_count ON idol_memes(likes_count DESC);
CREATE INDEX IF NOT EXISTS idx_idol_memes_category ON idol_memes(category);
CREATE INDEX IF NOT EXISTS idx_idol_memes_likes_post ON idol_memes_likes(post_id);
CREATE INDEX IF NOT EXISTS idx_idol_memes_likes_user ON idol_memes_likes(user_id);
CREATE INDEX IF NOT EXISTS idx_idol_memes_comments_post ON idol_memes_comments(post_id);

-- RLS 활성화
ALTER TABLE idol_memes ENABLE ROW LEVEL SECURITY;
ALTER TABLE idol_memes_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE idol_memes_comments ENABLE ROW LEVEL SECURITY;

-- RLS 정책: 모든 사용자가 게시물 조회 가능
CREATE POLICY "Anyone can view idol memes" ON idol_memes
  FOR SELECT USING (is_active = true);

-- RLS 정책: 인증된 사용자만 게시물 작성 가능
CREATE POLICY "Authenticated users can create idol memes" ON idol_memes
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- RLS 정책: 작성자만 수정/삭제 가능
CREATE POLICY "Users can update their own idol memes" ON idol_memes
  FOR UPDATE USING (auth.uid() = author_id);

CREATE POLICY "Users can delete their own idol memes" ON idol_memes
  FOR DELETE USING (auth.uid() = author_id);

-- 좋아요 정책
CREATE POLICY "Anyone can view likes" ON idol_memes_likes
  FOR SELECT USING (true);

CREATE POLICY "Authenticated users can like" ON idol_memes_likes
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Users can unlike their likes" ON idol_memes_likes
  FOR DELETE USING (auth.uid() = user_id);

-- 댓글 정책
CREATE POLICY "Anyone can view comments" ON idol_memes_comments
  FOR SELECT USING (true);

CREATE POLICY "Authenticated users can comment" ON idol_memes_comments
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Users can update their comments" ON idol_memes_comments
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their comments" ON idol_memes_comments
  FOR DELETE USING (auth.uid() = user_id);

-- 업데이트 시간 자동 갱신 함수
CREATE OR REPLACE FUNCTION update_idol_memes_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_idol_memes_updated_at
  BEFORE UPDATE ON idol_memes
  FOR EACH ROW
  EXECUTE FUNCTION update_idol_memes_updated_at();

-- 댓글 갯수 자동 갱신 함수
CREATE OR REPLACE FUNCTION update_idol_memes_comments_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE idol_memes SET comments_count = comments_count + 1 WHERE id = NEW.post_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE idol_memes SET comments_count = comments_count - 1 WHERE id = OLD.post_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_idol_memes_comments_count
  AFTER INSERT OR DELETE ON idol_memes_comments
  FOR EACH ROW
  EXECUTE FUNCTION update_idol_memes_comments_count();

-- 좋아요 갯수 자동 갱신 함수
CREATE OR REPLACE FUNCTION update_idol_memes_likes_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE idol_memes SET likes_count = likes_count + 1 WHERE id = NEW.post_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE idol_memes SET likes_count = likes_count - 1 WHERE id = OLD.post_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_idol_memes_likes_count
  AFTER INSERT OR DELETE ON idol_memes_likes
  FOR EACH ROW
  EXECUTE FUNCTION update_idol_memes_likes_count();
