-- 기존 한국어 레벨 테스트의 ID 찾기

-- 1. slug로 찾기
SELECT 
    id, 
    title, 
    slug, 
    category,
    total_questions,
    total_participants
FROM quizzes 
WHERE slug = 'korean-level';

-- 2. 만약 위에서 안 나오면 title로 찾기
SELECT 
    id, 
    title, 
    slug, 
    category
FROM quizzes 
WHERE title ILIKE '%nivel%coreano%' 
   OR title ILIKE '%korean%level%';

