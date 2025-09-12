-- 사용자 이름 문제 해결을 위한 SQL 스크립트
-- SQL script to fix user name issues

-- 1. 현재 사용자 테이블 상태 확인
-- Check current user table status
SELECT 
    '현재 사용자 테이블 상태' as status,
    COUNT(*) as total_users,
    COUNT(name) as users_with_names,
    COUNT(*) - COUNT(name) as users_without_names
FROM public.users;

-- 2. 이름이 없는 사용자들에게 기본 이름 설정
-- Set default names for users without names
UPDATE public.users 
SET name = COALESCE(name, 'User_' || SUBSTRING(id::text, 1, 8))
WHERE name IS NULL OR name = '';

-- 3. 이메일 기반으로 더 의미있는 이름 설정 (선택사항)
-- Set more meaningful names based on email (optional)
UPDATE public.users 
SET name = COALESCE(
    name, 
    CASE 
        WHEN email IS NOT NULL AND email != '' THEN 
            SPLIT_PART(email, '@', 1)
        ELSE 'User_' || SUBSTRING(id::text, 1, 8)
    END
)
WHERE name IS NULL OR name = '' OR name LIKE 'User_%';

-- 4. 업데이트 후 상태 확인
-- Check status after update
SELECT 
    '업데이트 후 사용자 테이블 상태' as status,
    COUNT(*) as total_users,
    COUNT(name) as users_with_names,
    COUNT(*) - COUNT(name) as users_without_names
FROM public.users;

-- 5. 최근 게시글의 작성자 정보 확인
-- Check author information of recent posts
SELECT 
    p.id as post_id,
    p.title,
    p.created_at,
    u.id as author_id,
    u.name as author_name,
    u.email as author_email
FROM public.posts p
LEFT JOIN public.users u ON p.author_id = u.id
ORDER BY p.created_at DESC
LIMIT 10;

-- 6. 완료 메시지
-- Completion message
SELECT 'User names have been updated successfully' as result;
