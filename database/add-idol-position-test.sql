-- ============================================
-- 아이돌 포지션 테스트 추가
-- Add Idol Position Test to Database
-- ============================================

-- 아이돌 포지션 테스트 추가
INSERT INTO public.quizzes (
  title,
  description,
  category,
  thumbnail_url,
  total_questions,
  is_active,
  created_at,
  updated_at
) VALUES (
  '¿Qué posición de idol me quedaría mejor?',
  'Descubre qué posición de idol te queda mejor con 12 preguntas',
  'personality',
  '/quizzes/idol-position/thumbnail.png',
  12,
  true,
  NOW(),
  NOW()
);

-- 확인
SELECT 
  id,
  title,
  description,
  category,
  thumbnail_url,
  total_questions,
  is_active
FROM public.quizzes
WHERE title ILIKE '%posición de idol%'
ORDER BY created_at DESC;
