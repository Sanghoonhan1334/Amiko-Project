-- 갤러리 테이블에 기본 데이터 삽입
-- 자유게시판 및 기타 갤러리 생성

-- 기존 갤러리 데이터 삭제 (필요시)
-- DELETE FROM public.galleries;

-- 기본 갤러리 데이터 삽입
INSERT INTO public.galleries (slug, name_ko, name_es, description_ko, description_es, icon, color, is_active, sort_order) 
VALUES 
  ('free', '자유게시판', 'Foro Libre', '자유롭게 이야기를 나누는 공간입니다', 'Un espacio para conversar libremente', '💬', '#3B82F6', true, 1),
  ('kpop', 'K-POP 갤러리', 'Galería K-POP', 'K-POP 관련 이야기를 나누는 공간입니다', 'Un espacio para hablar sobre K-POP', '🎵', '#FF6B6B', true, 2),
  ('drama', 'K-Drama 갤러리', 'Galería K-Drama', 'K-Drama 관련 이야기를 나누는 공간입니다', 'Un espacio para hablar sobre K-Drama', '📺', '#8B5CF6', true, 3),
  ('beauty', '뷰티 갤러리', 'Galería de Belleza', '뷰티 관련 이야기를 나누는 공간입니다', 'Un espacio para hablar sobre belleza', '💄', '#F59E0B', true, 4),
  ('fashion', '패션 갤러리', 'Galería de Moda', '패션 관련 이야기를 나누는 공간입니다', 'Un espacio para hablar sobre moda', '👕', '#10B981', true, 5),
  ('travel', '여행 갤러리', 'Galería de Viajes', '여행 관련 이야기를 나누는 공간입니다', 'Un espacio para hablar sobre viajes', '✈️', '#06B6D4', true, 6)
ON CONFLICT (slug) DO UPDATE SET
  name_ko = EXCLUDED.name_ko,
  name_es = EXCLUDED.name_es,
  description_ko = EXCLUDED.description_ko,
  description_es = EXCLUDED.description_es,
  icon = EXCLUDED.icon,
  color = EXCLUDED.color,
  is_active = EXCLUDED.is_active,
  sort_order = EXCLUDED.sort_order,
  updated_at = NOW();

-- 갤러리 데이터 확인
SELECT * FROM public.galleries ORDER BY sort_order;
