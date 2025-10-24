-- 아이돌 포지션 테스트에 질문과 결과 추가

-- 질문들 추가 (12개)
INSERT INTO quiz_questions (id, quiz_id, question_text, order, created_at)
VALUES 
  ('idol-q1', 'dea20361-fd46-409d-880f-f91869c1d184', '¿Qué tipo de música prefieres?', 1, NOW()),
  ('idol-q2', 'dea20361-fd46-409d-880f-f91869c1d184', '¿Cómo te comportas en una fiesta?', 2, NOW()),
  ('idol-q3', 'dea20361-fd46-409d-880f-f91869c1d184', '¿Cuál es tu estilo de vestir preferido?', 3, NOW()),
  ('idol-q4', 'dea20361-fd46-409d-880f-f91869c1d184', '¿Qué actividad prefieres hacer en tu tiempo libre?', 4, NOW()),
  ('idol-q5', 'dea20361-fd46-409d-880f-f91869c1d184', '¿Cómo reaccionas cuando alguien te critica?', 5, NOW()),
  ('idol-q6', 'dea20361-fd46-409d-880f-f91869c1d184', '¿Qué tipo de personalidad tienes?', 6, NOW()),
  ('idol-q7', 'dea20361-fd46-409d-880f-f91869c1d184', '¿Cuál es tu objetivo principal en la vida?', 7, NOW()),
  ('idol-q8', 'dea20361-fd46-409d-880f-f91869c1d184', '¿Cómo manejas el estrés?', 8, NOW()),
  ('idol-q9', 'dea20361-fd46-409d-880f-f91869c1d184', '¿Qué tipo de líder eres?', 9, NOW()),
  ('idol-q10', 'dea20361-fd46-409d-880f-f91869c1d184', '¿Cuál es tu mayor fortaleza?', 10, NOW()),
  ('idol-q11', 'dea20361-fd46-409d-880f-f91869c1d184', '¿Cómo te relacionas con los demás?', 11, NOW()),
  ('idol-q12', 'dea20361-fd46-409d-880f-f91869c1d184', '¿Qué te motiva más?', 12, NOW());

-- 결과들 추가 (4개 포지션)
INSERT INTO quiz_results (id, quiz_id, result_type, title, description, min_score, max_score, image_url, created_at)
VALUES 
  ('idol-vocal', 'dea20361-fd46-409d-880f-f91869c1d184', 'Vocal', 'Vocalista Principal', 'Tienes una voz única y expresiva. Eres el corazón de la canción y conectas emocionalmente con la audiencia.', 0, 25, '/quizzes/idol-position/vocal.png', NOW()),
  ('idol-dance', 'dea20361-fd46-409d-880f-f91869c1d184', 'Dance', 'Bailarín Principal', 'Tu energía y pasión por el baile son incomparables. Eres el centro del escenario con tus movimientos.', 26, 50, '/quizzes/idol-position/dance.png', NOW()),
  ('idol-rap', 'dea20361-fd46-409d-880f-f91869c1d184', 'Rap', 'Rapero Principal', 'Tienes flow natural y letras poderosas. Tu estilo único y confianza te hacen destacar.', 51, 75, '/quizzes/idol-position/rap.png', NOW()),
  ('idol-visual', 'dea20361-fd46-409d-880f-f91869c1d184', 'Visual', 'Visual Principal', 'Tu presencia y carisma son irresistibles. Eres el centro de atención con tu personalidad única.', 76, 100, '/quizzes/idol-position/visual.png', NOW());

-- 질문 옵션들 추가
INSERT INTO quiz_question_options (question_id, option_text, score_value, order)
VALUES 
  -- 질문 1: ¿Qué tipo de música prefieres?
  ('idol-q1', 'Pop suave y melódico', 1, 1),
  ('idol-q1', 'Hip-hop con ritmo fuerte', 3, 2),
  ('idol-q1', 'R&B sensual', 2, 3),
  ('idol-q1', 'Electrónica energética', 4, 4),
  
  -- 질문 2: ¿Cómo te comportas en una fiesta?
  ('idol-q2', 'Canto karaoke toda la noche', 1, 1),
  ('idol-q2', 'Bailo en el centro de la pista', 2, 2),
  ('idol-q2', 'Freestyle con amigos', 3, 3),
  ('idol-q2', 'Soy el centro de atención', 4, 4),
  
  -- 질문 3: ¿Cuál es tu estilo de vestir preferido?
  ('idol-q3', 'Elegante y sofisticado', 1, 1),
  ('idol-q3', 'Cómodo y deportivo', 2, 2),
  ('idol-q3', 'Street style urbano', 3, 3),
  ('idol-q3', 'Fashion statement único', 4, 4),
  
  -- 질문 4: ¿Qué actividad prefieres hacer en tu tiempo libre?
  ('idol-q4', 'Practicar canto', 1, 1),
  ('idol-q4', 'Tomar clases de baile', 2, 2),
  ('idol-q4', 'Escribir letras', 3, 3),
  ('idol-q4', 'Fotografiarme', 4, 4),
  
  -- 질문 5: ¿Cómo reaccionas cuando alguien te critica?
  ('idol-q5', 'Me concentro en mejorar', 1, 1),
  ('idol-q5', 'Demuestro mi valor con acciones', 2, 2),
  ('idol-q5', 'Respondo con inteligencia', 3, 3),
  ('idol-q5', 'Ignoro y sigo adelante', 4, 4),
  
  -- 질문 6: ¿Qué tipo de personalidad tienes?
  ('idol-q6', 'Emocional y sensible', 1, 1),
  ('idol-q6', 'Enérgico y dinámico', 2, 2),
  ('idol-q6', 'Confiable y directo', 3, 3),
  ('idol-q6', 'Carismático y único', 4, 4),
  
  -- 질문 7: ¿Cuál es tu objetivo principal en la vida?
  ('idol-q7', 'Conectar con las emociones de otros', 1, 1),
  ('idol-q7', 'Inspirar con mi energía', 2, 2),
  ('idol-q7', 'Expresar mis pensamientos', 3, 3),
  ('idol-q7', 'Ser recordado como único', 4, 4),
  
  -- 질문 8: ¿Cómo manejas el estrés?
  ('idol-q8', 'Canto para relajarme', 1, 1),
  ('idol-q8', 'Bailo para liberar energía', 2, 2),
  ('idol-q8', 'Escribo para organizar mis pensamientos', 3, 3),
  ('idol-q8', 'Me enfoco en mi imagen', 4, 4),
  
  -- 질문 9: ¿Qué tipo de líder eres?
  ('idol-q9', 'Inspiro con mi ejemplo', 1, 1),
  ('idol-q9', 'Motivo con mi energía', 2, 2),
  ('idol-q9', 'Guío con lógica y razón', 3, 3),
  ('idol-q9', 'Atraigo con mi carisma', 4, 4),
  
  -- 질문 10: ¿Cuál es tu mayor fortaleza?
  ('idol-q10', 'Mi voz y expresividad', 1, 1),
  ('idol-q10', 'Mi energía y pasión', 2, 2),
  ('idol-q10', 'Mi inteligencia y creatividad', 3, 3),
  ('idol-q10', 'Mi carisma y presencia', 4, 4),
  
  -- 질문 11: ¿Cómo te relacionas con los demás?
  ('idol-q11', 'Conecto emocionalmente', 1, 1),
  ('idol-q11', 'Comparto mi energía positiva', 2, 2),
  ('idol-q11', 'Comunico ideas claramente', 3, 3),
  ('idol-q11', 'Atraigo atención naturalmente', 4, 4),
  
  -- 질문 12: ¿Qué te motiva más?
  ('idol-q12', 'Tocar el corazón de la gente', 1, 1),
  ('idol-q12', 'Ver a otros bailar conmigo', 2, 2),
  ('idol-q12', 'Que escuchen mis ideas', 3, 3),
  ('idol-q12', 'Ser admirado y recordado', 4, 4);

SELECT 'Idol Position Test questions and results added successfully' as status;
