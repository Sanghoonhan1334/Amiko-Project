-- 사용자 이름 문제 디버깅을 위한 SQL
-- SQL for debugging user name issues

-- 1. 현재 사용자 테이블 상태 확인
SELECT 
    '현재 users 테이블 상태' as status,
    COUNT(*) as total_users,
    COUNT(full_name) as users_with_full_name,
    COUNT(*) - COUNT(full_name) as users_without_full_name
FROM public.users;

-- 2. 최근 게시글의 작성자 정보 확인
SELECT 
    p.id as post_id,
    p.title,
    p.created_at,
    u.id as author_id,
    u.full_name as author_full_name,
    u.email as author_email,
    u.created_at as user_created_at
FROM public.posts p
LEFT JOIN public.users u ON p.author_id = u.id
ORDER BY p.created_at DESC
LIMIT 5;

-- 3. 특정 사용자의 프로필 정보 확인 (실제 사용자 ID로 변경 필요)
-- SELECT 
--     u.id,
--     u.full_name,
--     u.email,
--     u.created_at,
--     u.updated_at
-- FROM public.users u
-- WHERE u.email LIKE '%your-email%'  -- 실제 이메일로 변경
-- LIMIT 1;

-- 4. users 테이블 구조 확인
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'users' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- 5. 완료 메시지
SELECT 'User name debugging completed' as result;
