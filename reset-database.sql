-- 모든 게시글 삭제 (완전 초기화)
DELETE FROM gallery_posts;

-- 모든 갤러리 삭제 (완전 초기화)
DELETE FROM galleries;

-- 갤러리 재생성
INSERT INTO galleries (slug, name_ko, name_es, description_ko, description_es, is_active, created_at, updated_at)
VALUES 
  ('free', '자유게시판', 'Foro Libre', '자유롭게 게시글을 작성하는 공간입니다', 'Espacio para escribir publicaciones libremente', true, NOW(), NOW()),
  ('kpop', 'K-POP 게시판', 'Foro K-POP', 'K-POP 관련 게시글을 작성하는 공간입니다', 'Espacio para escribir publicaciones relacionadas con K-POP', true, NOW(), NOW()),
  ('drama', 'K-Drama 게시판', 'Foro K-Drama', 'K-Drama 관련 게시글을 작성하는 공간입니다', 'Espacio para escribir publicaciones relacionadas con K-Drama', true, NOW(), NOW()),
  ('beauty', '뷰티 게시판', 'Foro de Belleza', '뷰티 관련 게시글을 작성하는 공간입니다', 'Espacio para escribir publicaciones relacionadas con belleza', true, NOW(), NOW()),
  ('korean', '한국어 게시판', 'Foro de Coreano', '한국어 학습 관련 게시글을 작성하는 공간입니다', 'Espacio para escribir publicaciones relacionadas con el aprendizaje del coreano', true, NOW(), NOW()),
  ('spanish', '스페인어 게시판', 'Foro de Español', '스페인어 학습 관련 게시글을 작성하는 공간입니다', 'Espacio para escribir publicaciones relacionadas con el aprendizaje del español', true, NOW(), NOW());

-- 생성된 갤러리 확인
SELECT id, slug, name_ko, name_es FROM galleries ORDER BY slug;
