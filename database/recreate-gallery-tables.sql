-- 갤러리 시스템 테이블 재생성 스크립트
-- 기존 테이블이 있다면 삭제하고 새로 생성

-- 1. 기존 테이블들 삭제 (외래키 때문에 순서 중요)
DROP TABLE IF EXISTS gallery_votes CASCADE;
DROP TABLE IF EXISTS gallery_comments CASCADE;
DROP TABLE IF EXISTS gallery_posts CASCADE;
DROP TABLE IF EXISTS galleries CASCADE;

-- 2. 갤러리 테이블 생성
CREATE TABLE galleries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug VARCHAR(50) UNIQUE NOT NULL,
  name_ko VARCHAR(100) NOT NULL,
  name_es VARCHAR(100),
  description_ko TEXT,
  description_es TEXT,
  icon VARCHAR(20),
  color VARCHAR(7),
  post_count INTEGER DEFAULT 0,
  comment_count INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. 갤러리 게시물 테이블 생성
CREATE TABLE gallery_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  gallery_id UUID REFERENCES galleries(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  title VARCHAR(200) NOT NULL,
  content TEXT NOT NULL,
  images TEXT[],
  view_count INTEGER DEFAULT 0,
  like_count INTEGER DEFAULT 0,
  dislike_count INTEGER DEFAULT 0,
  comment_count INTEGER DEFAULT 0,
  is_pinned BOOLEAN DEFAULT false,
  is_hot BOOLEAN DEFAULT false,
  is_deleted BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. 갤러리 댓글 테이블 생성
CREATE TABLE gallery_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID REFERENCES gallery_posts(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  parent_id UUID REFERENCES gallery_comments(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  like_count INTEGER DEFAULT 0,
  dislike_count INTEGER DEFAULT 0,
  is_deleted BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. 갤러리 투표 테이블 생성
CREATE TABLE gallery_votes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  post_id UUID REFERENCES gallery_posts(id) ON DELETE CASCADE,
  comment_id UUID REFERENCES gallery_comments(id) ON DELETE CASCADE,
  vote_type VARCHAR(10) NOT NULL CHECK (vote_type IN ('like', 'dislike')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, post_id),
  UNIQUE(user_id, comment_id)
);

-- 6. 인덱스 생성
CREATE INDEX idx_gallery_posts_gallery_id ON gallery_posts(gallery_id);
CREATE INDEX idx_gallery_posts_created_at ON gallery_posts(created_at DESC);
CREATE INDEX idx_gallery_posts_like_count ON gallery_posts(like_count DESC);
CREATE INDEX idx_gallery_comments_post_id ON gallery_comments(post_id);
CREATE INDEX idx_gallery_votes_user_post ON gallery_votes(user_id, post_id);

-- 7. 갤러리 데이터 삽입
INSERT INTO galleries (slug, name_ko, description_ko, icon, color, sort_order) VALUES
('beauty', '뷰티 갤러리', '한국 화장품, 스킨케어, 메이크업 팁 공유', '💄', '#FF6B6B', 1),
('fashion', '패션 갤러리', '한국 패션, 스타일링, 쇼핑 정보 공유', '👕', '#4ECDC4', 2),
('travel', '여행 갤러리', '한국 여행지, 맛집, 관광지 정보 공유', '🗺️', '#45B7D1', 3),
('culture', '문화 갤러리', '한국 전통문화, 현대문화, 관습 공유', '🏮', '#96CEB4', 4),
('food', '음식 갤러리', '한국 요리, 레시피, 맛집 추천 공유', '🍱', '#FFEAA7', 5),
('language', '언어 갤러리', '한국어 학습, 문법, 표현 공유', '📖', '#DDA0DD', 6),
('free', '자유주제 갤러리', '자유롭게 이야기하는 공간', '💭', '#98D8C8', 7),
('daily', '일상 갤러리', '일상 공유, 경험담, 일기', '📱', '#F7DC6F', 8);

-- 8. RLS 정책 설정
ALTER TABLE galleries ENABLE ROW LEVEL SECURITY;
ALTER TABLE gallery_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE gallery_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE gallery_votes ENABLE ROW LEVEL SECURITY;

-- 갤러리 읽기 허용
CREATE POLICY "갤러리 읽기 허용" ON galleries FOR SELECT USING (true);

-- 게시물 정책
CREATE POLICY "게시물 읽기 허용" ON gallery_posts FOR SELECT USING (true);
CREATE POLICY "게시물 작성 허용" ON gallery_posts FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "게시물 수정 허용" ON gallery_posts FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "게시물 삭제 허용" ON gallery_posts FOR DELETE USING (auth.uid() = user_id);

-- 댓글 정책
CREATE POLICY "댓글 읽기 허용" ON gallery_comments FOR SELECT USING (true);
CREATE POLICY "댓글 작성 허용" ON gallery_comments FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "댓글 수정 허용" ON gallery_comments FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "댓글 삭제 허용" ON gallery_comments FOR DELETE USING (auth.uid() = user_id);

-- 투표 정책
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

-- 완료 메시지
SELECT '갤러리 시스템 테이블이 성공적으로 생성되었습니다!' as message;
