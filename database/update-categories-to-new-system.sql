-- 새로운 카테고리 시스템으로 업데이트
-- posts 테이블은 category_id를 사용하여 board_categories 테이블과 연결됨

-- 1. board_categories 테이블 업데이트
-- 기존 카테고리 데이터 삭제
DELETE FROM public.board_categories WHERE name IN ('자유게시판', 'P&R', 'Historia', '한국뉴스');

-- 새로운 카테고리 데이터 삽입
INSERT INTO public.board_categories (name, description, sort_order) VALUES
('자유게시판', '자유롭게 소통할 수 있는 게시판입니다', 1),
('K-POP게시판', 'K-POP 관련 정보와 이야기를 공유하는 게시판', 2),
('K-Drama게시판', 'K-드라마 관련 정보와 이야기를 공유하는 게시판', 3),
('뷰티', '한국 화장품, 스킨케어, 메이크업 팁 공유', 4),
('한국어', '한국어 학습, 문법, 표현 공유', 5),
('스페인어', '스페인어 학습, 문법, 표현 공유', 6)
ON CONFLICT (name) DO NOTHING;

-- 2. 기존 게시글들의 카테고리 마이그레이션
-- 기존 게시글들을 모두 자유게시판으로 이동 (안전한 마이그레이션)
UPDATE public.posts 
SET category_id = (SELECT id FROM public.board_categories WHERE name = '자유게시판' LIMIT 1)
WHERE category_id IS NOT NULL;

-- 3. galleries 테이블 업데이트
-- 기존 갤러리 데이터 삭제
DELETE FROM galleries WHERE slug IN ('beauty', 'fashion', 'travel', 'culture', 'food', 'language', 'free', 'daily');

-- 새로운 갤러리 데이터 삽입
INSERT INTO galleries (slug, name_ko, description_ko, icon, color, sort_order) VALUES
('free', '자유게시판', '자유롭게 소통할 수 있는 게시판입니다', '💬', '#4ECDC4', 1),
('kpop', 'K-POP게시판', 'K-POP 관련 정보와 이야기를 공유하는 게시판', '🎵', '#FF6B6B', 2),
('kdrama', 'K-Drama게시판', 'K-드라마 관련 정보와 이야기를 공유하는 게시판', '📺', '#45B7D1', 3),
('beauty', '뷰티', '한국 화장품, 스킨케어, 메이크업 팁 공유', '💄', '#96CEB4', 4),
('korean', '한국어', '한국어 학습, 문법, 표현 공유', '🇰🇷', '#FFEAA7', 5),
('spanish', '스페인어', '스페인어 학습, 문법, 표현 공유', '🇪🇸', '#DDA0DD', 6);

-- 4. 인덱스 재생성 (성능 최적화)
DROP INDEX IF EXISTS idx_posts_category_id;
CREATE INDEX idx_posts_category_id ON public.posts(category_id);

-- 5. 마이그레이션 완료 확인
SELECT 
    bc.name as category_name,
    COUNT(p.id) as post_count
FROM public.board_categories bc
LEFT JOIN public.posts p ON bc.id = p.category_id
GROUP BY bc.id, bc.name, bc.sort_order
ORDER BY bc.sort_order;

SELECT 
    slug,
    name_ko,
    sort_order
FROM galleries 
ORDER BY sort_order;
