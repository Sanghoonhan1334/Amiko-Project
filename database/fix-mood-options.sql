-- ============================================
-- Mood Quiz 선택지 재생성
-- ============================================

DO $$
DECLARE
  mood_quiz_id UUID;
  q_id UUID;
BEGIN
  -- Mood quiz ID 가져오기
  SELECT id INTO mood_quiz_id FROM public.quizzes WHERE slug = 'mood' LIMIT 1;
  
  IF mood_quiz_id IS NULL THEN
    RAISE EXCEPTION 'Mood quiz를 찾을 수 없습니다.';
  END IF;

  RAISE NOTICE 'Mood Quiz ID: %', mood_quiz_id;

  -- ============================================
  -- Pregunta 1: ¿Cuál es más importante para ti?
  -- ============================================
  SELECT id INTO q_id FROM public.quiz_questions WHERE quiz_id = mood_quiz_id AND question_order = 1 LIMIT 1;
  IF q_id IS NOT NULL THEN
    DELETE FROM public.quiz_options WHERE question_id = q_id;
    INSERT INTO public.quiz_options (question_id, option_text, result_type, option_order) VALUES
    (q_id, 'Creer en mí mismo', 'cosmic-logic', 1),
    (q_id, 'Amarme a mí mismo', 'warm-nest', 2);
    RAISE NOTICE 'Pregunta 1: 선택지 추가 완료';
  END IF;

  -- ============================================
  -- Pregunta 2: Si tuvieras un sueño esta noche...
  -- ============================================
  SELECT id INTO q_id FROM public.quiz_questions WHERE quiz_id = mood_quiz_id AND question_order = 2 LIMIT 1;
  IF q_id IS NOT NULL THEN
    DELETE FROM public.quiz_options WHERE question_id = q_id;
    INSERT INTO public.quiz_options (question_id, option_text, result_type, option_order) VALUES
    (q_id, 'Un sueño donde soy el protagonista de un cuento de hadas fantástico', 'dreamy-wave', 1),
    (q_id, 'Un sueño donde estoy con la persona que amo', 'warm-nest', 2);
    RAISE NOTICE 'Pregunta 2: 선택지 추가 완료';
  END IF;

  -- ============================================
  -- Pregunta 3: En un día soleado...
  -- ============================================
  SELECT id INTO q_id FROM public.quiz_questions WHERE quiz_id = mood_quiz_id AND question_order = 3 LIMIT 1;
  IF q_id IS NOT NULL THEN
    DELETE FROM public.quiz_options WHERE question_id = q_id;
    INSERT INTO public.quiz_options (question_id, option_text, result_type, option_order) VALUES
    (q_id, 'Charlar con amigos en el parque', 'shooting-star', 1),
    (q_id, 'Caminar solo por el parque escuchando música', 'quiet-lake', 2);
    RAISE NOTICE 'Pregunta 3: 선택지 추가 완료';
  END IF;

  -- ============================================
  -- Pregunta 4: Cuando necesitas resolver un problema...
  -- ============================================
  SELECT id INTO q_id FROM public.quiz_questions WHERE quiz_id = mood_quiz_id AND question_order = 4 LIMIT 1;
  IF q_id IS NOT NULL THEN
    DELETE FROM public.quiz_options WHERE question_id = q_id;
    INSERT INTO public.quiz_options (question_id, option_text, result_type, option_order) VALUES
    (q_id, 'Cerrar los ojos e imaginar la situación', 'dreamy-wave', 1),
    (q_id, 'Abrir los ojos y observar el entorno', 'crystal-clear', 2);
    RAISE NOTICE 'Pregunta 4: 선택지 추가 완료';
  END IF;

  -- ============================================
  -- Pregunta 5: ¿Qué tipo de regalo te gustaría darte...
  -- ============================================
  SELECT id INTO q_id FROM public.quiz_questions WHERE quiz_id = mood_quiz_id AND question_order = 5 LIMIT 1;
  IF q_id IS NOT NULL THEN
    DELETE FROM public.quiz_options WHERE question_id = q_id;
    INSERT INTO public.quiz_options (question_id, option_text, result_type, option_order) VALUES
    (q_id, 'Un ramo de flores simple pero elegante', 'quiet-lake', 1),
    (q_id, 'Ropa que dudaba en comprar porque era un poco cara', 'neon-pulse', 2);
    RAISE NOTICE 'Pregunta 5: 선택지 추가 완료';
  END IF;

  -- ============================================
  -- Pregunta 6: Cuando pasas por algo triste...
  -- ============================================
  SELECT id INTO q_id FROM public.quiz_questions WHERE quiz_id = mood_quiz_id AND question_order = 6 LIMIT 1;
  IF q_id IS NOT NULL THEN
    DELETE FROM public.quiz_options WHERE question_id = q_id;
    INSERT INTO public.quiz_options (question_id, option_text, result_type, option_order) VALUES
    (q_id, 'Ver una película o leer un libro triste y llorar a mares', 'dreamy-wave', 1),
    (q_id, 'Calmar mi corazón y escribir en un diario', 'crystal-clear', 2);
    RAISE NOTICE 'Pregunta 6: 선택지 추가 완료';
  END IF;

  -- ============================================
  -- Pregunta 7: ¿Cuál es la mejor situación?
  -- ============================================
  SELECT id INTO q_id FROM public.quiz_questions WHERE quiz_id = mood_quiz_id AND question_order = 7 LIMIT 1;
  IF q_id IS NOT NULL THEN
    DELETE FROM public.quiz_options WHERE question_id = q_id;
    INSERT INTO public.quiz_options (question_id, option_text, result_type, option_order) VALUES
    (q_id, 'Ser feliz hoy pero no poder predecir nada sobre mañana', 'shooting-star', 1),
    (q_id, 'Estar triste hoy pero tener garantizada la felicidad de mañana', 'cosmic-logic', 2);
    RAISE NOTICE 'Pregunta 7: 선택지 추가 완료';
  END IF;

  -- ============================================
  -- Pregunta 8: ¿Qué te gustaría escuchar más?
  -- ============================================
  SELECT id INTO q_id FROM public.quiz_questions WHERE quiz_id = mood_quiz_id AND question_order = 8 LIMIT 1;
  IF q_id IS NOT NULL THEN
    DELETE FROM public.quiz_options WHERE question_id = q_id;
    INSERT INTO public.quiz_options (question_id, option_text, result_type, option_order) VALUES
    (q_id, 'Me gusta porque conectamos bien en las conversaciones', 'cosmic-logic', 1),
    (q_id, 'Me gusta porque estoy contigo', 'warm-nest', 2);
    RAISE NOTICE 'Pregunta 8: 선택지 추가 완료';
  END IF;

  -- ============================================
  -- Pregunta 9: En un sueño, cuando hay dos caminos...
  -- ============================================
  SELECT id INTO q_id FROM public.quiz_questions WHERE quiz_id = mood_quiz_id AND question_order = 9 LIMIT 1;
  IF q_id IS NOT NULL THEN
    DELETE FROM public.quiz_options WHERE question_id = q_id;
    INSERT INTO public.quiz_options (question_id, option_text, result_type, option_order) VALUES
    (q_id, 'El camino con muchas huellas', 'horizon-runner', 1),
    (q_id, 'El camino limpio que nadie ha pisado', 'dreamy-wave', 2);
    RAISE NOTICE 'Pregunta 9: 선택지 추가 완료';
  END IF;

  -- ============================================
  -- Pregunta 10: ¿Cuál es tu momento favorito del día?
  -- ============================================
  SELECT id INTO q_id FROM public.quiz_questions WHERE quiz_id = mood_quiz_id AND question_order = 10 LIMIT 1;
  IF q_id IS NOT NULL THEN
    DELETE FROM public.quiz_options WHERE question_id = q_id;
    INSERT INTO public.quiz_options (question_id, option_text, result_type, option_order) VALUES
    (q_id, 'El amanecer silencioso donde puedo organizar mis pensamientos', 'quiet-lake', 1),
    (q_id, 'El mediodía lleno de energía incluso cuando estoy quieto', 'horizon-runner', 2);
    RAISE NOTICE 'Pregunta 10: 선택지 추가 완료';
  END IF;

  -- ============================================
  -- Pregunta 11: ¿Cómo crees que eres?
  -- ============================================
  SELECT id INTO q_id FROM public.quiz_questions WHERE quiz_id = mood_quiz_id AND question_order = 11 LIMIT 1;
  IF q_id IS NOT NULL THEN
    DELETE FROM public.quiz_options WHERE question_id = q_id;
    INSERT INTO public.quiz_options (question_id, option_text, result_type, option_order) VALUES
    (q_id, 'Una persona que siempre desafía cosas nuevas', 'neon-pulse', 1),
    (q_id, 'Una persona que siempre busca la perfección', 'crystal-clear', 2);
    RAISE NOTICE 'Pregunta 11: 선택지 추가 완료';
  END IF;

  -- ============================================
  -- Pregunta 12: ¿Cuál es el momento que más te emociona?
  -- ============================================
  SELECT id INTO q_id FROM public.quiz_questions WHERE quiz_id = mood_quiz_id AND question_order = 12 LIMIT 1;
  IF q_id IS NOT NULL THEN
    DELETE FROM public.quiz_options WHERE question_id = q_id;
    INSERT INTO public.quiz_options (question_id, option_text, result_type, option_order) VALUES
    (q_id, 'Cuando voy a conocer a alguien nuevo', 'shooting-star', 1),
    (q_id, 'Cuando termino mis tareas y regreso a casa', 'warm-nest', 2);
    RAISE NOTICE 'Pregunta 12: 선택지 추가 완료';
  END IF;

  RAISE NOTICE '모든 선택지 재생성 완료!';
END $$;

-- 최종 확인: 각 질문별 선택지 개수
SELECT 
    q.question_order,
    COUNT(o.id) as option_count
FROM public.quiz_questions q
LEFT JOIN public.quiz_options o ON q.id = o.question_id
WHERE q.quiz_id = (SELECT id FROM public.quizzes WHERE slug = 'mood' LIMIT 1)
GROUP BY q.question_order
ORDER BY q.question_order;

