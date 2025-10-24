-- ============================================
-- 퀴즈 내용을 스페인어로 업데이트
-- Update Quiz Content to Spanish
-- ============================================

-- K-POP 스타 MBTI 매칭 테스트를 스페인어로 업데이트
UPDATE public.quizzes 
SET 
  title = 'Test de MBTI con Estrellas K-POP',
  description = 'Descubre tu MBTI con 12 preguntas y encuentra qué estrella K-POP coincide contigo'
WHERE title ILIKE '%K-POP 스타 MBTI%';

-- 기존 K-POP 스타 테스트도 스페인어로 업데이트
UPDATE public.quizzes 
SET 
  title = '¿Qué Estrella K-POP se Parece a Ti?',
  description = 'Descubre qué estrella K-POP coincide con tu personalidad'
WHERE title ILIKE '%당신과 닮은 K-POP 스타%';

-- 확인
SELECT 
  id,
  title,
  description,
  thumbnail_url,
  total_questions,
  category
FROM public.quizzes
ORDER BY created_at DESC;
