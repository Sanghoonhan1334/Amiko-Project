-- 완전한 데이터베이스 초기화 및 재생성

-- 1. 모든 관련 테이블 완전 삭제
DROP TABLE IF EXISTS gallery_posts CASCADE;
DROP TABLE IF EXISTS galleries CASCADE;

-- 2. 갤러리 테이블 재생성
CREATE TABLE galleries (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  slug VARCHAR(50) UNIQUE NOT NULL,
  name_ko VARCHAR(100) NOT NULL,
  name_es VARCHAR(100),
  description_ko TEXT,
  description_es TEXT,
  icon VARCHAR(10),
  color VARCHAR(7),
  sort_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. 갤러리 게시글 테이블 재생성
CREATE TABLE gallery_posts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  gallery_id UUID NOT NULL REFERENCES galleries(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title VARCHAR(200) NOT NULL,
  content TEXT NOT NULL,
  images JSONB DEFAULT '[]',
  category VARCHAR(50) DEFAULT '자유게시판',
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

-- 4. 인덱스 생성
CREATE INDEX idx_gallery_posts_gallery_id ON gallery_posts(gallery_id);
CREATE INDEX idx_gallery_posts_user_id ON gallery_posts(user_id);
CREATE INDEX idx_gallery_posts_created_at ON gallery_posts(created_at DESC);
CREATE INDEX idx_gallery_posts_category ON gallery_posts(category);

-- 5. 갤러리 데이터 삽입
INSERT INTO galleries (slug, name_ko, name_es, description_ko, description_es, is_active, created_at, updated_at)
VALUES 
  ('free', '자유게시판', 'Foro Libre', '자유롭게 게시글을 작성하는 공간입니다', 'Espacio para escribir publicaciones libremente', true, NOW(), NOW()),
  ('kpop', 'K-POP 게시판', 'Foro K-POP', 'K-POP 관련 게시글을 작성하는 공간입니다', 'Espacio para escribir publicaciones relacionadas con K-POP', true, NOW(), NOW()),
  ('drama', 'K-Drama 게시판', 'Foro K-Drama', 'K-Drama 관련 게시글을 작성하는 공간입니다', 'Espacio para escribir publicaciones relacionadas con K-Drama', true, NOW(), NOW()),
  ('beauty', '뷰티 게시판', 'Foro de Belleza', '뷰티 관련 게시글을 작성하는 공간입니다', 'Espacio para escribir publicaciones relacionadas con belleza', true, NOW(), NOW()),
  ('korean', '한국어 게시판', 'Foro de Coreano', '한국어 학습 관련 게시글을 작성하는 공간입니다', 'Espacio para escribir publicaciones relacionadas con el aprendizaje del coreano', true, NOW(), NOW()),
  ('spanish', '스페인어 게시판', 'Foro de Español', '스페인어 학습 관련 게시글을 작성하는 공간입니다', 'Espacio para escribir publicaciones relacionadas con el aprendizaje del español', true, NOW(), NOW());

-- 6. RLS 정책 설정 (필요한 경우)
ALTER TABLE galleries ENABLE ROW LEVEL SECURITY;
ALTER TABLE gallery_posts ENABLE ROW LEVEL SECURITY;

-- 7. 확인
SELECT id, slug, name_ko, name_es FROM galleries ORDER BY slug;
