-- 자유게시판 기능을 위한 gallery_posts 테이블 컬럼 추가
-- 자유게시판의 카테고리, 공지, 설문조사 기능 지원

-- 자유게시판 관련 컬럼 추가
ALTER TABLE gallery_posts 
ADD COLUMN IF NOT EXISTS category VARCHAR(50) DEFAULT '자유게시판',
ADD COLUMN IF NOT EXISTS is_notice BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS is_survey BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS survey_options JSONB DEFAULT NULL;

-- 인덱스 추가
CREATE INDEX IF NOT EXISTS idx_gallery_posts_category ON gallery_posts(category);
CREATE INDEX IF NOT EXISTS idx_gallery_posts_is_notice ON gallery_posts(is_notice);
CREATE INDEX IF NOT EXISTS idx_gallery_posts_is_survey ON gallery_posts(is_survey);

-- 기존 게시글들의 카테고리를 기본값으로 설정
UPDATE gallery_posts 
SET category = '자유게시판' 
WHERE category IS NULL;

-- 자유게시판 갤러리가 없으면 생성
INSERT INTO galleries (slug, name_ko, description_ko, icon, color, sort_order) 
VALUES ('freeboard', '자유게시판', '자유롭게 이야기하는 공간', '💬', '#98D8C8', 0)
ON CONFLICT (slug) DO NOTHING;

-- 기존 'free' 갤러리가 있다면 'freeboard'로 통합
UPDATE gallery_posts 
SET gallery_id = (SELECT id FROM galleries WHERE slug = 'freeboard')
WHERE gallery_id = (SELECT id FROM galleries WHERE slug = 'free');

-- 'free' 갤러리 삭제 (더 이상 사용하지 않음)
DELETE FROM galleries WHERE slug = 'free';
