-- 운세 테스트 참여자 수 증가 함수
-- Function to increment fortune test participants

-- 1. slug에 UNIQUE 제약조건이 있는지 확인하고 없으면 생성
DO $$
BEGIN
  -- UNIQUE 인덱스 생성 (제약조건 대신)
  CREATE UNIQUE INDEX IF NOT EXISTS idx_quizzes_slug_unique 
  ON public.quizzes(slug) 
  WHERE slug IS NOT NULL;
  
  RAISE NOTICE '✅ slug UNIQUE 인덱스 확인/생성 완료';
END $$;

-- 2. 참여자 수 증가 함수 생성 (더 간단한 버전)
CREATE OR REPLACE FUNCTION increment_fortune_participants()
RETURNS INTEGER AS $$
DECLARE
  new_count INTEGER;
  quiz_exists BOOLEAN;
BEGIN
  -- slug='fortune'인 퀴즈가 있는지 확인
  SELECT EXISTS(SELECT 1 FROM public.quizzes WHERE slug = 'fortune') INTO quiz_exists;
  
  -- 퀴즈가 없으면 생성
  IF NOT quiz_exists THEN
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
      1,
      true,
      NOW(),
      NOW()
    );
    
    RETURN 1;
  ELSE
    -- 참여자 수 증가
    UPDATE public.quizzes
    SET 
      total_participants = COALESCE(total_participants, 0) + 1,
      updated_at = NOW()
    WHERE slug = 'fortune'
    RETURNING total_participants INTO new_count;
    
    RETURN new_count;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. 함수 테스트
SELECT increment_fortune_participants() as new_participant_count;

-- 4. 현재 상태 확인
SELECT 
  id,
  slug,
  title,
  total_participants,
  updated_at
FROM public.quizzes
WHERE slug = 'fortune';

