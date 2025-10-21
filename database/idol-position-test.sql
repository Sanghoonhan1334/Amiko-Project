-- ============================================
-- 아이돌 포지션 테스트 (Test de posición de idol)
-- Idol Position Test - Spanish Version
-- ============================================

-- 1. 퀴즈 생성
INSERT INTO public.quizzes (
  id,
  title,
  description,
  category,
  thumbnail_url,
  total_questions,
  is_active
) VALUES (
  'idol-position-test-001',
  'Test de posición de idol',
  '¿Qué posición tendrías en un grupo de K-POP? Descubre tu rol ideal con este test de personalidad.',
  'personality',
  NULL,
  3, -- 샘플로 3개 질문
  true
) ON CONFLICT (id) DO NOTHING;

-- 2. 질문들 추가 (샘플 3개)
INSERT INTO public.quiz_questions (id, quiz_id, question_text, question_order) VALUES
('q-idol-001', 'idol-position-test-001', 'En un grupo, tu fortaleza principal es:', 1),
('q-idol-002', 'idol-position-test-001', 'Cuando hay un problema en el grupo, tú:', 2),
('q-idol-003', 'idol-position-test-001', 'Tu estilo de liderazgo es:', 3);

-- 3. 선택지들 추가 (각 질문당 2개 선택지)
INSERT INTO public.quiz_options (id, question_id, option_text, option_order, result_type, score_value) VALUES
-- 질문 1: En un grupo, tu fortaleza principal es:
('opt-idol-001-a', 'q-idol-001', 'Mi voz es mi mayor talento', 1, 'vocalista', 10),
('opt-idol-001-b', 'q-idol-001', 'Soy bueno/a dirigiendo y organizando', 2, 'lider', 10),

-- 질문 2: Cuando hay un problema en el grupo, tú:
('opt-idol-002-a', 'q-idol-002', 'Canto para calmar la tensión', 1, 'vocalista', 10),
('opt-idol-002-b', 'q-idol-002', 'Tomo la iniciativa para resolverlo', 2, 'lider', 10),

-- 질문 3: Tu estilo de liderazgo es:
('opt-idol-003-a', 'q-idol-003', 'Inspiro con mi arte y creatividad', 1, 'vocalista', 10),
('opt-idol-003-b', 'q-idol-003', 'Guío con ejemplo y responsabilidad', 2, 'lider', 10);

-- 4. 결과 유형들 추가 (샘플 2개)
INSERT INTO public.quiz_results (
  id,
  quiz_id,
  result_type,
  title,
  description,
  image_url,
  min_score,
  max_score
) VALUES
(
  'result-vocalista',
  'idol-position-test-001',
  'vocalista',
  'Vocalista Principal',
  'Eres la voz del grupo. Tu talento vocal es excepcional y tienes la capacidad de emocionar a la audiencia con cada nota. Eres el corazón musical del equipo.',
  '/images/idol-positions/vocalista.jpg',
  20,
  30
),
(
  'result-lider',
  'idol-position-test-001',
  'lider',
  'Líder',
  'Eres el líder natural del grupo. Tienes la responsabilidad de guiar a los miembros, tomar decisiones importantes y representar al grupo en situaciones formales.',
  '/images/idol-positions/lider.jpg',
  20,
  30
);

-- 5. 결과 상세 정보를 위한 JSON 데이터 (quiz_results 테이블의 description 필드에 저장)
-- 실제로는 별도 테이블이나 JSONB 필드를 사용할 수 있지만, 
-- 여기서는 간단하게 description에 포함

-- Vocalista Principal 상세 정보 업데이트
UPDATE public.quiz_results 
SET description = '{
  "titulo": "Vocalista Principal",
  "descripcion": "Eres la voz del grupo. Tu talento vocal es excepcional y tienes la capacidad de emocionar a la audiencia con cada nota. Eres el corazón musical del equipo.",
  "precaucion": "Recuerda cuidar tu voz y no sobreesforzarte. Tu salud vocal es crucial para el grupo.",
  "compatible": "Líder, Centro",
  "incompatible": "Rapera Principal",
  "imagen": "/images/idol-positions/vocalista.jpg"
}'::jsonb
WHERE id = 'result-vocalista';

-- Líder 상세 정보 업데이트
UPDATE public.quiz_results 
SET description = '{
  "titulo": "Líder",
  "descripcion": "Eres el líder natural del grupo. Tienes la responsabilidad de guiar a los miembros, tomar decisiones importantes y representar al grupo en situaciones formales.",
  "precaucion": "La responsabilidad puede ser abrumadora. Asegúrate de cuidar tu bienestar mental.",
  "compatible": "Vocalista Principal, Centro",
  "incompatible": "La Menor (Maknae)",
  "imagen": "/images/idol-positions/lider.jpg"
}'::jsonb
WHERE id = 'result-lider';

-- 6. 인덱스 생성 (성능 최적화)
CREATE INDEX IF NOT EXISTS idx_quiz_options_result_type ON public.quiz_options(result_type);
CREATE INDEX IF NOT EXISTS idx_quiz_results_quiz_id ON public.quiz_results(quiz_id);
CREATE INDEX IF NOT EXISTS idx_quiz_results_result_type ON public.quiz_results(result_type);

-- 7. RLS 정책 (이미 있다면 무시)
DO $$
BEGIN
    -- quiz_options 테이블에 대한 RLS 정책
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'quiz_options' 
        AND policyname = 'quiz_options_select_policy'
    ) THEN
        CREATE POLICY "quiz_options_select_policy" ON public.quiz_options
            FOR SELECT USING (true);
    END IF;
    
    -- quiz_results 테이블에 대한 RLS 정책
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'quiz_results' 
        AND policyname = 'quiz_results_select_policy'
    ) THEN
        CREATE POLICY "quiz_results_select_policy" ON public.quiz_results
            FOR SELECT USING (true);
    END IF;
END $$;

-- 8. 확인 쿼리
SELECT 
    q.title as quiz_title,
    COUNT(qq.id) as total_questions,
    COUNT(qo.id) as total_options,
    COUNT(qr.id) as total_results
FROM public.quizzes q
LEFT JOIN public.quiz_questions qq ON q.id = qq.quiz_id
LEFT JOIN public.quiz_options qo ON qq.id = qo.question_id
LEFT JOIN public.quiz_results qr ON q.id = qr.quiz_id
WHERE q.id = 'idol-position-test-001'
GROUP BY q.id, q.title;
