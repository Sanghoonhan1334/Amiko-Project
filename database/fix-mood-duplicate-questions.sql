-- ============================================
-- Mood Quiz 중복 질문 제거
-- ============================================

DO $$
DECLARE
  mood_quiz_id UUID;
  q_order INT;
  q_id_to_keep UUID;
  q_ids_to_delete UUID[];
BEGIN
  -- Mood quiz ID 가져오기
  SELECT id INTO mood_quiz_id FROM public.quizzes WHERE slug = 'mood' LIMIT 1;
  
  IF mood_quiz_id IS NULL THEN
    RAISE EXCEPTION 'Mood quiz를 찾을 수 없습니다.';
  END IF;

  RAISE NOTICE 'Mood Quiz ID: %', mood_quiz_id;

  -- 각 question_order에 대해 중복 제거
  FOR q_order IN 1..12 LOOP
    -- 해당 question_order의 모든 질문 ID 가져오기
    SELECT ARRAY_AGG(id) INTO q_ids_to_delete
    FROM public.quiz_questions
    WHERE quiz_id = mood_quiz_id AND question_order = q_order;
    
    -- 질문이 있고 2개 이상이면 첫 번째 것만 남기고 나머지 삭제
    IF q_ids_to_delete IS NOT NULL AND array_length(q_ids_to_delete, 1) > 1 THEN
      -- 첫 번째 ID는 유지
      q_id_to_keep := q_ids_to_delete[1];
      
      -- 나머지 ID들의 선택지 먼저 삭제
      DELETE FROM public.quiz_options
      WHERE question_id = ANY(q_ids_to_delete[2:array_length(q_ids_to_delete, 1)]);
      
      -- 나머지 질문 삭제
      DELETE FROM public.quiz_questions
      WHERE id = ANY(q_ids_to_delete[2:array_length(q_ids_to_delete, 1)]);
      
      RAISE NOTICE 'Question order %: %개 중복 제거, ID % 유지', q_order, array_length(q_ids_to_delete, 1) - 1, q_id_to_keep;
    END IF;
  END LOOP;

  RAISE NOTICE '중복 질문 제거 완료!';
END $$;

-- 최종 확인: 질문 개수 확인
SELECT 
    COUNT(*) as question_count,
    COUNT(DISTINCT question_order) as unique_orders
FROM public.quiz_questions
WHERE quiz_id = (SELECT id FROM public.quizzes WHERE slug = 'mood' LIMIT 1);
