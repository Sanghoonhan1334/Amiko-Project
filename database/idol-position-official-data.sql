-- ============================================
-- 아이돌 포지션 테스트 공식 데이터 (12문항 8포지션)
-- Idol Position Test Official Data (12 Questions, 8 Positions)
-- ============================================

-- 기존 데이터 완전 삭제
DELETE FROM quiz_options WHERE question_id IN (SELECT id FROM quiz_questions WHERE quiz_id = 'dea20361-fd46-409d-880f-f91869c1d184');
DELETE FROM quiz_questions WHERE quiz_id = 'dea20361-fd46-409d-880f-f91869c1d184';
DELETE FROM quiz_results WHERE quiz_id = 'dea20361-fd46-409d-880f-f91869c1d184';

-- 퀴즈 메타데이터 업데이트
UPDATE quizzes 
SET 
  title = '¿Qué posición de idol me quedaría mejor?',
  description = 'Descubre qué posición de idol te queda mejor con 12 preguntas.',
  total_questions = 12,
  updated_at = NOW()
WHERE id = 'dea20361-fd46-409d-880f-f91869c1d184';

-- 질문과 옵션 추가 (DO 블록 사용)
DO $$
DECLARE
  q1_id UUID := gen_random_uuid();
  q2_id UUID := gen_random_uuid();
  q3_id UUID := gen_random_uuid();
  q4_id UUID := gen_random_uuid();
  q5_id UUID := gen_random_uuid();
  q6_id UUID := gen_random_uuid();
  q7_id UUID := gen_random_uuid();
  q8_id UUID := gen_random_uuid();
  q9_id UUID := gen_random_uuid();
  q10_id UUID := gen_random_uuid();
  q11_id UUID := gen_random_uuid();
  q12_id UUID := gen_random_uuid();
BEGIN
  -- 질문 12개 추가
  INSERT INTO quiz_questions (id, quiz_id, question_text, question_order) VALUES
    (q1_id, 'dea20361-fd46-409d-880f-f91869c1d184', '¿Sueles imaginarte debutando como idol o influencer?', 1),
    (q2_id, 'dea20361-fd46-409d-880f-f91869c1d184', 'Cuando el estrés llega al límite, ¿qué haces?', 2),
    (q3_id, 'dea20361-fd46-409d-880f-f91869c1d184', 'El CEO te pregunta si quieres ser ''centro'' en el comeback:', 3),
    (q4_id, 'dea20361-fd46-409d-880f-f91869c1d184', 'Una compañera llora por un horario muy duro. ¿Cómo la consuelas?', 4),
    (q5_id, 'dea20361-fd46-409d-880f-f91869c1d184', 'Hay conflicto dentro del equipo. ¿Cómo lo resuelves?', 5),
    (q6_id, 'dea20361-fd46-409d-880f-f91869c1d184', '¡Sorpresa! Tus miembros te prepararon una fiesta de cumpleaños.', 6),
    (q7_id, 'dea20361-fd46-409d-880f-f91869c1d184', 'Conoces a una fan nerviosa en el fansign. Entonces tú…', 7),
    (q8_id, 'dea20361-fd46-409d-880f-f91869c1d184', 'En práctica, un miembro se culpa por haber sido regañado.', 8),
    (q9_id, 'dea20361-fd46-409d-880f-f91869c1d184', '¡Ganaste el premio a ''Rookie''! Te piden discurso.', 9),
    (q10_id, 'dea20361-fd46-409d-880f-f91869c1d184', 'Te ofrecen ir sola a un programa de variedades.', 10),
    (q11_id, 'dea20361-fd46-409d-880f-f91869c1d184', 'Al armar el tracklist del nuevo álbum, ¿qué propones?', 11),
    (q12_id, 'dea20361-fd46-409d-880f-f91869c1d184', '¡Por fin ganaste el gran premio de música! ¿Qué piensas?', 12);

  -- 질문별 옵션 추가
  -- 질문 1: ¿Sueles imaginarte debutando como idol o influencer?
  INSERT INTO quiz_options (question_id, option_text, result_type, score_value, option_order) VALUES
    (q1_id, 'Sí, a menudo.', 'centro', 2, 1),
    (q1_id, 'Rara vez o nunca.', 'productora', 2, 2);

  -- 질문 2: Cuando el estrés llega al límite, ¿qué haces?
  INSERT INTO quiz_options (question_id, option_text, result_type, score_value, option_order) VALUES
    (q2_id, 'Quedo con amigos para desahogarme.', 'maknae', 2, 1),
    (q2_id, 'Me relajo en casa en silencio.', 'productora', 2, 2);

  -- 질문 3: El CEO te pregunta si quieres ser 'centro' en el comeback:
  INSERT INTO quiz_options (question_id, option_text, result_type, score_value, option_order) VALUES
    (q3_id, '¡Me encanta! Me pone nerviosa, pero me ilusiona.', 'centro', 2, 1),
    (q3_id, '¿Yo? ¿Podré hacerlo…?', 'productora', 1, 2);

  -- 질문 4: Una compañera llora por un horario muy duro. ¿Cómo la consuelas?
  INSERT INTO quiz_options (question_id, option_text, result_type, score_value, option_order) VALUES
    (q4_id, 'Empatizo y la abrazo: ''Debió ser muy duro…''.', 'maknae', 2, 1),
    (q4_id, '''Ánimo, ya termina. Aguantemos un poco más''.', 'productora', 1, 2);

  -- 질문 5: Hay conflicto dentro del equipo. ¿Cómo lo resuelves?
  INSERT INTO quiz_options (question_id, option_text, result_type, score_value, option_order) VALUES
    (q5_id, 'Escucho a ambas partes y analizo objetivamente.', 'lider', 2, 1),
    (q5_id, 'Mediación desde las emociones para que se reconcilien.', 'maknae', 1, 2);

  -- 질문 6: ¡Sorpresa! Tus miembros te prepararon una fiesta de cumpleaños.
  INSERT INTO quiz_options (question_id, option_text, result_type, score_value, option_order) VALUES
    (q6_id, '''¡Gracias! El pastel se ve rico, ¡comamos juntas/os!''', 'productora', 1, 1),
    (q6_id, '''Se me salen las lágrimas… ¡lo recordaré siempre!''', 'maknae', 2, 2);

  -- 질문 7: Conoces a una fan nerviosa en el fansign. Entonces tú…
  INSERT INTO quiz_options (question_id, option_text, result_type, score_value, option_order) VALUES
    (q7_id, 'Rompo el hielo primero para que se relaje.', 'centro', 1, 1),
    (q7_id, '''Está bien, habla despacio. Te espero''.', 'vocalista', 1, 2);

  -- 질문 8: En práctica, un miembro se culpa por haber sido regañado.
  INSERT INTO quiz_options (question_id, option_text, result_type, score_value, option_order) VALUES
    (q8_id, 'Voy y la/lo abrazo para consolarle.', 'maknae', 2, 1),
    (q8_id, '''Todos se equivocan''; le digo cómo mejorar.', 'productora', 1, 2);

  -- 질문 9: ¡Ganaste el premio a 'Rookie'! Te piden discurso.
  INSERT INTO quiz_options (question_id, option_text, result_type, score_value, option_order) VALUES
    (q9_id, '''Gracias. Trabajaré aún más duro''.', 'lider', 1, 1),
    (q9_id, '''Es un sueño… Gracias fans y miembros. ¡Los amo!''', 'maknae', 1, 2);

  -- 질문 10: Te ofrecen ir sola a un programa de variedades.
  INSERT INTO quiz_options (question_id, option_text, result_type, score_value, option_order) VALUES
    (q10_id, '''¡Suena divertido! Me da curiosidad''.', 'centro', 1, 1),
    (q10_id, '''¿Sola…? Me da un poco de presión''.', 'vocalista', 1, 2);

  -- 질문 11: Al armar el tracklist del nuevo álbum, ¿qué propones?
  INSERT INTO quiz_options (question_id, option_text, result_type, score_value, option_order) VALUES
    (q11_id, 'Más canciones populares y pegadizas.', 'centro', 1, 1),
    (q11_id, 'Probar géneros nuevos y diferentes.', 'cantautora', 1, 2);

  -- 질문 12: ¡Por fin ganaste el gran premio de música! ¿Qué piensas?
  INSERT INTO quiz_options (question_id, option_text, result_type, score_value, option_order) VALUES
    (q12_id, '''Quisiera que este momento fuera eterno''.', 'vocalista', 1, 1),
    (q12_id, '''Ojalá tengamos muchos momentos así''.', 'lider', 1, 2);

END $$;

-- 8개 포지션 결과 추가
INSERT INTO quiz_results (quiz_id, result_type, title, description, image_url) VALUES
  ('dea20361-fd46-409d-880f-f91869c1d184', 'vocalista', 'Vocalista principal', 
   'Tienes una voz única y expresiva. Eres el corazón de la canción y conectas emocionalmente con la audiencia.', 
   '/quizzes/idol-roles/vocalista.png'),
   
  ('dea20361-fd46-409d-880f-f91869c1d184', 'bailarina', 'Bailarina principal', 
   'Tu energía y pasión por el baile son incomparables. Eres el centro del escenario con tus movimientos.', 
   '/quizzes/idol-roles/bailarina.png'),
   
  ('dea20361-fd46-409d-880f-f91869c1d184', 'centro', 'Centro', 
   'Tu presencia y carisma son irresistibles. Eres el centro de atención con tu personalidad única.', 
   '/quizzes/idol-roles/centro.png'),
   
  ('dea20361-fd46-409d-880f-f91869c1d184', 'cantautora', 'Cantautora', 
   'Tienes talento para componer y expresar tus emociones a través de la música. Eres una artista completa.', 
   '/quizzes/idol-roles/cantautora.png'),
   
  ('dea20361-fd46-409d-880f-f91869c1d184', 'rapera', 'Rapera principal', 
   'Tienes flow natural y letras poderosas. Tu estilo único y confianza te hacen destacar.', 
   '/quizzes/idol-roles/rapera.png'),
   
  ('dea20361-fd46-409d-880f-f91869c1d184', 'maknae', 'La menor (Maknae)', 
   'Eres la energía y el cariño del grupo. Tu juventud y entusiasmo inspiran a todos.', 
   '/quizzes/idol-roles/maknae.png'),
   
  ('dea20361-fd46-409d-880f-f91869c1d184', 'lider', 'Líder', 
   'Eres el pilar del equipo. Tu capacidad de liderazgo y responsabilidad mantienen al grupo unido.', 
   '/quizzes/idol-roles/lider.png'),
   
  ('dea20361-fd46-409d-880f-f91869c1d184', 'productora', 'Productora', 
   'Tienes visión creativa y habilidades técnicas. Eres la mente detrás de la música del grupo.', 
   '/quizzes/idol-roles/productora.png');

SELECT 'Idol Position Test - Official 12Q 8P structure loaded successfully!' as status;

-- 데이터 확인
SELECT 
  (SELECT COUNT(*) FROM quiz_questions WHERE quiz_id = 'dea20361-fd46-409d-880f-f91869c1d184') as total_questions,
  (SELECT COUNT(*) FROM quiz_options WHERE question_id IN (SELECT id FROM quiz_questions WHERE quiz_id = 'dea20361-fd46-409d-880f-f91869c1d184')) as total_options,
  (SELECT COUNT(*) FROM quiz_results WHERE quiz_id = 'dea20361-fd46-409d-880f-f91869c1d184') as total_results;
