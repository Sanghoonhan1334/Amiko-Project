-- 갤러리 시스템 데이터베이스 스키마
-- 디시인사이드 스타일 커뮤니티 시스템

-- 1. 갤러리 테이블 (갤러리 정보)
CREATE TABLE IF NOT EXISTS galleries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug VARCHAR(50) UNIQUE NOT NULL, -- 'beauty', 'fashion', 'travel' 등
  name_ko VARCHAR(100) NOT NULL,    -- '뷰티 갤러리'
  name_es VARCHAR(100),              -- 나중에 추가
  description_ko TEXT,              -- 갤러리 설명
  description_es TEXT,              -- 나중에 추가
  icon VARCHAR(20),                 -- '💄', '👕' 등
  color VARCHAR(7),                 -- '#FF6B6B' 등
  post_count INTEGER DEFAULT 0,     -- 게시물 수
  comment_count INTEGER DEFAULT 0,  -- 댓글 수
  is_active BOOLEAN DEFAULT true,   -- 활성화 여부
  sort_order INTEGER DEFAULT 0,     -- 정렬 순서
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. 갤러리 게시물 테이블
CREATE TABLE IF NOT EXISTS gallery_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  gallery_id UUID REFERENCES galleries(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  title VARCHAR(200) NOT NULL,
  content TEXT NOT NULL,
  images TEXT[],                    -- 이미지 URL 배열
  view_count INTEGER DEFAULT 0,     -- 조회수
  like_count INTEGER DEFAULT 0,     -- 추천수
  dislike_count INTEGER DEFAULT 0, -- 비추천수
  comment_count INTEGER DEFAULT 0, -- 댓글수
  is_pinned BOOLEAN DEFAULT false, -- 상단 고정
  is_hot BOOLEAN DEFAULT false,    -- 핫글 여부
  is_deleted BOOLEAN DEFAULT false, -- 삭제 여부
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. 갤러리 댓글 테이블
CREATE TABLE IF NOT EXISTS gallery_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID REFERENCES gallery_posts(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  parent_id UUID REFERENCES gallery_comments(id) ON DELETE CASCADE, -- 대댓글
  content TEXT NOT NULL,
  like_count INTEGER DEFAULT 0,     -- 추천수
  dislike_count INTEGER DEFAULT 0, -- 비추천수
  is_deleted BOOLEAN DEFAULT false, -- 삭제 여부
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. 갤러리 투표 테이블 (추천/비추천)
CREATE TABLE IF NOT EXISTS gallery_votes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  post_id UUID REFERENCES gallery_posts(id) ON DELETE CASCADE,
  comment_id UUID REFERENCES gallery_comments(id) ON DELETE CASCADE,
  vote_type VARCHAR(10) NOT NULL CHECK (vote_type IN ('like', 'dislike')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, post_id),    -- 한 사용자는 게시물당 하나의 투표만
  UNIQUE(user_id, comment_id)  -- 한 사용자는 댓글당 하나의 투표만
);

-- 성능 최적화를 위한 인덱스
CREATE INDEX IF NOT EXISTS idx_gallery_posts_gallery_id ON gallery_posts(gallery_id);
CREATE INDEX IF NOT EXISTS idx_gallery_posts_created_at ON gallery_posts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_gallery_posts_like_count ON gallery_posts(like_count DESC);
CREATE INDEX IF NOT EXISTS idx_gallery_comments_post_id ON gallery_comments(post_id);
CREATE INDEX IF NOT EXISTS idx_gallery_votes_user_post ON gallery_votes(user_id, post_id);

-- 갤러리 데이터 삽입 (한국어 우선)
INSERT INTO galleries (slug, name_ko, description_ko, icon, color, sort_order) VALUES
('beauty', '뷰티 갤러리', '한국 화장품, 스킨케어, 메이크업 팁 공유', '💄', '#FF6B6B', 1),
('fashion', '패션 갤러리', '한국 패션, 스타일링, 쇼핑 정보 공유', '👕', '#4ECDC4', 2),
('travel', '여행 갤러리', '한국 여행지, 맛집, 관광지 정보 공유', '🗺️', '#45B7D1', 3),
('culture', '문화 갤러리', '한국 전통문화, 현대문화, 관습 공유', '🏮', '#96CEB4', 4),
('food', '음식 갤러리', '한국 요리, 레시피, 맛집 추천 공유', '🍱', '#FFEAA7', 5),
('language', '언어 갤러리', '한국어 학습, 문법, 표현 공유', '📖', '#DDA0DD', 6),
('free', '자유주제 갤러리', '자유롭게 이야기하는 공간', '💭', '#98D8C8', 7),
('daily', '일상 갤러리', '일상 공유, 경험담, 일기', '📝', '#F7DC6F', 8);

-- RLS (Row Level Security) 정책 설정
ALTER TABLE galleries ENABLE ROW LEVEL SECURITY;
ALTER TABLE gallery_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE gallery_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE gallery_votes ENABLE ROW LEVEL SECURITY;

-- 갤러리는 모든 사용자가 읽기 가능
CREATE POLICY "갤러리 읽기 허용" ON galleries FOR SELECT USING (true);

-- 게시물은 모든 사용자가 읽기 가능, 작성자는 수정/삭제 가능
CREATE POLICY "게시물 읽기 허용" ON gallery_posts FOR SELECT USING (true);
CREATE POLICY "게시물 작성 허용" ON gallery_posts FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "게시물 수정 허용" ON gallery_posts FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "게시물 삭제 허용" ON gallery_posts FOR DELETE USING (auth.uid() = user_id);

-- 댓글은 모든 사용자가 읽기 가능, 작성자는 수정/삭제 가능
CREATE POLICY "댓글 읽기 허용" ON gallery_comments FOR SELECT USING (true);
CREATE POLICY "댓글 작성 허용" ON gallery_comments FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "댓글 수정 허용" ON gallery_comments FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "댓글 삭제 허용" ON gallery_comments FOR DELETE USING (auth.uid() = user_id);

-- 투표는 모든 사용자가 읽기 가능, 본인만 투표 가능
CREATE POLICY "투표 읽기 허용" ON gallery_votes FOR SELECT USING (true);
CREATE POLICY "투표 작성 허용" ON gallery_votes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "투표 수정 허용" ON gallery_votes FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "투표 삭제 허용" ON gallery_votes FOR DELETE USING (auth.uid() = user_id);

-- 업데이트 시간 자동 갱신 함수
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 트리거 설정
CREATE TRIGGER update_galleries_updated_at BEFORE UPDATE ON galleries FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_gallery_posts_updated_at BEFORE UPDATE ON gallery_posts FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_gallery_comments_updated_at BEFORE UPDATE ON gallery_comments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
