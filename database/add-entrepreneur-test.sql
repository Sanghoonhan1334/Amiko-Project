-- ============================================
-- Agregar test Entrepreneur
-- ¿Qué tipo de emprendedor eres?
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
  'entrepreneur',
  '¿Qué tipo de emprendedor eres?',
  'Un test de personalidad que revela tu tipo de emprendedor entre 8 perfiles, basado en tus tendencias. Un test ligero pero con un tono de marca vibrante, con resultados centrados en textos emotivos.',
  'personality',
  '/quizzes/entrepreneur/cover.png',
  8,
  0,
  true
) ON CONFLICT (slug) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  thumbnail_url = EXCLUDED.thumbnail_url,
  total_questions = EXCLUDED.total_questions;

-- Obtener ID del quiz
DO $$
DECLARE
  entrepreneur_quiz_id UUID;
  q_id UUID;
BEGIN
  -- Obtener ID del quiz
  SELECT id INTO entrepreneur_quiz_id FROM public.quizzes WHERE slug = 'entrepreneur';
  
  IF entrepreneur_quiz_id IS NULL THEN
    RAISE EXCEPTION 'No se pudo encontrar el quiz.';
  END IF;

  -- ============================================
  -- Pregunta 1: ¿Cuál de estas vidas prefieres?
  -- A → sonador-impulsivo, B → jefe-del-camino
  -- ============================================
  SELECT id INTO q_id FROM public.quiz_questions WHERE quiz_id = entrepreneur_quiz_id AND question_order = 1 LIMIT 1;
  IF q_id IS NULL THEN
    SELECT id INTO q_id FROM public.quiz_questions WHERE quiz_id = entrepreneur_quiz_id AND question_text LIKE '%vidas prefieres%' LIMIT 1;
  END IF;
  IF q_id IS NULL THEN
    q_id := gen_random_uuid();
    INSERT INTO public.quiz_questions (id, quiz_id, question_text, question_order) VALUES
    (q_id, entrepreneur_quiz_id, '¿Cuál de estas vidas prefieres?', 1);
  ELSE
    UPDATE public.quiz_questions SET question_text = '¿Cuál de estas vidas prefieres?', question_order = 1 WHERE id = q_id;
  END IF;

  DELETE FROM public.quiz_options WHERE question_id = q_id;
  INSERT INTO public.quiz_options (question_id, option_text, result_type, option_order) VALUES
  (q_id, 'Tener mucho dinero y no ser famoso', 'sonador-impulsivo', 1),
  (q_id, 'Tener mucho dinero y ser el centro de atención', 'jefe-del-camino', 2);

  -- ============================================
  -- Pregunta 2: Cuando empiezas algo nuevo, ¿cómo eres?
  -- A → salta-sin-avisar, B → tranquilo-que-nunca-falla
  -- ============================================
  SELECT id INTO q_id FROM public.quiz_questions WHERE quiz_id = entrepreneur_quiz_id AND question_order = 2 LIMIT 1;
  IF q_id IS NULL THEN
    SELECT id INTO q_id FROM public.quiz_questions WHERE quiz_id = entrepreneur_quiz_id AND question_text LIKE '%empiezas algo nuevo%' LIMIT 1;
  END IF;
  IF q_id IS NULL THEN
    q_id := gen_random_uuid();
    INSERT INTO public.quiz_questions (id, quiz_id, question_text, question_order) VALUES
    (q_id, entrepreneur_quiz_id, 'Cuando empiezas algo nuevo, ¿cómo eres?', 2);
  ELSE
    UPDATE public.quiz_questions SET question_text = 'Cuando empiezas algo nuevo, ¿cómo eres?', question_order = 2 WHERE id = q_id;
  END IF;

  DELETE FROM public.quiz_options WHERE question_id = q_id;
  INSERT INTO public.quiz_options (question_id, option_text, result_type, option_order) VALUES
  (q_id, 'Aprendo haciendo, sin pensarlo tanto', 'salta-sin-avisar', 1),
  (q_id, 'Planifico y avanzo paso a paso', 'tranquilo-que-nunca-falla', 2);

  -- ============================================
  -- Pregunta 3: ¿Qué camino te atrae más?
  -- A → rompecodigos, B → cerebro-oculto
  -- ============================================
  SELECT id INTO q_id FROM public.quiz_questions WHERE quiz_id = entrepreneur_quiz_id AND question_order = 3 LIMIT 1;
  IF q_id IS NULL THEN
    SELECT id INTO q_id FROM public.quiz_questions WHERE quiz_id = entrepreneur_quiz_id AND question_text LIKE '%camino te atrae%' LIMIT 1;
  END IF;
  IF q_id IS NULL THEN
    q_id := gen_random_uuid();
    INSERT INTO public.quiz_questions (id, quiz_id, question_text, question_order) VALUES
    (q_id, entrepreneur_quiz_id, '¿Qué camino te atrae más?', 3);
  ELSE
    UPDATE public.quiz_questions SET question_text = '¿Qué camino te atrae más?', question_order = 3 WHERE id = q_id;
  END IF;

  DELETE FROM public.quiz_options WHERE question_id = q_id;
  INSERT INTO public.quiz_options (question_id, option_text, result_type, option_order) VALUES
  (q_id, 'Un camino que nadie ha recorrido', 'rompecodigos', 1),
  (q_id, 'Un camino ya probado y seguro', 'cerebro-oculto', 2);

  -- ============================================
  -- Pregunta 4: Cuando se te ocurre una idea de negocio…
  -- A → coleccionista-de-contactos, B → artista-del-negocio
  -- ============================================
  SELECT id INTO q_id FROM public.quiz_questions WHERE quiz_id = entrepreneur_quiz_id AND question_order = 4 LIMIT 1;
  IF q_id IS NULL THEN
    SELECT id INTO q_id FROM public.quiz_questions WHERE quiz_id = entrepreneur_quiz_id AND question_text LIKE '%idea de negocio%' LIMIT 1;
  END IF;
  IF q_id IS NULL THEN
    q_id := gen_random_uuid();
    INSERT INTO public.quiz_questions (id, quiz_id, question_text, question_order) VALUES
    (q_id, entrepreneur_quiz_id, 'Cuando se te ocurre una idea de negocio…', 4);
  ELSE
    UPDATE public.quiz_questions SET question_text = 'Cuando se te ocurre una idea de negocio…', question_order = 4 WHERE id = q_id;
  END IF;

  DELETE FROM public.quiz_options WHERE question_id = q_id;
  INSERT INTO public.quiz_options (question_id, option_text, result_type, option_order) VALUES
  (q_id, 'La hablo con gente para probarla', 'coleccionista-de-contactos', 1),
  (q_id, 'La pienso en silencio y la desarrollo más', 'artista-del-negocio', 2);

  -- ============================================
  -- Pregunta 5: Yo soy más…
  -- A → tranquilo-que-nunca-falla, B → sonador-impulsivo
  -- ============================================
  SELECT id INTO q_id FROM public.quiz_questions WHERE quiz_id = entrepreneur_quiz_id AND question_order = 5 LIMIT 1;
  IF q_id IS NULL THEN
    SELECT id INTO q_id FROM public.quiz_questions WHERE quiz_id = entrepreneur_quiz_id AND question_text LIKE '%Yo soy más%' LIMIT 1;
  END IF;
  IF q_id IS NULL THEN
    q_id := gen_random_uuid();
    INSERT INTO public.quiz_questions (id, quiz_id, question_text, question_order) VALUES
    (q_id, entrepreneur_quiz_id, 'Yo soy más…', 5);
  ELSE
    UPDATE public.quiz_questions SET question_text = 'Yo soy más…', question_order = 5 WHERE id = q_id;
  END IF;

  DELETE FROM public.quiz_options WHERE question_id = q_id;
  INSERT INTO public.quiz_options (question_id, option_text, result_type, option_order) VALUES
  (q_id, 'Realista', 'tranquilo-que-nunca-falla', 1),
  (q_id, 'Enfocado/a en posibilidades', 'sonador-impulsivo', 2);

  -- ============================================
  -- Pregunta 6: Cuando trabajas, te importa más…
  -- A → rompecodigos, B → artista-del-negocio
  -- ============================================
  SELECT id INTO q_id FROM public.quiz_questions WHERE quiz_id = entrepreneur_quiz_id AND question_order = 6 LIMIT 1;
  IF q_id IS NULL THEN
    SELECT id INTO q_id FROM public.quiz_questions WHERE quiz_id = entrepreneur_quiz_id AND question_text LIKE '%trabajas, te importa%' LIMIT 1;
  END IF;
  IF q_id IS NULL THEN
    q_id := gen_random_uuid();
    INSERT INTO public.quiz_questions (id, quiz_id, question_text, question_order) VALUES
    (q_id, entrepreneur_quiz_id, 'Cuando trabajas, te importa más…', 6);
  ELSE
    UPDATE public.quiz_questions SET question_text = 'Cuando trabajas, te importa más…', question_order = 6 WHERE id = q_id;
  END IF;

  DELETE FROM public.quiz_options WHERE question_id = q_id;
  INSERT INTO public.quiz_options (question_id, option_text, result_type, option_order) VALUES
  (q_id, 'La estructura general', 'rompecodigos', 1),
  (q_id, 'Los detalles finos', 'artista-del-negocio', 2);

  -- ============================================
  -- Pregunta 7: Antes de empezar un negocio, es más importante…
  -- A → coleccionista-de-contactos, B → jefe-del-camino
  -- ============================================
  SELECT id INTO q_id FROM public.quiz_questions WHERE quiz_id = entrepreneur_quiz_id AND question_order = 7 LIMIT 1;
  IF q_id IS NULL THEN
    SELECT id INTO q_id FROM public.quiz_questions WHERE quiz_id = entrepreneur_quiz_id AND question_text LIKE '%empezar un negocio%' LIMIT 1;
  END IF;
  IF q_id IS NULL THEN
    q_id := gen_random_uuid();
    INSERT INTO public.quiz_questions (id, quiz_id, question_text, question_order) VALUES
    (q_id, entrepreneur_quiz_id, 'Antes de empezar un negocio, es más importante…', 7);
  ELSE
    UPDATE public.quiz_questions SET question_text = 'Antes de empezar un negocio, es más importante…', question_order = 7 WHERE id = q_id;
  END IF;

  DELETE FROM public.quiz_options WHERE question_id = q_id;
  INSERT INTO public.quiz_options (question_id, option_text, result_type, option_order) VALUES
  (q_id, 'Conocer gente y ampliar red', 'coleccionista-de-contactos', 1),
  (q_id, 'Enfocarme solo/a y concretar la idea', 'jefe-del-camino', 2);

  -- ============================================
  -- Pregunta 8: Si aparece una buena oportunidad inesperada…
  -- A → cerebro-oculto, B → salta-sin-avisar
  -- ============================================
  SELECT id INTO q_id FROM public.quiz_questions WHERE quiz_id = entrepreneur_quiz_id AND question_order = 8 LIMIT 1;
  IF q_id IS NULL THEN
    SELECT id INTO q_id FROM public.quiz_questions WHERE quiz_id = entrepreneur_quiz_id AND question_text LIKE '%oportunidad inesperada%' LIMIT 1;
  END IF;
  IF q_id IS NULL THEN
    q_id := gen_random_uuid();
    INSERT INTO public.quiz_questions (id, quiz_id, question_text, question_order) VALUES
    (q_id, entrepreneur_quiz_id, 'Si aparece una buena oportunidad inesperada…', 8);
  ELSE
    UPDATE public.quiz_questions SET question_text = 'Si aparece una buena oportunidad inesperada…', question_order = 8 WHERE id = q_id;
  END IF;

  DELETE FROM public.quiz_options WHERE question_id = q_id;
  INSERT INTO public.quiz_options (question_id, option_text, result_type, option_order) VALUES
  (q_id, 'Mantengo el plan original', 'cerebro-oculto', 1),
  (q_id, 'Cambio el plan y lo intento', 'salta-sin-avisar', 2);

  -- ============================================
  -- Resultados (8개)
  -- ============================================
  INSERT INTO public.quiz_results (quiz_id, result_type, title, description, characteristic, recommendation, image_url) VALUES
  (
    entrepreneur_quiz_id,
    'sonador-impulsivo',
    'El Soñador Impulsivo',
    'Tengo una idea… y ahora tengo diez.',
    'Cuando surge una idea, no puedes parar.',
    'Ventaja: Tienes un coraje increíble para empezar cosas nuevas.' || E'\n' || 'Atención: A veces dejas el final para el tú del futuro.',
    NULL
  ),
  (
    entrepreneur_quiz_id,
    'jefe-del-camino',
    'El Jefe del Camino',
    'No sigo el plan. El plan me sigue a mí.',
    'Tu poder de decisión es tu marca.',
    'Ventaja: Todos esperan tu liderazgo.' || E'\n' || 'Atención: Puedes chocar con personas que no van a tu velocidad.',
    NULL
  ),
  (
    entrepreneur_quiz_id,
    'cerebro-oculto',
    'El Cerebro Oculto',
    'Hablo poco, pienso mucho.',
    'Diseñas el mundo con pensamientos, no con palabras.',
    'Ventaja: Tienes una visión que penetra la esencia.' || E'\n' || 'Atención: El mundo no puede ver dentro de tu cabeza.',
    NULL
  ),
  (
    entrepreneur_quiz_id,
    'tranquilo-que-nunca-falla',
    'El Tranquilo que Nunca Falla',
    'Despacio, pero seguro.',
    'Tienes la certeza de que llegarás, aunque vayas lento.',
    'Ventaja: Eres la encarnación de la estabilidad.' || E'\n' || 'Atención: A veces pierdes oportunidades por ser demasiado cauteloso.',
    NULL
  ),
  (
    entrepreneur_quiz_id,
    'coleccionista-de-contactos',
    'El Coleccionista de Contactos',
    'Un amigo hoy, un negocio mañana.',
    'Crees que las personas son oportunidades.',
    'Ventaja: Creas oportunidades donde sea.' || E'\n' || 'Atención: Tu organización de archivos es un alma en fuga.',
    NULL
  ),
  (
    entrepreneur_quiz_id,
    'artista-del-negocio',
    'El Artista del Negocio',
    'Si no tiene estilo, no existe.',
    'Crees que la marca es emoción y el negocio es mood.',
    'Ventaja: Produces marcas que la gente recuerda.' || E'\n' || 'Atención: Cuando hablan de números, de repente te da tos.',
    NULL
  ),
  (
    entrepreneur_quiz_id,
    'rompecodigos',
    'El Rompecódigos',
    'Todo problema tiene una pieza escondida.',
    'Mientras otros se complican, tú ves el patrón.',
    'Ventaja: Resuelves problemas que parecen imposibles.' || E'\n' || 'Atención: Las emociones no se resuelven con fórmulas.',
    NULL
  ),
  (
    entrepreneur_quiz_id,
    'salta-sin-avisar',
    'El que Salta sin Avisar',
    '¿Plan B? Primero dejo que el A explote.',
    'La acción va antes que el pensamiento. El fracaso también se convierte en experiencia.',
    'Ventaja: Poder de ejecución MAX.' || E'\n' || 'Atención: A veces necesitas frenos.',
    NULL
  )
  ON CONFLICT (quiz_id, result_type) DO UPDATE SET
    title = EXCLUDED.title,
    description = EXCLUDED.description,
    characteristic = EXCLUDED.characteristic,
    recommendation = EXCLUDED.recommendation,
    image_url = EXCLUDED.image_url;

  RAISE NOTICE '¡Datos del test Entrepreneur agregados exitosamente! Quiz ID: %', entrepreneur_quiz_id;
END $$;
