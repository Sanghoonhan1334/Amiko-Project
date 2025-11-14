-- 운세 테스트 퀴즈 생성/확인 스크립트
-- Fortune Test Quiz Creation/Verification Script

-- 1. slug='fortune'인 퀴즈가 있는지 확인
SELECT 
  id,
  slug,
  title,
  total_participants,
  is_active,
  created_at
FROM public.quizzes
WHERE slug = 'fortune';

-- 2. 없으면 생성 (UPSERT 방식)
INSERT INTO public.quizzes (
  slug,
  title,
  description,
  category,
  thumbnail_url,
  total_questions,
  total_participants,
  is_active,
  created_at,
  updated_at
)
VALUES (
  'fortune',
  'Test de Fortuna Personalizada',
  'Descubre tu fortuna de hoy basada en tu estado emocional y personalidad. ¡Un test único que te revelará qué te depara el destino!',
  'fortune',
  '/quizzes/fortune/cover/cover.png',
  9,
  0,
  true,
  NOW(),
  NOW()
)
ON CONFLICT (slug) DO UPDATE
SET 
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  category = EXCLUDED.category,
  thumbnail_url = EXCLUDED.thumbnail_url,
  total_questions = EXCLUDED.total_questions,
  is_active = EXCLUDED.is_active,
  updated_at = NOW();

-- 3. slug에 UNIQUE 인덱스가 있는지 확인하고 없으면 생성
CREATE UNIQUE INDEX IF NOT EXISTS idx_quizzes_slug_unique 
ON public.quizzes(slug);

-- 4. 최종 확인
SELECT 
  id,
  slug,
  title,
  total_participants,
  is_active,
  created_at,
  updated_at
FROM public.quizzes
WHERE slug = 'fortune';

