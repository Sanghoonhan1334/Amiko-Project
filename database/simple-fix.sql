-- 간단한 수정: 아이돌 포지션 테스트에 기본 질문과 결과 추가

-- 1. 기본 질문 하나 추가
INSERT INTO quiz_questions (id, quiz_id, question_text, order, created_at)
VALUES ('idol-q1', 'dea20361-fd46-409d-880f-f91869c1d184', '¿Qué tipo de música prefieres?', 1, NOW());

-- 2. 질문 옵션 추가
INSERT INTO quiz_question_options (question_id, option_text, score_value, order)
VALUES 
  ('idol-q1', 'Pop suave y melódico', 1, 1),
  ('idol-q1', 'Hip-hop con ritmo fuerte', 3, 2),
  ('idol-q1', 'R&B sensual', 2, 3),
  ('idol-q1', 'Electrónica energética', 4, 4);

-- 3. 기본 결과 하나 추가
INSERT INTO quiz_results (id, quiz_id, result_type, title, description, min_score, max_score, image_url, created_at)
VALUES ('idol-vocal', 'dea20361-fd46-409d-880f-f91869c1d184', 'Vocal', 'Vocalista Principal', 'Tienes una voz única y expresiva. Eres el corazón de la canción y conectas emocionalmente con la audiencia.', 0, 100, '/quizzes/idol-position/vocal.png', NOW());

SELECT 'Simple fix applied successfully' as status;
