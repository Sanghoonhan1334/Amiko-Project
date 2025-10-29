-- 포인트 시스템 최종 확인 쿼리

-- 1. user_points 테이블 구조 확인
SELECT 
    column_name, 
    data_type,
    column_default
FROM information_schema.columns 
WHERE table_name = 'user_points'
ORDER BY ordinal_position;

-- 2. 포인트 랭킹 조회 (총 포인트 기준)
SELECT 
    ROW_NUMBER() OVER (ORDER BY total_points DESC) as rank,
    up.user_id,
    u.full_name,
    u.email,
    up.total_points,
    up.monthly_points,
    up.available_points
FROM public.user_points up
JOIN public.users u ON up.user_id = u.id
ORDER BY up.total_points DESC
LIMIT 10;

-- 3. 월별 포인트 랭킹 조회
SELECT 
    ROW_NUMBER() OVER (ORDER BY monthly_points DESC) as rank,
    up.user_id,
    u.full_name,
    u.email,
    up.monthly_points,
    up.total_points
FROM public.user_points up
JOIN public.users u ON up.user_id = u.id
WHERE up.monthly_points > 0
ORDER BY up.monthly_points DESC
LIMIT 10;

-- 4. 통계 요약
SELECT 
    COUNT(*) as total_users,
    SUM(total_points) as total_points_sum,
    SUM(monthly_points) as monthly_points_sum,
    AVG(total_points) as avg_total_points,
    AVG(monthly_points) as avg_monthly_points
FROM public.user_points;

