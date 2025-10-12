-- 갤러리 시스템을 위한 테이블들
-- 기존 supabase-schema.sql에 추가할 스키마

-- 갤러리 테이블
CREATE TABLE IF NOT EXISTS galleries (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  slug TEXT UNIQUE NOT NULL,
  name_ko TEXT NOT NULL,
  name_es TEXT,
  description_ko TEXT,
  description_es TEXT,
  icon TEXT NOT NULL,
  color TEXT NOT NULL,
  post_count INTEGER DEFAULT 0,
  comment_count INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 갤러리 게시물 테이블
CREATE TABLE IF NOT EXISTS gallery_posts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  gallery_id UUID REFERENCES galleries(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  category_name TEXT DEFAULT '자유게시판',
  is_notice BOOLEAN DEFAULT false,
  is_survey BOOLEAN DEFAULT false,
  is_pinned BOOLEAN DEFAULT false,
  is_deleted BOOLEAN DEFAULT false,
  view_count INTEGER DEFAULT 0,
  like_count INTEGER DEFAULT 0,
  comment_count INTEGER DEFAULT 0,
  images TEXT[], -- 이미지 URL 배열
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 갤러리 댓글 테이블
CREATE TABLE IF NOT EXISTS gallery_comments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id UUID REFERENCES gallery_posts(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  parent_id UUID REFERENCES gallery_comments(id) ON DELETE CASCADE, -- 대댓글용
  content TEXT NOT NULL,
  is_deleted BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 갤러리 좋아요 테이블
CREATE TABLE IF NOT EXISTS gallery_likes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id UUID REFERENCES gallery_posts(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(post_id, user_id) -- 사용자당 게시물당 하나의 좋아요만
);

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_galleries_slug ON galleries(slug);
CREATE INDEX IF NOT EXISTS idx_galleries_is_active ON galleries(is_active);
CREATE INDEX IF NOT EXISTS idx_galleries_sort_order ON galleries(sort_order);
CREATE INDEX IF NOT EXISTS idx_gallery_posts_gallery_id ON gallery_posts(gallery_id);
CREATE INDEX IF NOT EXISTS idx_gallery_posts_user_id ON gallery_posts(user_id);
CREATE INDEX IF NOT EXISTS idx_gallery_posts_created_at ON gallery_posts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_gallery_posts_is_deleted ON gallery_posts(is_deleted);
CREATE INDEX IF NOT EXISTS idx_gallery_posts_is_pinned ON gallery_posts(is_pinned);
CREATE INDEX IF NOT EXISTS idx_gallery_comments_post_id ON gallery_comments(post_id);
CREATE INDEX IF NOT EXISTS idx_gallery_comments_user_id ON gallery_comments(user_id);
CREATE INDEX IF NOT EXISTS idx_gallery_likes_post_id ON gallery_likes(post_id);
CREATE INDEX IF NOT EXISTS idx_gallery_likes_user_id ON gallery_likes(user_id);

-- RLS (Row Level Security) 정책
ALTER TABLE galleries ENABLE ROW LEVEL SECURITY;
ALTER TABLE gallery_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE gallery_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE gallery_likes ENABLE ROW LEVEL SECURITY;

-- 갤러리 정책
CREATE POLICY "Anyone can view galleries" ON galleries FOR SELECT USING (true);

-- 갤러리 게시물 정책
CREATE POLICY "Anyone can view gallery posts" ON gallery_posts FOR SELECT USING (is_deleted = false);
CREATE POLICY "Users can create gallery posts" ON gallery_posts FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own gallery posts" ON gallery_posts FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own gallery posts" ON gallery_posts FOR DELETE USING (auth.uid() = user_id);

-- 갤러리 댓글 정책
CREATE POLICY "Anyone can view gallery comments" ON gallery_comments FOR SELECT USING (is_deleted = false);
CREATE POLICY "Users can create gallery comments" ON gallery_comments FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own gallery comments" ON gallery_comments FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own gallery comments" ON gallery_comments FOR DELETE USING (auth.uid() = user_id);

-- 갤러리 좋아요 정책
CREATE POLICY "Anyone can view gallery likes" ON gallery_likes FOR SELECT USING (true);
CREATE POLICY "Users can create gallery likes" ON gallery_likes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own gallery likes" ON gallery_likes FOR DELETE USING (auth.uid() = user_id);

-- 트리거 추가
CREATE TRIGGER update_galleries_updated_at BEFORE UPDATE ON galleries
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_gallery_posts_updated_at BEFORE UPDATE ON gallery_posts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_gallery_comments_updated_at BEFORE UPDATE ON gallery_comments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 갤러리 게시물 수 자동 업데이트 함수
CREATE OR REPLACE FUNCTION update_gallery_post_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE galleries 
    SET post_count = post_count + 1 
    WHERE id = NEW.gallery_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE galleries 
    SET post_count = post_count - 1 
    WHERE id = OLD.gallery_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ language 'plpgsql';

-- 갤러리 게시물 수 트리거
CREATE TRIGGER gallery_post_count_trigger
  AFTER INSERT OR DELETE ON gallery_posts
  FOR EACH ROW EXECUTE FUNCTION update_gallery_post_count();

-- 갤러리 댓글 수 자동 업데이트 함수
CREATE OR REPLACE FUNCTION update_gallery_comment_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE gallery_posts 
    SET comment_count = comment_count + 1 
    WHERE id = NEW.post_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE gallery_posts 
    SET comment_count = comment_count - 1 
    WHERE id = OLD.post_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ language 'plpgsql';

-- 갤러리 댓글 수 트리거
CREATE TRIGGER gallery_comment_count_trigger
  AFTER INSERT OR DELETE ON gallery_comments
  FOR EACH ROW EXECUTE FUNCTION update_gallery_comment_count();

-- 갤러리 좋아요 수 자동 업데이트 함수
CREATE OR REPLACE FUNCTION update_gallery_like_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE gallery_posts 
    SET like_count = like_count + 1 
    WHERE id = NEW.post_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE gallery_posts 
    SET like_count = like_count - 1 
    WHERE id = OLD.post_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ language 'plpgsql';

-- 갤러리 좋아요 수 트리거
CREATE TRIGGER gallery_like_count_trigger
  AFTER INSERT OR DELETE ON gallery_likes
  FOR EACH ROW EXECUTE FUNCTION update_gallery_like_count();

-- 기본 갤러리 데이터 삽입
INSERT INTO galleries (slug, name_ko, name_es, description_ko, description_es, icon, color, sort_order) VALUES
('free', '자유게시판', 'Tablero Libre', '자유롭게 소통할 수 있는 게시판입니다', 'Tablero donde puedes comunicarte libremente', '💬', '#4ECDC4', 1),
('kpop', 'K-POP게시판', 'K-POP', 'K-POP 관련 정보와 이야기를 공유하는 게시판', 'Tablero para compartir información y historias de K-POP', '🎵', '#FF6B6B', 2),
('kdrama', 'K-Drama게시판', 'K-Drama', 'K-드라마 관련 정보와 이야기를 공유하는 게시판', 'Tablero para compartir información e historias de K-Drama', '📺', '#45B7D1', 3),
('beauty', '뷰티', 'Belleza', '한국 화장품, 스킨케어, 메이크업 팁 공유', 'Comparte consejos de cosméticos coreanos, cuidado de la piel y maquillaje', '💄', '#96CEB4', 4),
('korean', '한국어', 'Coreano', '한국어 학습, 문법, 표현 공유', 'Comparte aprendizaje de coreano, gramática y expresiones', '🇰🇷', '#FFEAA7', 5),
('spanish', '스페인어', 'Español', '스페인어 학습, 문법, 표현 공유', 'Comparte aprendizaje de español, gramática y expresiones', '🇪🇸', '#DDA0DD', 6),
('qa', 'Q&A', 'Q&A', '질문과 답변을 주고받는 게시판입니다', 'Tablero de preguntas y respuestas', '❓', '#9B59B6', 7)
ON CONFLICT (slug) DO NOTHING;
