-- quizzes 테이블과 관련된 모든 테이블을 TEXT로 변경
-- 모든 외래 키를 처리하는 완전한 스크립트

-- 1. quizzes를 참조하는 모든 외래 키 찾기 및 삭제
DO $$
DECLARE
    constraint_record RECORD;
BEGIN
    FOR constraint_record IN
        SELECT
            tc.constraint_name,
            tc.table_name
        FROM information_schema.table_constraints AS tc
        JOIN information_schema.key_column_usage AS kcu
          ON tc.constraint_name = kcu.constraint_name
        JOIN information_schema.constraint_column_usage AS ccu
          ON ccu.constraint_name = tc.constraint_name
        WHERE tc.constraint_type = 'FOREIGN KEY'
          AND ccu.table_name = 'quizzes'
          AND ccu.column_name = 'id'
    LOOP
        EXECUTE format('ALTER TABLE %I DROP CONSTRAINT IF EXISTS %I',
            constraint_record.table_name,
            constraint_record.constraint_name);
        RAISE NOTICE '외래 키 삭제: %.%',
            constraint_record.table_name,
            constraint_record.constraint_name;
    END LOOP;
END $$;

-- 2. quiz_questions.quiz_id를 TEXT로 변경
ALTER TABLE quiz_questions
ALTER COLUMN quiz_id TYPE TEXT USING quiz_id::TEXT;

-- 3. quiz_results.quiz_id를 TEXT로 변경
ALTER TABLE quiz_results
ALTER COLUMN quiz_id TYPE TEXT USING quiz_id::TEXT;

-- 4. user_favorites.quiz_id를 TEXT로 변경 (이미 되어있을 수 있음)
ALTER TABLE user_favorites
ALTER COLUMN quiz_id TYPE TEXT USING quiz_id::TEXT;

-- 5. quiz_fun.quiz_id를 TEXT로 변경 (있다면)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'quiz_fun') THEN
        ALTER TABLE quiz_fun
        ALTER COLUMN quiz_id TYPE TEXT USING quiz_id::TEXT;
    END IF;
END $$;

-- 6. quiz_accurate.quiz_id를 TEXT로 변경 (있다면)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'quiz_accurate') THEN
        ALTER TABLE quiz_accurate
        ALTER COLUMN quiz_id TYPE TEXT USING quiz_id::TEXT;
    END IF;
END $$;

-- 7. quizzes.id를 TEXT로 변경
ALTER TABLE quizzes 
ALTER COLUMN id TYPE TEXT USING id::TEXT;

-- 8. 외래 키 재생성
ALTER TABLE quiz_questions
ADD CONSTRAINT quiz_questions_quiz_id_fkey 
FOREIGN KEY (quiz_id) REFERENCES quizzes(id) ON DELETE CASCADE;

ALTER TABLE quiz_results
ADD CONSTRAINT quiz_results_quiz_id_fkey 
FOREIGN KEY (quiz_id) REFERENCES quizzes(id) ON DELETE CASCADE;

-- 9. 한국어 레벨 테스트 추가
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

-- 10. 기존 user_favorites의 'korean-level-1'을 새 ID로 업데이트
UPDATE user_favorites 
SET quiz_id = 'a1b2c3d4-1234-5678-9abc-def012345678'
WHERE quiz_id = 'korean-level-1';

-- 11. 확인
SELECT 
    table_name, 
    column_name, 
    data_type 
FROM information_schema.columns 
WHERE (table_name = 'quizzes' AND column_name = 'id')
   OR (table_name IN ('quiz_questions', 'quiz_results', 'user_favorites') AND column_name = 'quiz_id')
ORDER BY table_name, column_name;

SELECT id, title, slug 
FROM quizzes 
WHERE id = 'a1b2c3d4-1234-5678-9abc-def012345678';

-- 완료 메시지
SELECT '✅ 모든 테이블 변환 완료!' as status;

