-- ============================================
-- Mood Quiz 상태 확인 쿼리
-- ============================================

-- 1. Quiz 존재 여부 확인
SELECT 
    id,
    slug,
    title,
    is_active,
    total_questions,
    created_at
FROM public.quizzes
WHERE slug = 'mood';

-- 2. Quiz 질문 개수 확인
SELECT 
    COUNT(*) as question_count,
    MIN(question_order) as min_order,
    MAX(question_order) as max_order
FROM public.quiz_questions
WHERE quiz_id = (SELECT id FROM public.quizzes WHERE slug = 'mood' LIMIT 1);

-- 3. Quiz 질문 목록 확인
SELECT 
    id,
    question_text,
    question_order
FROM public.quiz_questions
WHERE quiz_id = (SELECT id FROM public.quizzes WHERE slug = 'mood' LIMIT 1)
ORDER BY question_order;

-- 4. Quiz 선택지 개수 확인
SELECT 
    q.question_order,
    COUNT(o.id) as option_count
FROM public.quiz_questions q
LEFT JOIN public.quiz_options o ON q.id = o.question_id
WHERE q.quiz_id = (SELECT id FROM public.quizzes WHERE slug = 'mood' LIMIT 1)
GROUP BY q.question_order
ORDER BY q.question_order;

-- 5. Quiz 결과 개수 확인
SELECT 
    COUNT(*) as result_count
FROM public.quiz_results
WHERE quiz_id = (SELECT id FROM public.quizzes WHERE slug = 'mood' LIMIT 1);

