-- Q&A 갤러리가 있는지 확인
SELECT id, slug, name_ko, name_es 
FROM galleries 
WHERE slug = 'qa';

-- Q&A 갤러리가 없으면 생성
INSERT INTO galleries (slug, name_ko, name_es, created_at, updated_at)
VALUES ('qa', 'Q&A 게시판', 'Foro de Preguntas y Respuestas', NOW(), NOW())
ON CONFLICT (slug) DO NOTHING;

-- 생성 확인
SELECT id, slug, name_ko, name_es 
FROM galleries 
WHERE slug = 'qa';

