-- 아이돌 포지션 테스트 질문과 결과 추가 (UUID 버전)

-- 기존 데이터 삭제
DELETE FROM quiz_options WHERE question_id IN (SELECT id FROM quiz_questions WHERE quiz_id = 'dea20361-fd46-409d-880f-f91869c1d184');
DELETE FROM quiz_questions WHERE quiz_id = 'dea20361-fd46-409d-880f-f91869c1d184';
DELETE FROM quiz_results WHERE quiz_id = 'dea20361-fd46-409d-880f-f91869c1d184';

-- 질문들을 UUID와 함께 생성
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
    (q1_id, 'dea20361-fd46-409d-880f-f91869c1d184', '¿Qué tipo de música prefieres?', 1),
    (q2_id, 'dea20361-fd46-409d-880f-f91869c1d184', '¿Cómo te comportas en una fiesta?', 2),
    (q3_id, 'dea20361-fd46-409d-880f-f91869c1d184', '¿Cuál es tu estilo de vestir preferido?', 3),
    (q4_id, 'dea20361-fd46-409d-880f-f91869c1d184', '¿Qué actividad prefieres hacer en tu tiempo libre?', 4),
    (q5_id, 'dea20361-fd46-409d-880f-f91869c1d184', '¿Cómo reaccionas cuando alguien te critica?', 5),
    (q6_id, 'dea20361-fd46-409d-880f-f91869c1d184', '¿Qué tipo de personalidad tienes?', 6),
    (q7_id, 'dea20361-fd46-409d-880f-f91869c1d184', '¿Cuál es tu objetivo principal en la vida?', 7),
    (q8_id, 'dea20361-fd46-409d-880f-f91869c1d184', '¿Cómo manejas el estrés?', 8),
    (q9_id, 'dea20361-fd46-409d-880f-f91869c1d184', '¿Qué tipo de líder eres?', 9),
    (q10_id, 'dea20361-fd46-409d-880f-f91869c1d184', '¿Cuál es tu mayor fortaleza?', 10),
    (q11_id, 'dea20361-fd46-409d-880f-f91869c1d184', '¿Cómo te relacionas con los demás?', 11),
    (q12_id, 'dea20361-fd46-409d-880f-f91869c1d184', '¿Qué te motiva más?', 12);

  -- 질문 옵션들 추가
  INSERT INTO quiz_options (question_id, option_text, score_value, option_order) VALUES
    -- 질문 1
    (q1_id, 'Pop suave y melódico', 1, 1),
    (q1_id, 'Hip-hop con ritmo fuerte', 3, 2),
    (q1_id, 'R&B sensual', 2, 3),
    (q1_id, 'Electrónica energética', 4, 4),
    -- 질문 2
    (q2_id, 'Canto karaoke toda la noche', 1, 1),
    (q2_id, 'Bailo en el centro de la pista', 2, 2),
    (q2_id, 'Freestyle con amigos', 3, 3),
    (q2_id, 'Soy el centro de atención', 4, 4),
    -- 질문 3
    (q3_id, 'Elegante y sofisticado', 1, 1),
    (q3_id, 'Cómodo y deportivo', 2, 2),
    (q3_id, 'Street style urbano', 3, 3),
    (q3_id, 'Fashion statement único', 4, 4),
    -- 질문 4
    (q4_id, 'Practicar canto', 1, 1),
    (q4_id, 'Tomar clases de baile', 2, 2),
    (q4_id, 'Escribir letras', 3, 3),
    (q4_id, 'Fotografiarme', 4, 4),
    -- 질문 5
    (q5_id, 'Me concentro en mejorar', 1, 1),
    (q5_id, 'Demuestro mi valor con acciones', 2, 2),
    (q5_id, 'Respondo con inteligencia', 3, 3),
    (q5_id, 'Ignoro y sigo adelante', 4, 4),
    -- 질문 6
    (q6_id, 'Emocional y sensible', 1, 1),
    (q6_id, 'Enérgico y dinámico', 2, 2),
    (q6_id, 'Confiable y directo', 3, 3),
    (q6_id, 'Carismático y único', 4, 4),
    -- 질문 7
    (q7_id, 'Conectar con las emociones de otros', 1, 1),
    (q7_id, 'Inspirar con mi energía', 2, 2),
    (q7_id, 'Expresar mis pensamientos', 3, 3),
    (q7_id, 'Ser recordado como único', 4, 4),
    -- 질문 8
    (q8_id, 'Canto para relajarme', 1, 1),
    (q8_id, 'Bailo para liberar energía', 2, 2),
    (q8_id, 'Escribo para organizar mis pensamientos', 3, 3),
    (q8_id, 'Me enfoco en mi imagen', 4, 4),
    -- 질문 9
    (q9_id, 'Inspiro con mi ejemplo', 1, 1),
    (q9_id, 'Motivo con mi energía', 2, 2),
    (q9_id, 'Guío con lógica y razón', 3, 3),
    (q9_id, 'Atraigo con mi carisma', 4, 4),
    -- 질문 10
    (q10_id, 'Mi voz y expresividad', 1, 1),
    (q10_id, 'Mi energía y pasión', 2, 2),
    (q10_id, 'Mi inteligencia y creatividad', 3, 3),
    (q10_id, 'Mi carisma y presencia', 4, 4),
    -- 질문 11
    (q11_id, 'Conecto emocionalmente', 1, 1),
    (q11_id, 'Comparto mi energía positiva', 2, 2),
    (q11_id, 'Comunico ideas claramente', 3, 3),
    (q11_id, 'Atraigo atención naturalmente', 4, 4),
    -- 질문 12
    (q12_id, 'Tocar el corazón de la gente', 1, 1),
    (q12_id, 'Ver a otros bailar conmigo', 2, 2),
    (q12_id, 'Que escuchen mis ideas', 3, 3),
    (q12_id, 'Ser admirado y recordado', 4, 4);
END $$;

-- 결과들 추가
INSERT INTO quiz_results (quiz_id, result_type, title, description, image_url) VALUES
  ('dea20361-fd46-409d-880f-f91869c1d184', 'Vocal', 'Vocalista Principal', 'Tienes una voz única y expresiva. Eres el corazón de la canción y conectas emocionalmente con la audiencia.', '/quizzes/idol-position/vocal.png'),
  ('dea20361-fd46-409d-880f-f91869c1d184', 'Dance', 'Bailarín Principal', 'Tu energía y pasión por el baile son incomparables. Eres el centro del escenario con tus movimientos.', '/quizzes/idol-position/dance.png'),
  ('dea20361-fd46-409d-880f-f91869c1d184', 'Rap', 'Rapero Principal', 'Tienes flow natural y letras poderosas. Tu estilo único y confianza te hacen destacar.', '/quizzes/idol-position/rap.png'),
  ('dea20361-fd46-409d-880f-f91869c1d184', 'Visual', 'Visual Principal', 'Tu presencia y carisma son irresistibles. Eres el centro de atención con tu personalidad única.', '/quizzes/idol-position/visual.png');

SELECT 'Idol Position Test fixed successfully!' as status;
