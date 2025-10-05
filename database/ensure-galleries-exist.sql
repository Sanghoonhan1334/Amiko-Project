-- 갤러리 테이블에 필수 갤러리들이 존재하는지 확인하고 생성하는 스크립트

-- 1. free 갤러리가 없으면 생성
INSERT INTO galleries (slug, name_ko, description_ko, icon, color, sort_order, is_active)
SELECT 'free', '자유주제 갤러리', '자유롭게 이야기하는 공간', '💭', '#98D8C8', 7, true
WHERE NOT EXISTS (SELECT 1 FROM galleries WHERE slug = 'free');

-- 2. freeboard 갤러리가 없으면 생성 (호환성)
INSERT INTO galleries (slug, name_ko, description_ko, icon, color, sort_order, is_active)
SELECT 'freeboard', '자유게시판', '자유롭게 이야기하는 공간', '💬', '#98D8C8', 8, true
WHERE NOT EXISTS (SELECT 1 FROM galleries WHERE slug = 'freeboard');

-- 3. 기타 주요 갤러리들도 확인하고 생성
INSERT INTO galleries (slug, name_ko, description_ko, icon, color, sort_order, is_active)
VALUES
('beauty', '뷰티 갤러리', '한국 화장품, 스킨케어, 메이크업 팁 공유', '💄', '#FF6B6B', 1, true),
('fashion', '패션 갤러리', '한국 패션, 스타일링, 쇼핑 정보 공유', '👕', '#4ECDC4', 2, true),
('travel', '여행 갤러리', '한국 여행지, 맛집, 관광지 정보 공유', '🗺️', '#45B7D1', 3, true),
('culture', '문화 갤러리', '한국 전통문화, 현대문화, 관습 공유', '🏮', '#96CEB4', 4, true),
('food', '음식 갤러리', '한국 요리, 레시피, 맛집 추천 공유', '🍱', '#FFEAA7', 5, true),
('language', '언어 갤러리', '한국어 학습, 문법, 표현 공유', '📖', '#DDA0DD', 6, true),
('daily', '일상 갤러리', '일상 공유, 경험담, 일기', '📝', '#F7DC6F', 9, true)
ON CONFLICT (slug) DO NOTHING;

-- 4. 현재 갤러리 목록 확인
SELECT slug, name_ko, is_active, created_at FROM galleries ORDER BY sort_order;
