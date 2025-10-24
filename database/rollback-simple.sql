-- ============================================
-- 간단한 롤백 스크립트
-- Simple Rollback Script
-- ============================================
-- 이 스크립트를 Supabase SQL Editor에서 실행하세요.
-- Run this script in Supabase SQL Editor.

-- 1. K-POP 스타 MBTI 테스트 복구 (20개 → 12개)
UPDATE public.quizzes 
SET total_questions = 12
WHERE title ILIKE '%K-POP 스타 MBTI%';

-- 2. 기존 K-POP 스타 테스트 복구 (10개)
UPDATE public.quizzes 
SET total_questions = 10
WHERE title ILIKE '%당신과 닮은 K-POP 스타%';

-- 3. slug 관련 모든 것 삭제
DROP INDEX IF EXISTS idx_quizzes_slug;
DROP INDEX IF EXISTS idx_quiz_results_quiz_slug;
DROP INDEX IF EXISTS idx_quiz_questions_quiz_order;

ALTER TABLE public.quizzes DROP COLUMN IF EXISTS slug;
ALTER TABLE public.quiz_results DROP COLUMN IF EXISTS slug;

-- 4. 검증
SELECT 
  '✅ 복구 완료!' as status,
  title,
  total_questions
FROM public.quizzes
WHERE title ILIKE '%MBTI%' OR title ILIKE '%K-POP%'
ORDER BY created_at DESC;

-- 5. slug 컬럼 삭제 확인
SELECT 
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = 'quizzes' AND column_name = 'slug'
    ) 
    THEN '❌ slug 컬럼이 아직 남아있습니다'
    ELSE '✅ slug 컬럼이 완전히 삭제되었습니다'
  END as slug_status;
