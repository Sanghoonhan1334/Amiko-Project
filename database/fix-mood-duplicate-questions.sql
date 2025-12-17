-- ============================================
-- Mood 테스트 중복 질문 제거
-- Remove duplicate questions from Mood test
-- ============================================

-- quiz_id와 question_order 조합으로 중복된 질문 찾기
WITH duplicate_questions AS (
  SELECT 
    quiz_id,
    question_order,
    (array_agg(id ORDER BY created_at ASC, id ASC))[1] as keep_id,
    array_agg(id ORDER BY created_at ASC, id ASC) as all_ids
  FROM public.quiz_questions
  WHERE quiz_id = (SELECT id FROM public.quizzes WHERE slug = 'mood')
  GROUP BY quiz_id, question_order
  HAVING COUNT(*) > 1
)
-- 중복된 질문들 중 첫 번째를 제외하고 모두 삭제
DELETE FROM public.quiz_questions
WHERE id IN (
  SELECT unnest(all_ids[2:]) -- 첫 번째를 제외한 나머지 ID들
  FROM duplicate_questions
);

-- 중복 제거 후 확인 (중복이 없으면 결과가 없어야 함)
SELECT 
  question_order,
  COUNT(*) as count,
  array_agg(id::text) as question_ids
FROM public.quiz_questions
WHERE quiz_id = (SELECT id FROM public.quizzes WHERE slug = 'mood')
GROUP BY question_order
HAVING COUNT(*) > 1;

-- 최종 확인: 각 question_order마다 하나씩만 있는지 확인
SELECT 
  question_order,
  COUNT(*) as count
FROM public.quiz_questions
WHERE quiz_id = (SELECT id FROM public.quizzes WHERE slug = 'mood')
GROUP BY question_order
ORDER BY question_order;

