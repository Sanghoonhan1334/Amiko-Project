-- 두 테스트 모두 복원하기
-- MBTI 테스트와 아이돌 포지션 테스트 모두 생성

-- ========================================
-- 1. MBTI 테스트 생성
-- ========================================

INSERT INTO quizzes (id, title, description, category, thumbnail_url, total_questions, total_participants, is_active, created_at, updated_at)
VALUES (
  '268caf0b-0031-4e58-9245-606e3421f1fd',
  'Test de MBTI con Estrellas K-POP',
  'Descubre tu MBTI con 12 preguntas y encuentra qué estrella K-POP coincide contigo',
  'personality',
  '/celebs/bts.webp',
  12,
  1,
  true,
  NOW(),
  NOW()
) ON CONFLICT (id) DO NOTHING;

-- MBTI 테스트 질문들 (12개)
INSERT INTO quiz_questions (id, quiz_id, question_text, "order", created_at)
VALUES 
  ('mbti-q1', '268caf0b-0031-4e58-9245-606e3421f1fd', '¿Prefieres pasar tiempo con muchas personas o con un pequeño grupo de amigos cercanos?', 1, NOW()),
  ('mbti-q2', '268caf0b-0031-4e58-9245-606e3421f1fd', '¿Te consideras más organizado y planificado o espontáneo y flexible?', 2, NOW()),
  ('mbti-q3', '268caf0b-0031-4e58-9245-606e3421f1fd', '¿Tomas decisiones basándote más en la lógica o en los sentimientos?', 3, NOW()),
  ('mbti-q4', '268caf0b-0031-4e58-9245-606e3421f1fd', '¿Prefieres actividades estructuradas o tienes libertad para improvisar?', 4, NOW()),
  ('mbti-q5', '268caf0b-0031-4e58-9245-606e3421f1fd', '¿Te energizas más en eventos sociales o en momentos tranquilos?', 5, NOW()),
  ('mbti-q6', '268caf0b-0031-4e58-9245-606e3421f1fd', '¿Te enfocas más en los detalles o en el panorama general?', 6, NOW()),
  ('mbti-q7', '268caf0b-0031-4e58-9245-606e3421f1fd', '¿Valoras más la justicia objetiva o la armonía interpersonal?', 7, NOW()),
  ('mbti-q8', '268caf0b-0031-4e58-9245-606e3421f1fd', '¿Prefieres tener un horario fijo o ser flexible con tu tiempo?', 8, NOW()),
  ('mbti-q9', '268caf0b-0031-4e58-9245-606e3421f1fd', '¿Trabajas mejor en equipo o prefieres trabajar solo?', 9, NOW()),
  ('mbti-q10', '268caf0b-0031-4e58-9245-606e3421f1fd', '¿Te basas más en hechos concretos o en posibilidades futuras?', 10, NOW()),
  ('mbti-q11', '268caf0b-0031-4e58-9245-606e3421f1fd', '¿Prefieres discutir temas objetivos o conversaciones personales?', 11, NOW()),
  ('mbti-q12', '268caf0b-0031-4e58-9245-606e3421f1fd', '¿Te sientes más cómodo con rutinas establecidas o cambios constantes?', 12, NOW())
ON CONFLICT (id) DO NOTHING;

-- MBTI 테스트 결과들
INSERT INTO quiz_results (id, quiz_id, result_type, title, description, min_score, max_score, image_url, created_at)
VALUES 
  ('mbti-intj', '268caf0b-0031-4e58-9245-606e3421f1fd', 'INTJ', 'El Arquitecto - RM (BTS)', 'Eres estratégico, independiente y tienes una visión clara del futuro. Como RM, eres un líder natural con una mente analítica.', 0, 25, '/celebs/rm.jpg', NOW()),
  ('mbti-enfp', '268caf0b-0031-4e58-9245-606e3421f1fd', 'ENFP', 'El Activista - J-Hope (BTS)', 'Eres entusiasta, creativo y siempre lleno de energía positiva. Como J-Hope, irradias alegría y motivas a otros.', 26, 50, '/celebs/jhope.jpg', NOW()),
  ('mbti-isfp', '268caf0b-0031-4e58-9245-606e3421f1fd', 'ISFP', 'El Aventurero - Jimin (BTS)', 'Eres artístico, sensible y auténtico. Como Jimin, expresas tus emociones a través del arte y conectas con otros.', 51, 75, '/celebs/jimin.jpg', NOW()),
  ('mbti-entp', '268caf0b-0031-4e58-9245-606e3421f1fd', 'ENTP', 'El Innovador - Suga (BTS)', 'Eres ingenioso, independiente y siempre buscando nuevas ideas. Como Suga, eres directo y tienes una perspectiva única.', 76, 100, '/celebs/suga.jpg', NOW())
ON CONFLICT (id) DO NOTHING;

-- MBTI 질문 옵션들 추가
INSERT INTO quiz_question_options (question_id, option_text, score_value, "order")
VALUES 
  ('mbti-q1', 'Con muchas personas', 1, 1),
  ('mbti-q1', 'Con un pequeño grupo de amigos', 2, 2),
  ('mbti-q2', 'Organizado y planificado', 1, 1),
  ('mbti-q2', 'Espontáneo y flexible', 2, 2),
  ('mbti-q3', 'Basándome en la lógica', 1, 1),
  ('mbti-q3', 'Basándome en los sentimientos', 2, 2),
  ('mbti-q4', 'Actividades estructuradas', 1, 1),
  ('mbti-q4', 'Libertad para improvisar', 2, 2),
  ('mbti-q5', 'En eventos sociales', 1, 1),
  ('mbti-q5', 'En momentos tranquilos', 2, 2),
  ('mbti-q6', 'En los detalles', 1, 1),
  ('mbti-q6', 'En el panorama general', 2, 2),
  ('mbti-q7', 'La justicia objetiva', 1, 1),
  ('mbti-q7', 'La armonía interpersonal', 2, 2),
  ('mbti-q8', 'Horario fijo', 1, 1),
  ('mbti-q8', 'Ser flexible con el tiempo', 2, 2),
  ('mbti-q9', 'En equipo', 1, 1),
  ('mbti-q9', 'Trabajar solo', 2, 2),
  ('mbti-q10', 'En hechos concretos', 1, 1),
  ('mbti-q10', 'En posibilidades futuras', 2, 2),
  ('mbti-q11', 'Temas objetivos', 1, 1),
  ('mbti-q11', 'Conversaciones personales', 2, 2),
  ('mbti-q12', 'Rutinas establecidas', 1, 1),
  ('mbti-q12', 'Cambios constantes', 2, 2)
ON CONFLICT (question_id, "order") DO NOTHING;

-- ========================================
-- 2. 아이돌 포지션 테스트에 질문과 결과 추가
-- ========================================

-- 아이돌 포지션 테스트 질문들 (12개)
INSERT INTO quiz_questions (id, quiz_id, question_text, "order", created_at)
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
  ('idol-q12', 'dea20361-fd46-409d-880f-f91869c1d184', '¿Qué te motiva más?', 12, NOW())
ON CONFLICT (id) DO NOTHING;

-- 아이돌 포지션 테스트 결과들
INSERT INTO quiz_results (id, quiz_id, result_type, title, description, min_score, max_score, image_url, created_at)
VALUES 
  ('idol-vocal', 'dea20361-fd46-409d-880f-f91869c1d184', 'Vocal', 'Vocalista Principal', 'Tienes una voz única y expresiva. Eres el corazón de la canción y conectas emocionalmente con la audiencia.', 0, 25, '/quizzes/idol-position/vocal.png', NOW()),
  ('idol-dance', 'dea20361-fd46-409d-880f-f91869c1d184', 'Dance', 'Bailarín Principal', 'Tu energía y pasión por el baile son incomparables. Eres el centro del escenario con tus movimientos.', 26, 50, '/quizzes/idol-position/dance.png', NOW()),
  ('idol-rap', 'dea20361-fd46-409d-880f-f91869c1d184', 'Rap', 'Rapero Principal', 'Tienes flow natural y letras poderosas. Tu estilo único y confianza te hacen destacar.', 51, 75, '/quizzes/idol-position/rap.png', NOW()),
  ('idol-visual', 'dea20361-fd46-409d-880f-f91869c1d184', 'Visual', 'Visual Principal', 'Tu presencia y carisma son irresistibles. Eres el centro de atención con tu personalidad única.', 76, 100, '/quizzes/idol-position/visual.png', NOW())
ON CONFLICT (id) DO NOTHING;

-- 아이돌 포지션 질문 옵션들 추가
INSERT INTO quiz_question_options (question_id, option_text, score_value, "order")
VALUES 
  ('idol-q1', 'Pop suave y melódico', 1, 1),
  ('idol-q1', 'Hip-hop con ritmo fuerte', 3, 2),
  ('idol-q1', 'R&B sensual', 2, 3),
  ('idol-q1', 'Electrónica energética', 4, 4),
  ('idol-q2', 'Canto karaoke toda la noche', 1, 1),
  ('idol-q2', 'Bailo en el centro de la pista', 2, 2),
  ('idol-q2', 'Freestyle con amigos', 3, 3),
  ('idol-q2', 'Soy el centro de atención', 4, 4),
  ('idol-q3', 'Elegante y sofisticado', 1, 1),
  ('idol-q3', 'Cómodo y deportivo', 2, 2),
  ('idol-q3', 'Street style urbano', 3, 3),
  ('idol-q3', 'Fashion statement único', 4, 4),
  ('idol-q4', 'Practicar canto', 1, 1),
  ('idol-q4', 'Tomar clases de baile', 2, 2),
  ('idol-q4', 'Escribir letras', 3, 3),
  ('idol-q4', 'Fotografiarme', 4, 4),
  ('idol-q5', 'Me concentro en mejorar', 1, 1),
  ('idol-q5', 'Demuestro mi valor con acciones', 2, 2),
  ('idol-q5', 'Respondo con inteligencia', 3, 3),
  ('idol-q5', 'Ignoro y sigo adelante', 4, 4),
  ('idol-q6', 'Emocional y sensible', 1, 1),
  ('idol-q6', 'Enérgico y dinámico', 2, 2),
  ('idol-q6', 'Confiable y directo', 3, 3),
  ('idol-q6', 'Carismático y único', 4, 4),
  ('idol-q7', 'Conectar con las emociones de otros', 1, 1),
  ('idol-q7', 'Inspirar con mi energía', 2, 2),
  ('idol-q7', 'Expresar mis pensamientos', 3, 3),
  ('idol-q7', 'Ser recordado como único', 4, 4),
  ('idol-q8', 'Canto para relajarme', 1, 1),
  ('idol-q8', 'Bailo para liberar energía', 2, 2),
  ('idol-q8', 'Escribo para organizar mis pensamientos', 3, 3),
  ('idol-q8', 'Me enfoco en mi imagen', 4, 4),
  ('idol-q9', 'Inspiro con mi ejemplo', 1, 1),
  ('idol-q9', 'Motivo con mi energía', 2, 2),
  ('idol-q9', 'Guío con lógica y razón', 3, 3),
  ('idol-q9', 'Atraigo con mi carisma', 4, 4),
  ('idol-q10', 'Mi voz y expresividad', 1, 1),
  ('idol-q10', 'Mi energía y pasión', 2, 2),
  ('idol-q10', 'Mi inteligencia y creatividad', 3, 3),
  ('idol-q10', 'Mi carisma y presencia', 4, 4),
  ('idol-q11', 'Conecto emocionalmente', 1, 1),
  ('idol-q11', 'Comparto mi energía positiva', 2, 2),
  ('idol-q11', 'Comunico ideas claramente', 3, 3),
  ('idol-q11', 'Atraigo atención naturalmente', 4, 4),
  ('idol-q12', 'Tocar el corazón de la gente', 1, 1),
  ('idol-q12', 'Ver a otros bailar conmigo', 2, 2),
  ('idol-q12', 'Que escuchen mis ideas', 3, 3),
  ('idol-q12', 'Ser admirado y recordado', 4, 4)
ON CONFLICT (question_id, "order") DO NOTHING;

SELECT 'Both tests restored successfully!' as status;
