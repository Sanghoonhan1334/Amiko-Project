-- ============================================
-- 퀴즈 네임스페이스 격리 마이그레이션
-- Quiz Namespace Isolation Migration
-- ============================================
-- 목적: 새로운 퀴즈 추가 시 기존 퀴즈와 데이터가 섞이지 않도록 안전장치 추가
-- Purpose: Add safeguards to prevent data mixing when adding new quizzes
-- ============================================

-- 1. quizzes 테이블에 slug 컬럼 추가
-- Add slug column to quizzes table
ALTER TABLE public.quizzes 
  ADD COLUMN IF NOT EXISTS slug VARCHAR(100) UNIQUE;

-- 2. slug 컬럼에 대한 고유 인덱스 생성
-- Create unique index on slug column
CREATE UNIQUE INDEX IF NOT EXISTS idx_quizzes_slug ON public.quizzes(slug);

-- 3. quiz_results 테이블에 slug 컬럼 추가 (결과 타입별 고유 식별자)
-- Add slug column to quiz_results table
ALTER TABLE public.quiz_results 
  ADD COLUMN IF NOT EXISTS slug VARCHAR(100);

-- 4. quiz_results의 result_type UNIQUE 제약조건 제거하고 quiz_id+slug 조합으로 변경
-- Remove UNIQUE constraint on result_type and create composite unique on quiz_id+slug
DO $$ 
BEGIN
  -- 기존 UNIQUE 제약조건 삭제 (있는 경우만)
  IF EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'quiz_results_result_type_key'
  ) THEN
    ALTER TABLE public.quiz_results DROP CONSTRAINT quiz_results_result_type_key;
  END IF;
END $$;

-- 5. quiz_results에 대한 복합 고유 인덱스 생성 (quiz_id + slug)
-- Create composite unique index on quiz_id + slug
CREATE UNIQUE INDEX IF NOT EXISTS idx_quiz_results_quiz_slug 
  ON public.quiz_results(quiz_id, slug);

-- 6. quiz_questions에 대한 복합 고유 인덱스 생성 (quiz_id + question_order)
-- Create composite unique index on quiz_id + question_order
CREATE UNIQUE INDEX IF NOT EXISTS idx_quiz_questions_quiz_order 
  ON public.quiz_questions(quiz_id, question_order);

-- 7. 기존 퀴즈 데이터에 slug 추가 (있는 경우)
-- Add slug to existing quiz data if any
UPDATE public.quizzes 
SET slug = CASE 
  WHEN id = 'a0000000-0000-0000-0000-000000000001' THEN 'kpop-star-match'
  WHEN id = '268caf0b-0031-4e58-9245-606e3421f1fd' THEN 'mbti-celeb'
  WHEN title LIKE '%MBTI%' THEN 'mbti-test'
  ELSE LOWER(REPLACE(REGEXP_REPLACE(title, '[^a-zA-Z0-9\s]', '', 'g'), ' ', '-'))
END
WHERE slug IS NULL;

-- 8. quiz_results에 slug 업데이트
-- Update slug in quiz_results
UPDATE public.quiz_results qr
SET slug = LOWER(REPLACE(REGEXP_REPLACE(qr.result_type, '[^a-zA-Z0-9\s]', '', 'g'), ' ', '-'))
WHERE qr.slug IS NULL;

-- 9. RLS 정책 업데이트 - slug 기반 조회도 가능하도록
-- Update RLS policies to support slug-based queries
-- (기존 정책은 그대로 유지하되, slug를 통한 접근도 허용)

-- ============================================
-- 검증 쿼리 (Validation Queries)
-- ============================================
-- 아래 쿼리를 실행하여 마이그레이션이 정상적으로 완료되었는지 확인

-- 1. slug가 모든 퀴즈에 추가되었는지 확인
-- SELECT id, title, slug FROM public.quizzes WHERE slug IS NULL;
-- 결과: 0 rows (slug가 NULL인 퀴즈가 없어야 함)

-- 2. 중복된 slug가 있는지 확인
-- SELECT slug, COUNT(*) FROM public.quizzes GROUP BY slug HAVING COUNT(*) > 1;
-- 결과: 0 rows (중복된 slug가 없어야 함)

-- 3. quiz_results의 slug 확인
-- SELECT qr.id, q.slug as quiz_slug, qr.slug as result_slug, qr.result_type 
-- FROM public.quiz_results qr 
-- JOIN public.quizzes q ON qr.quiz_id = q.id 
-- LIMIT 10;

-- 4. 인덱스 확인
-- SELECT indexname, indexdef FROM pg_indexes WHERE tablename IN ('quizzes', 'quiz_results', 'quiz_questions') ORDER BY tablename, indexname;

-- ============================================
-- 보호 규칙 (Protection Rules)
-- ============================================
-- 다음 규칙들을 API 및 클라이언트 코드에서 강제해야 합니다:
-- 
-- 1. 새 퀴즈 생성 시 slug 필수 입력
-- 2. 모든 퀴즈 조회 시 quiz_id 또는 slug 명시
-- 3. quiz_results 조회 시 quiz_id 필터링 필수
-- 4. quiz_questions 조회 시 quiz_id 필터링 필수
-- 5. quiz_options 조회 시 quiz_id (through question_id) 필터링 필수
-- 6. 이미지 경로는 /public/quizzes/<slug>/ 형식으로 저장
-- 7. localStorage/sessionStorage 키는 'quiz:<slug>:<key>' 형식 사용
-- 8. React Query 키는 ['quiz', slug, ...] 형식 사용

-- ============================================
-- 롤백 스크립트 (Rollback Script)
-- ============================================
-- 필요시 아래 스크립트로 롤백 가능
-- 
-- ALTER TABLE public.quizzes DROP COLUMN IF EXISTS slug;
-- ALTER TABLE public.quiz_results DROP COLUMN IF EXISTS slug;
-- DROP INDEX IF EXISTS idx_quizzes_slug;
-- DROP INDEX IF EXISTS idx_quiz_results_quiz_slug;
-- DROP INDEX IF EXISTS idx_quiz_questions_quiz_order;

-- ============================================
-- 완료!
-- ============================================

