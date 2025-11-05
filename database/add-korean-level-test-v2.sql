-- 한국어 레벨 테스트를 quizzes 테이블에 추가
-- 기존 테이블 구조를 TEXT로 변경하여 호환

-- 1. quiz_questions의 외래 키 삭제
ALTER TABLE quiz_questions 
DROP CONSTRAINT IF EXISTS quiz_questions_quiz_id_fkey;

-- 2. quiz_questions의 quiz_id를 TEXT로 변경
ALTER TABLE quiz_questions
ALTER COLUMN quiz_id TYPE TEXT USING quiz_id::TEXT;

-- 3. quizzes의 id를 TEXT로 변경
ALTER TABLE quizzes 
ALTER COLUMN id TYPE TEXT USING id::TEXT;

-- 4. 외래 키 재생성
ALTER TABLE quiz_questions
ADD CONSTRAINT quiz_questions_quiz_id_fkey 
FOREIGN KEY (quiz_id) REFERENCES quizzes(id) ON DELETE CASCADE;

-- 5. 한국어 레벨 테스트 추가
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
  'a1b2c3d4-1234-5678-9abc-def012345678',
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

-- 6. 기존 user_favorites의 'korean-level-1'을 새 ID로 업데이트
UPDATE user_favorites 
SET quiz_id = 'a1b2c3d4-1234-5678-9abc-def012345678'
WHERE quiz_id = 'korean-level-1';

-- 7. 확인
SELECT id, title, slug, category 
FROM quizzes 
WHERE id = 'a1b2c3d4-1234-5678-9abc-def012345678';

SELECT quiz_id, COUNT(*) as count
FROM user_favorites
WHERE quiz_id = 'a1b2c3d4-1234-5678-9abc-def012345678'
GROUP BY quiz_id;

-- 완료 메시지
SELECT '✅ 한국어 레벨 테스트 추가 완료!' as status,
       '이제 Guardar와 테스트 목록의 북마크가 연동됩니다!' as message;

