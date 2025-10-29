-- users 테이블 구조 확인

-- 1. users 테이블의 컬럼 확인
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'users'
ORDER BY ordinal_position;

-- 2. 실제 데이터 확인 (nickname 있는지)
SELECT 
    id,
    full_name,
    nickname,
    email,
    created_at
FROM public.users
LIMIT 10;

-- 3. nickname이 NULL인 사용자 확인
SELECT 
    COUNT(*) as users_without_nickname,
    COUNT(CASE WHEN nickname IS NOT NULL AND nickname != '' THEN 1 END) as users_with_nickname
FROM public.users;

