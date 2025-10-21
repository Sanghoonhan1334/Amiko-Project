-- 아이돌 포지션 테스트를 quizzes 테이블에 추가 (UUID 자동 생성)
INSERT INTO public.quizzes (
  id,
  title,
  description,
  category,
  thumbnail_url,
  total_questions,
  is_active,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(), -- UUID 자동 생성
  'Test de posición de idol',
  '¿Qué posición tendrías en un grupo de K-POP? Descubre tu rol ideal con este test de personalidad.',
  'personality',
  NULL,
  3,
  true,
  NOW(),
  NOW()
);

-- 생성된 퀴즈 확인
SELECT id, title, description, category, is_active 
FROM public.quizzes 
WHERE title = 'Test de posición de idol';
