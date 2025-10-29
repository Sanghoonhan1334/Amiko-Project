-- Fan Art 게시판 테이블
CREATE TABLE IF NOT EXISTS fan_art (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  content TEXT,
  image_url TEXT NOT NULL,
  author_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  author_name TEXT,
  views INTEGER DEFAULT 0,
  likes_count INTEGER DEFAULT 0,
  comments_count INTEGER DEFAULT 0,
  category TEXT CHECK (category IN ('Portrait', 'Group', 'Chibi', 'Digital', 'Traditional', 'Other')),
  tags TEXT[],
  is_pinned BOOLEAN DEFAULT FALSE,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 좋아요 테이블
CREATE TABLE IF NOT EXISTS fan_art_likes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID REFERENCES fan_art(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(post_id, user_id)
);

-- 댓글 테이블
CREATE TABLE IF NOT EXISTS fan_art_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID REFERENCES fan_art(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_fan_art_created_at ON fan_art(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_fan_art_views ON fan_art(views DESC);
CREATE INDEX IF NOT EXISTS idx_fan_art_likes_count ON fan_art(likes_count DESC);
CREATE INDEX IF NOT EXISTS idx_fan_art_category ON fan_art(category);
CREATE INDEX IF NOT EXISTS idx_fan_art_likes_post ON fan_art_likes(post_id);
CREATE INDEX IF NOT EXISTS idx_fan_art_likes_user ON fan_art_likes(user_id);
CREATE INDEX IF NOT EXISTS idx_fan_art_comments_post ON fan_art_comments(post_id);

-- RLS 활성화
ALTER TABLE fan_art ENABLE ROW LEVEL SECURITY;
ALTER TABLE fan_art_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE fan_art_comments ENABLE ROW LEVEL SECURITY;

-- 기존 정책 삭제 (있는 경우)
DROP POLICY IF EXISTS "Anyone can view fan art" ON fan_art;
DROP POLICY IF EXISTS "Authenticated users can create fan art" ON fan_art;
DROP POLICY IF EXISTS "Users can update their own fan art" ON fan_art;
DROP POLICY IF EXISTS "Users can delete their own fan art" ON fan_art;
DROP POLICY IF EXISTS "Anyone can view likes" ON fan_art_likes;
DROP POLICY IF EXISTS "Authenticated users can like" ON fan_art_likes;
DROP POLICY IF EXISTS "Users can unlike their likes" ON fan_art_likes;
DROP POLICY IF EXISTS "Anyone can view comments" ON fan_art_comments;
DROP POLICY IF EXISTS "Authenticated users can comment" ON fan_art_comments;
DROP POLICY IF EXISTS "Users can update their comments" ON fan_art_comments;
DROP POLICY IF EXISTS "Users can delete their comments" ON fan_art_comments;

-- RLS 정책: 모든 사용자가 게시물 조회 가능
CREATE POLICY "Anyone can view fan art" ON fan_art
  FOR SELECT USING (is_active = true);

-- RLS 정책: 인증된 사용자만 게시물 작성 가능
CREATE POLICY "Authenticated users can create fan art" ON fan_art
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- RLS 정책: 작성자만 수정/삭제 가능
CREATE POLICY "Users can update their own fan art" ON fan_art
  FOR UPDATE USING (auth.uid() = author_id);

CREATE POLICY "Users can delete their own fan art" ON fan_art
  FOR DELETE USING (auth.uid() = author_id);

-- 좋아요 정책
CREATE POLICY "Anyone can view likes" ON fan_art_likes
  FOR SELECT USING (true);

CREATE POLICY "Authenticated users can like" ON fan_art_likes
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Users can unlike their likes" ON fan_art_likes
  FOR DELETE USING (auth.uid() = user_id);

-- 댓글 정책
CREATE POLICY "Anyone can view comments" ON fan_art_comments
  FOR SELECT USING (true);

CREATE POLICY "Authenticated users can comment" ON fan_art_comments
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Users can update their comments" ON fan_art_comments
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their comments" ON fan_art_comments
  FOR DELETE USING (auth.uid() = user_id);

-- 업데이트 시간 자동 갱신 함수
CREATE OR REPLACE FUNCTION update_fan_art_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_fan_art_updated_at ON fan_art;
CREATE TRIGGER update_fan_art_updated_at
  BEFORE UPDATE ON fan_art
  FOR EACH ROW
  EXECUTE FUNCTION update_fan_art_updated_at();

-- 댓글 갯수 자동 갱신 함수
CREATE OR REPLACE FUNCTION update_fan_art_comments_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE fan_art SET comments_count = comments_count + 1 WHERE id = NEW.post_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE fan_art SET comments_count = comments_count - 1 WHERE id = OLD.post_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_fan_art_comments_count ON fan_art_comments;
CREATE TRIGGER update_fan_art_comments_count
  AFTER INSERT OR DELETE ON fan_art_comments
  FOR EACH ROW
  EXECUTE FUNCTION update_fan_art_comments_count();

-- 좋아요 갯수 자동 갱신 함수
CREATE OR REPLACE FUNCTION update_fan_art_likes_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE fan_art SET likes_count = likes_count + 1 WHERE id = NEW.post_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE fan_art SET likes_count = likes_count - 1 WHERE id = OLD.post_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_fan_art_likes_count ON fan_art_likes;
CREATE TRIGGER update_fan_art_likes_count
  AFTER INSERT OR DELETE ON fan_art_likes
  FOR EACH ROW
  EXECUTE FUNCTION update_fan_art_likes_count();

