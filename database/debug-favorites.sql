-- user_favorites 테이블 확인 및 디버깅

-- 1. 테이블 구조 확인
SELECT 
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns
WHERE table_name = 'user_favorites'
ORDER BY ordinal_position;

-- 2. 현재 저장된 즐겨찾기 데이터 확인
SELECT 
    id,
    user_id,
    quiz_id,
    created_at
FROM user_favorites
ORDER BY created_at DESC
LIMIT 10;

-- 3. 한국어 레벨 테스트 즐겨찾기 확인
SELECT 
    COUNT(*) as total,
    quiz_id
FROM user_favorites
WHERE quiz_id = 'korean-level-1'
GROUP BY quiz_id;

-- 4. RLS 정책 확인
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual
FROM pg_policies
WHERE tablename = 'user_favorites';

