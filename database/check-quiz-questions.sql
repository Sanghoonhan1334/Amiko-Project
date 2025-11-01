-- 각 퀴즈의 질문 개수 확인
SELECT 
  q.id,
  q.title,
  q.slug,
  q.category,
  COUNT(qq.id) as question_count,
  q.is_active
FROM quizzes q
LEFT JOIN quiz_questions qq ON q.id = qq.quiz_id
WHERE q.is_active = true
GROUP BY q.id, q.title, q.slug, q.category, q.is_active
ORDER BY q.created_at DESC;

-- 특정 퀴즈들의 상세 정보
SELECT 
  q.id,
  q.title,
  q.slug,
  qq.id as question_id,
  qq.question_text,
  qq.question_order
FROM quizzes q
LEFT JOIN quiz_questions qq ON q.id = qq.quiz_id
WHERE q.slug IN ('korean-level', 'zodiac', 'fortune')
   OR q.title LIKE '%한국어%'
   OR q.title LIKE '%Coreano%'
   OR q.title LIKE '%Oriental%'
   OR q.title LIKE '%Fortuna%'
ORDER BY q.title, qq.question_order;

