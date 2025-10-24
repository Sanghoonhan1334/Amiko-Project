-- ============================================
-- 퀴즈 마이그레이션 롤백 스크립트
-- Quiz Migration Rollback Script
-- ============================================
-- 기존 퀴즈 데이터를 원상복구합니다.
-- Restore original quiz data.

-- ============================================
-- STEP 1: 기존 퀴즈 데이터 복구
-- Restore original quiz data
-- ============================================

-- K-POP 스타 MBTI 매칭 테스트 복구 (20개 → 12개)
UPDATE public.quizzes 
SET total_questions = 12
WHERE id = '268caf0b-0031-4e58-9245-606e3421f1fd'
   OR title ILIKE '%K-POP 스타 MBTI%';

-- 다른 기존 퀴즈들도 확인하고 복구
UPDATE public.quizzes 
SET total_questions = 10
WHERE id = 'a0000000-0000-0000-0000-000000000001'
   OR title ILIKE '%당신과 닮은 K-POP 스타%';

-- ============================================
-- STEP 2: slug 컬럼 제거 (마이그레이션 되돌리기)
-- Remove slug columns (rollback migration)
-- ============================================

-- 인덱스 먼저 삭제
DROP INDEX IF EXISTS idx_quizzes_slug;
DROP INDEX IF EXISTS idx_quiz_results_quiz_slug;
DROP INDEX IF EXISTS idx_quiz_questions_quiz_order;

-- slug 컬럼 삭제
ALTER TABLE public.quizzes DROP COLUMN IF EXISTS slug;
ALTER TABLE public.quiz_results DROP COLUMN IF EXISTS slug;

-- ============================================
-- STEP 3: 원래 제약조건 복구
-- Restore original constraints
-- ============================================

-- quiz_results의 result_type UNIQUE 제약조건 복구
ALTER TABLE public.quiz_results 
ADD CONSTRAINT quiz_results_result_type_key UNIQUE (result_type);

-- ============================================
-- STEP 4: 검증
-- Verification
-- ============================================

-- 1. 퀴즈 데이터 확인
SELECT 
  id,
  title,
  total_questions,
  category
FROM public.quizzes
ORDER BY created_at DESC;

-- 2. slug 컬럼이 삭제되었는지 확인
SELECT column_name 
FROM information_schema.columns
WHERE table_name = 'quizzes' 
  AND column_name = 'slug';

-- 결과: 0 rows (slug 컬럼이 없어야 함)

-- 3. total_questions가 올바른지 확인
SELECT 
  title,
  total_questions
FROM public.quizzes
WHERE title ILIKE '%MBTI%' OR title ILIKE '%K-POP%';

-- ============================================
-- 완료!
-- ============================================
-- 기존 퀴즈 데이터가 원상복구되었습니다.
-- Original quiz data has been restored.

