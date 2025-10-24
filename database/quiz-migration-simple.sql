-- ============================================
-- 퀴즈 네임스페이스 격리 - 간단 버전
-- Quiz Namespace Isolation - Simple Version
-- ============================================
-- 이 스크립트를 Supabase SQL Editor에 복사해서 한번에 실행하세요.
-- Copy and paste this entire script into Supabase SQL Editor and run.
-- ============================================

-- 1. quizzes 테이블에 slug 컬럼 추가
ALTER TABLE public.quizzes 
ADD COLUMN IF NOT EXISTS slug VARCHAR(100);

-- 2. quiz_results 테이블에 slug 컬럼 추가
ALTER TABLE public.quiz_results 
ADD COLUMN IF NOT EXISTS slug VARCHAR(100);

-- 3. 기존 퀴즈에 slug 설정
UPDATE public.quizzes 
SET slug = 'quiz-' || substring(id::text, 1, 8)
WHERE slug IS NULL;

-- 4. 기존 결과에 slug 설정
UPDATE public.quiz_results 
SET slug = LOWER(REPLACE(result_type, ' ', '-'))
WHERE slug IS NULL;

-- 5. 고유 인덱스 생성 (이미 있으면 무시)
DROP INDEX IF EXISTS idx_quizzes_slug;
CREATE UNIQUE INDEX idx_quizzes_slug ON public.quizzes(slug);

DROP INDEX IF EXISTS idx_quiz_results_quiz_slug;
CREATE UNIQUE INDEX idx_quiz_results_quiz_slug ON public.quiz_results(quiz_id, slug);

DROP INDEX IF EXISTS idx_quiz_questions_quiz_order;
CREATE UNIQUE INDEX idx_quiz_questions_quiz_order ON public.quiz_questions(quiz_id, question_order);

-- 6. 검증: 모든 퀴즈에 slug가 있는지 확인
SELECT 
  '✅ Total quizzes:' as status,
  COUNT(*) as count,
  COUNT(slug) as with_slug
FROM public.quizzes;

-- 7. 퀴즈 목록 확인
SELECT 
  id,
  title,
  slug,
  category,
  total_questions
FROM public.quizzes
ORDER BY created_at DESC;

