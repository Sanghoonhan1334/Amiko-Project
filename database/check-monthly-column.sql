-- monthly_points 컬럼명 확인 및 조회 쿼리

-- 1. 컬럼명 확인
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'user_points'
AND column_name LIKE '%month%'
ORDER BY column_name;

-- 2. 기존 방식으로 조회 (컬럼명이 monthly_point인 경우)
SELECT 
    up.user_id,
    u.full_name,
    u.email,
    up.total_points,
    up.available_points,
    up.monthly_point  -- 단수형으로 조회
FROM public.user_points up
JOIN public.users u ON up.user_id = u.id
ORDER BY up.total_points DESC
LIMIT 10;

-- 3. 새 방식으로 조회 (컬럼명이 monthly_points인 경우)
SELECT 
    up.user_id,
    u.full_name,
    u.email,
    up.total_points,
    up.available_points,
    up.monthly_points  -- 복수형으로 조회
FROM public.user_points up
JOIN public.users u ON up.user_id = u.id
ORDER BY up.total_points DESC
LIMIT 10;

