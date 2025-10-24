-- MBTI 테스트 복원
-- 퀴즈 생성
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
  '2025-10-01T10:14:11.977697+00:00',
  '2025-10-01T10:14:11.977697+00:00'
);

-- MBTI 테스트 질문들 (12개)
INSERT INTO quiz_questions (id, quiz_id, question_text, order, created_at)
VALUES 
  ('mbti-q1', '268caf0b-0031-4e58-9245-606e3421f1fd', '¿Prefieres pasar tiempo con muchas personas o con un pequeño grupo de amigos cercanos?', 1, NOW()),
  ('mbti-q2', '268caf0b-0031-4e58-9245-606e3421f1fd', '¿Te consideras más organizado y planificado o espontáneo y flexible?', 2, NOW()),
  ('mbti-q3', '268caf0b-0031-4e58-9245-606e3421f1fd', '¿Tomas decisiones basándote más en la lógica o en los sentimientos?', 3, NOW()),
  ('mbti-q4', '268caf0b-0031-4e58-9245-606e3421f1fd', '¿Prefieres actividades estructuradas o tienes libertad para improvisar?', 4, NOW()),
  ('mbti-q5', '268caf0b-0031-4e58-9245-606e3421f1fd', '¿Te energizas más en eventos sociales o en momentos tranquilos?', 5, NOW()),
  ('mbti-q6', '268caf0b-0031-4e58-9245-606e3421f1fd', '¿Te enfocas más en los detalles o en el panorama general?', 6, NOW()),
  ('mbti-q7', '268caf0b-0031-4e58-9245-606e3421f1fd', '¿Valoras más la justicia objetiva o la armonía interpersonal?', 7, NOW()),
  ('mbti-q8', '268caf0b-0031-4e58-9245-606e3421f1fd', '¿Prefieres tener un horario fijo o ser flexible con tu tiempo?', 8, NOW()),
  ('mbti-q9', '268caf0b-0031-4e58-9245-606e3421f1fd', 'GTrabajas mejor en equipo o prefieres trabajar solo?', 9, NOW()),
  ('mbti-q10', '268caf0b-0031-4e58-9245-606e3421f1fd', '¿Te basas más en hechos concretos o en posibilidades futuras?', 10, NOW()),
  ('mbti-q11', '268caf0b-0031-4e58-9245-606e3421f1fd', '¿Prefieres discutir temas objetivos o conversaciones personales?', 11, NOW()),
  ('mbti-q12', '268caf0b-0031-4e58-9245-606e3421f1fd', '¿Te sientes más cómodo con rutinas establecidas o cambios constantes?', 12, NOW());

-- MBTI 테스트 결과들
INSERT INTO quiz_results (id, quiz_id, result_type, title, description, min_score, max_score, image_url, created_at)
VALUES 
  ('mbti-intj', '268caf0b-0031-4e58-9245-606e3421f1fd', 'INTJ', 'El Arquitecto - RM (BTS)', 'Eres estratégico, independiente y tienes una visión clara del futuro. Como RM, eres un líder natural con una mente analítica.', 0, 25, '/celebs/rm.jpg', NOW()),
  ('mbti-enfp', '268caf0b-0031-4e58-9245-606e3421f1fd', 'ENFP', 'El Activista - J-Hope (BTS)', 'Eres entusiasta, creativo y siempre lleno de energía positiva. Como J-Hope, irradias alegría y motivas a otros.', 26, 50, '/celebs/jhope.jpg', NOW()),
  ('mbti-isfp', '268caf0b-0031-4e58-9245-606e3421f1fd', 'ISFP', 'El Aventurero - Jimin (BTS)', 'Eres artístico, sensible y auténtico. Como Jimin, expresas tus emociones a través del arte y conectas con otros.', 51, 75, '/celebs/jimin.jpg', NOW()),
  ('mbti-entp', '268caf0b-0031-4e58-9245-606e3421f1fd', 'ENTP', 'El Innovador - Suga (BTS)', 'Eres ingenioso, independiente y siempre buscando nuevas ideas. Como Suga, eres directo y tienes una perspectiva única.', 76, 100, '/celebs/suga.jpg', NOW());

-- 질문 옵션들 추가
INSERT INTO quiz_question_options (question_id, option_text, score_value, order)
VALUES 
  -- 질문 1
  ('mbti-q1', 'Con muchas personas', 1, 1),
  ('mbti-q1', 'Con un pequeño grupo de amigos', 2, 2),
  -- 질문 2  
  ('mbti-q2', 'Organizado y planificado', 1, 1),
  ('mbti-q2', 'Espontáneo y flexible', 2, 2),
  -- 질문 3
  ('mbti-q3', 'Basándome en la lógica', 1, 1),
  ('mbti-q3', 'Basándome en los sentimientos', 2, 2),
  -- 질문 4
  ('mbti-q4', 'Actividades estructuradas', 1, 1),
  ('mbti-q4', 'Libertad para improvisar', 2, 2),
  -- 질문 5
  ('mbti-q5', 'En eventos sociales', 1, 1),
  ('mbti-q5', 'En momentos tranquilos', 2, 2),
  -- 질문 6
  ('mbti-q6', 'En los detalles', 1, 1),
  ('mbti-q6', 'En el panorama general', 2, 2),
  -- 질문 7
  ('mbti-q7', 'La justicia objetiva', 1, 1),
  ('mbti-q7', 'La armonía interpersonal', 2, 2),
  -- 질문 8
  ('mbti-q8', 'Horario fijo', 1, 1),
  ('mbti-q8', 'Ser flexible con el tiempo', 2, 2),
  -- 질문 9
  ('mbti-q9', 'En equipo', 1, 1),
  ('mbti-q9', 'Trabajar solo', 2, 2),
  -- 질문 10
  ('mbti-q10', 'En hechos concretos', 1, 1),
  ('mbti-q10', 'En posibilidades futuras', 2, 2),
  -- 질문 11
  ('mbti-q11', 'Temas objetivos', 1, 1),
  ('mbti-q11', 'Conversaciones personales', 2, 2),
  -- 질문 12
  ('mbti-q12', 'Rutinas establecidas', 1, 1),
  ('mbti-q12', 'Cambios constantes', 2, 2);

-- 결과 확인
SELECT 'MBTI Test restored successfully' as status;
