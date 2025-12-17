-- ============================================
-- Agregar test Mood
-- Encuentra tu Mood Test
-- ============================================

-- 1. Crear quiz
INSERT INTO public.quizzes (
  id,
  slug,
  title,
  description,
  category,
  thumbnail_url,
  total_questions,
  total_participants,
  is_active
) VALUES (
  gen_random_uuid(),
  'mood',
  'Encuentra tu Mood',
  'En medio de una rutina acelerada, a veces olvidamos cuál es nuestro verdadero mood. Con el test "Encuentra tu Mood", podrás descubrir la vibra que te define en este momento.',
  'personality',
  '/quizzes/mood/cover/cover.png',
  12,
  0,
  true
) ON CONFLICT (slug) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  thumbnail_url = EXCLUDED.thumbnail_url,
  total_questions = EXCLUDED.total_questions;

-- 퀴즈 ID 가져오기
DO $$
DECLARE
  mood_quiz_id UUID;
  q_id UUID;
BEGIN
  -- Obtener ID del quiz
  SELECT id INTO mood_quiz_id FROM public.quizzes WHERE slug = 'mood';
  
  IF mood_quiz_id IS NULL THEN
    RAISE EXCEPTION 'No se pudo encontrar el quiz.';
  END IF;

  -- ============================================
  -- Pregunta 1: ¿Cuál es más importante para ti?
  -- ============================================
  SELECT id INTO q_id FROM public.quiz_questions WHERE quiz_id = mood_quiz_id AND question_order = 1;
  IF q_id IS NULL THEN
    q_id := gen_random_uuid();
    INSERT INTO public.quiz_questions (id, quiz_id, question_text, question_order) VALUES
    (q_id, mood_quiz_id, '¿Cuál es más importante para ti?', 1);
  ELSE
    UPDATE public.quiz_questions SET question_text = '¿Cuál es más importante para ti?' WHERE id = q_id;
  END IF;

  DELETE FROM public.quiz_options WHERE question_id = q_id;
  INSERT INTO public.quiz_options (question_id, option_text, result_type, option_order) VALUES
  (q_id, 'Creer en mí mismo', 'cosmic-logic', 1),
  (q_id, 'Amarme a mí mismo', 'warm-nest', 2);

  -- ============================================
  -- Pregunta 2: Si tuvieras un sueño esta noche, ¿qué tipo de sueño te gustaría tener?
  -- ============================================
  SELECT id INTO q_id FROM public.quiz_questions WHERE quiz_id = mood_quiz_id AND question_order = 2;
  IF q_id IS NULL THEN
    q_id := gen_random_uuid();
    INSERT INTO public.quiz_questions (id, quiz_id, question_text, question_order) VALUES
    (q_id, mood_quiz_id, 'Si tuvieras un sueño esta noche, ¿qué tipo de sueño te gustaría tener?', 2);
  ELSE
    UPDATE public.quiz_questions SET question_text = 'Si tuvieras un sueño esta noche, ¿qué tipo de sueño te gustaría tener?' WHERE id = q_id;
  END IF;

  DELETE FROM public.quiz_options WHERE question_id = q_id;
  INSERT INTO public.quiz_options (question_id, option_text, result_type, option_order) VALUES
  (q_id, 'Un sueño donde soy el protagonista de un cuento de hadas fantástico', 'dreamy-wave', 1),
  (q_id, 'Un sueño donde estoy con la persona que amo', 'warm-nest', 2);

  -- ============================================
  -- Pregunta 3: En un día soleado, si tuvieras tiempo libre, ¿qué te gustaría hacer?
  -- ============================================
  SELECT id INTO q_id FROM public.quiz_questions WHERE quiz_id = mood_quiz_id AND question_order = 3;
  IF q_id IS NULL THEN
    q_id := gen_random_uuid();
    INSERT INTO public.quiz_questions (id, quiz_id, question_text, question_order) VALUES
    (q_id, mood_quiz_id, 'En un día soleado, si tuvieras tiempo libre, ¿qué te gustaría hacer?', 3);
  ELSE
    UPDATE public.quiz_questions SET question_text = 'En un día soleado, si tuvieras tiempo libre, ¿qué te gustaría hacer?' WHERE id = q_id;
  END IF;

  DELETE FROM public.quiz_options WHERE question_id = q_id;
  INSERT INTO public.quiz_options (question_id, option_text, result_type, option_order) VALUES
  (q_id, 'Charlar con amigos en el parque', 'shooting-star', 1),
  (q_id, 'Caminar solo por el parque escuchando música', 'quiet-lake', 2);

  -- ============================================
  -- Pregunta 4: Cuando necesitas resolver un problema, ¿qué haces primero?
  -- ============================================
  SELECT id INTO q_id FROM public.quiz_questions WHERE quiz_id = mood_quiz_id AND question_order = 4;
  IF q_id IS NULL THEN
    q_id := gen_random_uuid();
    INSERT INTO public.quiz_questions (id, quiz_id, question_text, question_order) VALUES
    (q_id, mood_quiz_id, 'Cuando necesitas resolver un problema, ¿qué haces primero?', 4);
  ELSE
    UPDATE public.quiz_questions SET question_text = 'Cuando necesitas resolver un problema, ¿qué haces primero?' WHERE id = q_id;
  END IF;

  DELETE FROM public.quiz_options WHERE question_id = q_id;
  INSERT INTO public.quiz_options (question_id, option_text, result_type, option_order) VALUES
  (q_id, 'Cerrar los ojos e imaginar la situación', 'dreamy-wave', 1),
  (q_id, 'Abrir los ojos y observar el entorno', 'crystal-clear', 2);

  -- ============================================
  -- Pregunta 5: ¿Qué tipo de regalo te gustaría darte a ti mismo después de un día de trabajo?
  -- ============================================
  -- question_order로 찾기 시도
  SELECT id INTO q_id FROM public.quiz_questions WHERE quiz_id = mood_quiz_id AND question_order = 5 LIMIT 1;
  -- 없으면 한글 질문 텍스트로 찾기
  IF q_id IS NULL THEN
    SELECT id INTO q_id FROM public.quiz_questions WHERE quiz_id = mood_quiz_id AND question_text LIKE '%하루동안 수고한%' LIMIT 1;
  END IF;
  IF q_id IS NULL THEN
    q_id := gen_random_uuid();
    INSERT INTO public.quiz_questions (id, quiz_id, question_text, question_order) VALUES
    (q_id, mood_quiz_id, '¿Qué tipo de regalo te gustaría darte a ti mismo después de un día de trabajo?', 5);
  ELSE
    UPDATE public.quiz_questions SET question_text = '¿Qué tipo de regalo te gustaría darte a ti mismo después de un día de trabajo?', question_order = 5 WHERE id = q_id;
  END IF;

  DELETE FROM public.quiz_options WHERE question_id = q_id;
  INSERT INTO public.quiz_options (question_id, option_text, result_type, option_order) VALUES
  (q_id, 'Un ramo de flores simple pero elegante', 'quiet-lake', 1),
  (q_id, 'Ropa que dudaba en comprar porque era un poco cara', 'neon-pulse', 2);

  -- ============================================
  -- Pregunta 6: Cuando pasas por algo triste, ¿cómo sueles reaccionar?
  -- ============================================
  SELECT id INTO q_id FROM public.quiz_questions WHERE quiz_id = mood_quiz_id AND question_order = 6;
  IF q_id IS NULL THEN
    q_id := gen_random_uuid();
    INSERT INTO public.quiz_questions (id, quiz_id, question_text, question_order) VALUES
    (q_id, mood_quiz_id, 'Cuando pasas por algo triste, ¿cómo sueles reaccionar?', 6);
  ELSE
    UPDATE public.quiz_questions SET question_text = 'Cuando pasas por algo triste, ¿cómo sueles reaccionar?' WHERE id = q_id;
  END IF;

  DELETE FROM public.quiz_options WHERE question_id = q_id;
  INSERT INTO public.quiz_options (question_id, option_text, result_type, option_order) VALUES
  (q_id, 'Ver una película o leer un libro triste y llorar a mares', 'dreamy-wave', 1),
  (q_id, 'Calmar mi corazón y escribir en un diario', 'crystal-clear', 2);

  -- ============================================
  -- Pregunta 7: ¿Cuál es la mejor situación?
  -- ============================================
  SELECT id INTO q_id FROM public.quiz_questions WHERE quiz_id = mood_quiz_id AND question_order = 7;
  IF q_id IS NULL THEN
    q_id := gen_random_uuid();
    INSERT INTO public.quiz_questions (id, quiz_id, question_text, question_order) VALUES
    (q_id, mood_quiz_id, '¿Cuál es la mejor situación?', 7);
  ELSE
    UPDATE public.quiz_questions SET question_text = '¿Cuál es la mejor situación?' WHERE id = q_id;
  END IF;

  DELETE FROM public.quiz_options WHERE question_id = q_id;
  INSERT INTO public.quiz_options (question_id, option_text, result_type, option_order) VALUES
  (q_id, 'Ser feliz hoy pero no poder predecir nada sobre mañana', 'shooting-star', 1),
  (q_id, 'Estar triste hoy pero tener garantizada la felicidad de mañana', 'cosmic-logic', 2);

  -- ============================================
  -- Pregunta 8: ¿Qué te gustaría escuchar más?
  -- ============================================
  SELECT id INTO q_id FROM public.quiz_questions WHERE quiz_id = mood_quiz_id AND question_order = 8;
  IF q_id IS NULL THEN
    q_id := gen_random_uuid();
    INSERT INTO public.quiz_questions (id, quiz_id, question_text, question_order) VALUES
    (q_id, mood_quiz_id, '¿Qué te gustaría escuchar más?', 8);
  ELSE
    UPDATE public.quiz_questions SET question_text = '¿Qué te gustaría escuchar más?' WHERE id = q_id;
  END IF;

  DELETE FROM public.quiz_options WHERE question_id = q_id;
  INSERT INTO public.quiz_options (question_id, option_text, result_type, option_order) VALUES
  (q_id, 'Me gusta porque conectamos bien en las conversaciones', 'cosmic-logic', 1),
  (q_id, 'Me gusta porque estoy contigo', 'warm-nest', 2);

  -- ============================================
  -- Pregunta 9: En un sueño, cuando hay dos caminos frente a ti, ¿cuál elegirías?
  -- ============================================
  SELECT id INTO q_id FROM public.quiz_questions WHERE quiz_id = mood_quiz_id AND question_order = 9;
  IF q_id IS NULL THEN
    q_id := gen_random_uuid();
    INSERT INTO public.quiz_questions (id, quiz_id, question_text, question_order) VALUES
    (q_id, mood_quiz_id, 'En un sueño, cuando hay dos caminos frente a ti, ¿cuál elegirías?', 9);
  ELSE
    UPDATE public.quiz_questions SET question_text = 'En un sueño, cuando hay dos caminos frente a ti, ¿cuál elegirías?' WHERE id = q_id;
  END IF;

  DELETE FROM public.quiz_options WHERE question_id = q_id;
  INSERT INTO public.quiz_options (question_id, option_text, result_type, option_order) VALUES
  (q_id, 'El camino con muchas huellas', 'horizon-runner', 1),
  (q_id, 'El camino limpio que nadie ha pisado', 'dreamy-wave', 2);

  -- ============================================
  -- Pregunta 10: ¿Cuál es tu momento favorito del día?
  -- ============================================
  SELECT id INTO q_id FROM public.quiz_questions WHERE quiz_id = mood_quiz_id AND question_order = 10;
  IF q_id IS NULL THEN
    q_id := gen_random_uuid();
    INSERT INTO public.quiz_questions (id, quiz_id, question_text, question_order) VALUES
    (q_id, mood_quiz_id, '¿Cuál es tu momento favorito del día?', 10);
  ELSE
    UPDATE public.quiz_questions SET question_text = '¿Cuál es tu momento favorito del día?' WHERE id = q_id;
  END IF;

  DELETE FROM public.quiz_options WHERE question_id = q_id;
  INSERT INTO public.quiz_options (question_id, option_text, result_type, option_order) VALUES
  (q_id, 'El amanecer silencioso donde puedo organizar mis pensamientos', 'quiet-lake', 1),
  (q_id, 'El mediodía lleno de energía incluso cuando estoy quieto', 'horizon-runner', 2);

  -- ============================================
  -- Pregunta 11: ¿Cómo crees que eres?
  -- ============================================
  -- question_order로 찾기 시도
  SELECT id INTO q_id FROM public.quiz_questions WHERE quiz_id = mood_quiz_id AND question_order = 11 LIMIT 1;
  -- 없으면 한글 질문 텍스트로 찾기
  IF q_id IS NULL THEN
    SELECT id INTO q_id FROM public.quiz_questions WHERE quiz_id = mood_quiz_id AND question_text LIKE '%당신이 생각하는 당신의 모습%' LIMIT 1;
  END IF;
  IF q_id IS NULL THEN
    q_id := gen_random_uuid();
    INSERT INTO public.quiz_questions (id, quiz_id, question_text, question_order) VALUES
    (q_id, mood_quiz_id, '¿Cómo crees que eres?', 11);
  ELSE
    UPDATE public.quiz_questions SET question_text = '¿Cómo crees que eres?', question_order = 11 WHERE id = q_id;
  END IF;

  DELETE FROM public.quiz_options WHERE question_id = q_id;
  INSERT INTO public.quiz_options (question_id, option_text, result_type, option_order) VALUES
  (q_id, 'Una persona que siempre desafía cosas nuevas', 'neon-pulse', 1),
  (q_id, 'Una persona que siempre busca la perfección', 'crystal-clear', 2);

  -- ============================================
  -- Pregunta 12: ¿Cuál es el momento que más te emociona?
  -- ============================================
  SELECT id INTO q_id FROM public.quiz_questions WHERE quiz_id = mood_quiz_id AND question_order = 12;
  IF q_id IS NULL THEN
    q_id := gen_random_uuid();
    INSERT INTO public.quiz_questions (id, quiz_id, question_text, question_order) VALUES
    (q_id, mood_quiz_id, '¿Cuál es el momento que más te emociona?', 12);
  ELSE
    UPDATE public.quiz_questions SET question_text = '¿Cuál es el momento que más te emociona?' WHERE id = q_id;
  END IF;

  DELETE FROM public.quiz_options WHERE question_id = q_id;
  INSERT INTO public.quiz_options (question_id, option_text, result_type, option_order) VALUES
  (q_id, 'Cuando voy a conocer a alguien nuevo', 'shooting-star', 1),
  (q_id, 'Cuando termino mis tareas y regreso a casa', 'warm-nest', 2);

  -- ============================================
  -- Agregar tipos de resultados
  -- ============================================
  INSERT INTO public.quiz_results (quiz_id, result_type, title, description, characteristic, recommendation, image_url) VALUES
  (
    mood_quiz_id,
    'dreamy-wave',
    'Dreamy Wave',
    'Color Mood: Púrpura lila Hex: #C7B6FF Un color que se extiende con ensueño, intuición y delicadeza. Las emociones profundas y la imaginación se extienden suavemente.',
    'Las emociones no son pistas, sino caminos. Eres alguien que camina por esos caminos.',
    'Eres una persona con tendencias oníricas e intuitivas. Tienes emociones profundas y una rica imaginación, con la capacidad de sentir momentos pequeños de la vida cotidiana de manera especial.',
    NULL
  ),
  (
    mood_quiz_id,
    'shooting-star',
    'Shooting Star',
    'Color Mood: Amarillo brillante Hex: #FFE96D Un color que estalla con emoción espontánea, brillo y romanticismo. Una persona cuya existencia misma es como un evento.',
    'Cuando apareces, la escena cambia.',
    'Eres una persona espontánea y llena de energía. Dondequiera que vayas, iluminas el ambiente y eres una aventurera que disfruta nuevas experiencias.',
    NULL
  ),
  (
    mood_quiz_id,
    'quiet-lake',
    'Quiet Lake',
    'Color Mood: Menta lago Hex: #B8F3DE Energía tranquila y serena. Una persona donde el espacio habla más que las palabras.',
    'La calma no es vacío, sino un estado de plenitud.',
    'Eres una persona con energía serena y tranquila. Valoras los momentos silenciosos y buscas la paz interior.',
    NULL
  ),
  (
    mood_quiz_id,
    'crystal-clear',
    'Crystal Clear',
    'Color Mood: Azul blanco polar Hex: #D7E9FF Organización, claridad, transparencia. El mood se completa cuando no hay desorden.',
    'Lo que más odio no son los errores, sino comenzar sin un plan.',
    'Eres una persona con pensamiento sistemático y claro. Te gusta hacer planes y ejecutarlos, y das lo mejor de ti en un entorno organizado.',
    NULL
  ),
  (
    mood_quiz_id,
    'neon-pulse',
    'Neon Pulse',
    'Color Mood: Rosa rojo neón Hex: #FF4D7E Impulso intenso, influencia, velocidad. Cuando aparece un objetivo, brillas.',
    'Una persona que no comienza con "¿debería?" sino con "lo haré".',
    'Eres una persona con un impulso intenso y una tendencia orientada a objetivos. Tienes una excelente capacidad de ejecución que te permite actuar inmediatamente después de tomar una decisión.',
    NULL
  ),
  (
    mood_quiz_id,
    'cosmic-logic',
    'Cosmic Logic',
    'Color Mood: Azul marino galaxia profunda Hex: #263D8C El universo de la lógica y la reflexión. La estructura se ve antes que las emociones.',
    'Las emociones no se retrasan, se procesan.',
    'Eres una persona con pensamiento lógico y analítico. Juzgas más con la razón que con las emociones y prefieres un enfoque sistemático.',
    NULL
  ),
  (
    mood_quiz_id,
    'warm-nest',
    'Warm Nest',
    'Color Mood: Rosa salmón suave Hex: #FFB8A0 Calidez, cuidado, centrado en relaciones. Un color donde permanece la temperatura corporal humana.',
    'Cuando estás presente, el espacio se vuelve cómodo.',
    'Eres una persona cálida y considerada. Valoras las relaciones con las personas y brindas comodidad y estabilidad a quienes te rodean.',
    NULL
  ),
  (
    mood_quiz_id,
    'horizon-runner',
    'Horizon Runner',
    'Color Mood: Azul cielo vívido Hex: #6BCBFF Desafío, velocidad, expansión. Una persona que parece perder si se detiene.',
    'Cuanto más amplia es la visión, más rápido se vuelve el corazón.',
    'Eres una persona con tendencias desafiantes y dinámicas. Buscas nuevas oportunidades y persigues el crecimiento y la expansión continuos.',
    NULL
  )
  ON CONFLICT (quiz_id, result_type) DO UPDATE SET
    title = EXCLUDED.title,
    description = EXCLUDED.description,
    characteristic = EXCLUDED.characteristic,
    recommendation = EXCLUDED.recommendation,
    image_url = EXCLUDED.image_url;

  RAISE NOTICE '¡Datos del test Mood agregados exitosamente! Quiz ID: %', mood_quiz_id;
END $$;
