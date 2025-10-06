-- 갤러리 테이블 전체 확인
SELECT id, slug, name_ko, name_es, created_at FROM galleries ORDER BY created_at;

-- 특정 갤러리들이 존재하는지 확인
SELECT 
  CASE WHEN EXISTS(SELECT 1 FROM galleries WHERE slug = 'kpop') THEN 'EXISTS' ELSE 'NOT EXISTS' END as kpop_status,
  CASE WHEN EXISTS(SELECT 1 FROM galleries WHERE slug = 'drama') THEN 'EXISTS' ELSE 'NOT EXISTS' END as drama_status,
  CASE WHEN EXISTS(SELECT 1 FROM galleries WHERE slug = 'beauty') THEN 'EXISTS' ELSE 'NOT EXISTS' END as beauty_status,
  CASE WHEN EXISTS(SELECT 1 FROM galleries WHERE slug = 'korean') THEN 'EXISTS' ELSE 'NOT EXISTS' END as korean_status,
  CASE WHEN EXISTS(SELECT 1 FROM galleries WHERE slug = 'spanish') THEN 'EXISTS' ELSE 'NOT EXISTS' END as spanish_status,
  CASE WHEN EXISTS(SELECT 1 FROM galleries WHERE slug = 'free') THEN 'EXISTS' ELSE 'NOT EXISTS' END as free_status;

-- 누락된 갤러리들 생성
INSERT INTO galleries (slug, name_ko, name_es, description_ko, description_es, is_active, created_at, updated_at)
SELECT * FROM (VALUES 
  ('kpop', 'K-POP 게시판', 'Foro K-POP', 'K-POP 관련 게시글을 작성하는 공간입니다', 'Espacio para escribir publicaciones relacionadas con K-POP', true, NOW(), NOW()),
  ('drama', 'K-Drama 게시판', 'Foro K-Drama', 'K-Drama 관련 게시글을 작성하는 공간입니다', 'Espacio para escribir publicaciones relacionadas con K-Drama', true, NOW(), NOW()),
  ('beauty', '뷰티 게시판', 'Foro de Belleza', '뷰티 관련 게시글을 작성하는 공간입니다', 'Espacio para escribir publicaciones relacionadas con belleza', true, NOW(), NOW()),
  ('korean', '한국어 게시판', 'Foro de Coreano', '한국어 학습 관련 게시글을 작성하는 공간입니다', 'Espacio para escribir publicaciones relacionadas con el aprendizaje del coreano', true, NOW(), NOW()),
  ('spanish', '스페인어 게시판', 'Foro de Español', '스페인어 학습 관련 게시글을 작성하는 공간입니다', 'Espacio para escribir publicaciones relacionadas con el aprendizaje del español', true, NOW(), NOW()),
  ('free', '자유게시판', 'Foro Libre', '자유롭게 게시글을 작성하는 공간입니다', 'Espacio para escribir publicaciones libremente', true, NOW(), NOW())
) AS t(slug, name_ko, name_es, description_ko, description_es, is_active, created_at, updated_at)
WHERE NOT EXISTS (SELECT 1 FROM galleries WHERE galleries.slug = t.slug);

-- 생성 후 다시 확인
SELECT id, slug, name_ko, name_es FROM galleries WHERE slug IN ('kpop', 'drama', 'beauty', 'korean', 'spanish', 'free') ORDER BY slug;
