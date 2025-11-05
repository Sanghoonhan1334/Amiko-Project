-- 한국어 레벨 테스트를 quizzes 테이블에 추가
-- UUID를 사용하여 기존 구조와 호환되게 함

-- 1. quizzes 테이블에 한국어 레벨 테스트 추가
INSERT INTO quizzes (
  id, 
  title, 
  description,
  thumbnail_url,
  category,
  total_questions,
  total_participants,
  slug,
  is_completed,
  created_at,
  updated_at
) VALUES (
  'a1b2c3d4-1234-5678-9abc-def012345678'::uuid,  -- 새로운 UUID
  'Test de Nivel de Coreano',
  'Este test está diseñado para medir con precisión tu nivel de coreano mediante preguntas de diversos niveles. Evalúa sistemáticamente desde la lectura básica de hangul hasta la gramática avanzada.',
  '/quizzes/korean-level/cover/cover.png',
  'language',
  30,
  0,
  'korean-level',
  true,
  NOW(),
  NOW()
)
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  updated_at = NOW();

-- 2. 기존 user_favorites의 'korean-level-1'을 새 UUID로 업데이트
UPDATE user_favorites 
SET quiz_id = 'a1b2c3d4-1234-5678-9abc-def012345678'
WHERE quiz_id = 'korean-level-1';

-- 3. 확인
SELECT id, title, slug, category 
FROM quizzes 
WHERE slug = 'korean-level';

SELECT COUNT(*) as favorites_count
FROM user_favorites
WHERE quiz_id = 'a1b2c3d4-1234-5678-9abc-def012345678';

-- 완료 메시지
SELECT '✅ 한국어 레벨 테스트가 quizzes 테이블에 추가되었습니다!' as status,
       'ID: a1b2c3d4-1234-5678-9abc-def012345678' as quiz_id;

