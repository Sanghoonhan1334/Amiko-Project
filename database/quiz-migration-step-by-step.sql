-- ============================================
-- 퀴즈 네임스페이스 격리 마이그레이션 (단계별)
-- Quiz Namespace Isolation Migration (Step by Step)
-- ============================================
-- 각 단계를 하나씩 실행하세요.
-- Execute each step one by one.
-- ============================================

-- ============================================
-- STEP 1: quizzes 테이블에 slug 컬럼 추가
-- Add slug column to quizzes table
-- ============================================
ALTER TABLE public.quizzes 
  ADD COLUMN IF NOT EXISTS slug VARCHAR(100);

-- ============================================
-- STEP 2: slug 고유 인덱스 생성
-- Create unique index on slug
-- ============================================
CREATE UNIQUE INDEX IF NOT EXISTS idx_quizzes_slug 
  ON public.quizzes(slug);

-- ============================================
-- STEP 3: 기존 퀴즈에 slug 추가
-- Add slug to existing quizzes
-- ============================================
UPDATE public.quizzes 
SET slug = CASE 
  WHEN id = 'a0000000-0000-0000-0000-000000000001' THEN 'kpop-star-match'
  WHEN id = '268caf0b-0031-4e58-9245-606e3421f1fd' THEN 'mbti-celeb'
  WHEN title ILIKE '%MBTI%' THEN 'mbti-test-' || id::text
  WHEN title ILIKE '%아이돌%' OR title ILIKE '%idol%' THEN 'idol-test-' || id::text
  ELSE 'quiz-' || id::text
END
WHERE slug IS NULL;

-- ============================================
-- STEP 4: slug NULL 체크 (검증)
-- Verify no NULL slugs
-- ============================================
SELECT id, title, slug FROM public.quizzes WHERE slug IS NULL;
-- 결과가 0 rows이면 성공!

-- ============================================
-- STEP 5: quiz_results 테이블에 slug 컬럼 추가
-- Add slug column to quiz_results table
-- ============================================
ALTER TABLE public.quiz_results 
  ADD COLUMN IF NOT EXISTS slug VARCHAR(100);

-- ============================================
-- STEP 6: quiz_results의 result_type UNIQUE 제약조건 제거
-- Remove UNIQUE constraint on result_type
-- ============================================
DO $$ 
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'quiz_results_result_type_key'
  ) THEN
    ALTER TABLE public.quiz_results DROP CONSTRAINT quiz_results_result_type_key;
  END IF;
END $$;

-- ============================================
-- STEP 7: quiz_results에 slug 값 설정
-- Set slug values in quiz_results
-- ============================================
UPDATE public.quiz_results qr
SET slug = LOWER(REPLACE(REGEXP_REPLACE(qr.result_type, '[^a-zA-Z0-9\s-]', '', 'g'), ' ', '-'))
WHERE qr.slug IS NULL;

-- ============================================
-- STEP 8: quiz_results 복합 인덱스 생성
-- Create composite index on quiz_results
-- ============================================
CREATE UNIQUE INDEX IF NOT EXISTS idx_quiz_results_quiz_slug 
  ON public.quiz_results(quiz_id, slug);

-- ============================================
-- STEP 9: quiz_questions 복합 인덱스 생성
-- Create composite index on quiz_questions
-- ============================================
CREATE UNIQUE INDEX IF NOT EXISTS idx_quiz_questions_quiz_order 
  ON public.quiz_questions(quiz_id, question_order);

-- ============================================
-- STEP 10: 최종 검증
-- Final verification
-- ============================================

-- 1. 모든 퀴즈에 slug가 있는지 확인
SELECT 'Quizzes without slug:' as check_name, COUNT(*) as count 
FROM public.quizzes WHERE slug IS NULL;

-- 2. 중복된 slug 확인
SELECT 'Duplicate slugs:' as check_name, slug, COUNT(*) as count 
FROM public.quizzes 
GROUP BY slug 
HAVING COUNT(*) > 1;

-- 3. 퀴즈 목록 확인
SELECT id, title, slug, total_questions 
FROM public.quizzes 
ORDER BY created_at DESC;

-- ============================================
-- 완료!
-- ============================================
-- 모든 단계가 성공적으로 완료되었습니다.
-- All steps completed successfully.

