-- ============================================
-- Mood Quiz 선택지 확인
-- ============================================

-- 각 질문별 선택지 개수 확인
SELECT 
    q.question_order,
    q.question_text,
    COUNT(o.id) as option_count,
    STRING_AGG(o.option_text, ' | ') as options
FROM public.quiz_questions q
LEFT JOIN public.quiz_options o ON q.id = o.question_id
WHERE q.quiz_id = (SELECT id FROM public.quizzes WHERE slug = 'mood' LIMIT 1)
GROUP BY q.question_order, q.question_text
ORDER BY q.question_order;

