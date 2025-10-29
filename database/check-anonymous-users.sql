-- 익명으로 표시되는 사용자 확인

-- 1. user_points와 users 조인해서 full_name 확인
SELECT 
    up.user_id,
    u.full_name,
    u.email,
    up.total_points,
    up.monthly_points
FROM public.user_points up
JOIN public.users u ON up.user_id = u.id
WHERE up.total_points >= 500  -- 상위 2명만 확인
ORDER BY up.total_points DESC;

-- 2. full_name이 NULL이거나 빈 문자열인 사용자 확인
SELECT 
    id,
    full_name,
    email,
    created_at
FROM public.users
WHERE full_name IS NULL OR full_name = '';

