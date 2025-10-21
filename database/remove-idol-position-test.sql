-- 아이돌 포지션 테스트 관련 데이터 완전 제거
-- Remove idol position test data completely

-- 1. 퀴즈 결과 삭제 (quiz_results)
DELETE FROM quiz_results 
WHERE quiz_id = 'a11f4f9d-8819-49d9-bfd0-4d4a97641981';

-- 2. 퀴즈 옵션 삭제 (quiz_options)
DELETE FROM quiz_options 
WHERE question_id IN (
  SELECT id FROM quiz_questions 
  WHERE quiz_id = 'a11f4f9d-8819-49d9-bfd0-4d4a97641981'
);

-- 3. 퀴즈 질문 삭제 (quiz_questions)
DELETE FROM quiz_questions 
WHERE quiz_id = 'a11f4f9d-8819-49d9-bfd0-4d4a97641981';

-- 4. 퀴즈 삭제 (quizzes)
DELETE FROM quizzes 
WHERE id = 'a11f4f9d-8819-49d9-bfd0-4d4a97641981';

-- 5. 사용자 퀴즈 응답 삭제 (user_quiz_responses)
DELETE FROM user_quiz_responses 
WHERE quiz_id = 'a11f4f9d-8819-49d9-bfd0-4d4a97641981';

-- 확인 쿼리
SELECT '아이돌 포지션 테스트 제거 완료' as status;
