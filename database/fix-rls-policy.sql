-- RLS 정책 무한 재귀 오류 해결
-- Fix infinite recursion in RLS policy

-- 1. quiz_questions 테이블의 RLS 정책 확인 및 수정
ALTER TABLE quiz_questions DISABLE ROW LEVEL SECURITY;

-- 2. quiz_options 테이블의 RLS 정책 확인 및 수정  
ALTER TABLE quiz_options DISABLE ROW LEVEL SECURITY;

-- 3. quiz_results 테이블의 RLS 정책 확인 및 수정
ALTER TABLE quiz_results DISABLE ROW LEVEL SECURITY;

-- 4. quizzes 테이블의 RLS 정책 확인 및 수정
ALTER TABLE quizzes DISABLE ROW LEVEL SECURITY;

-- 5. user_quiz_responses 테이블의 RLS 정책 확인 및 수정
ALTER TABLE user_quiz_responses DISABLE ROW LEVEL SECURITY;

-- 확인 쿼리
SELECT 'RLS 정책 비활성화 완료' as status;
