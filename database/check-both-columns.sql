-- 실제 컬럼명 확인 (두 가지 모두 시도)

-- 1. 단수형으로 조회 시도
SELECT 
    COUNT(*) as total_users,
    SUM(total_points) as total_points_sum,
    SUM(monthly_point) as monthly_point_sum
FROM public.user_points;

-- 2. 복수형으로 조회 시도
SELECT 
    COUNT(*) as total_users,
    SUM(total_points) as total_points_sum,
    SUM(monthly_points) as monthly_points_sum
FROM public.user_points;

