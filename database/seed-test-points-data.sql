-- =====================================================
-- 테스트 포인트 데이터 추가
-- Description: 랭킹 기능 테스트를 위한 샘플 데이터
-- Date: 2026-01-XX
-- =====================================================

-- 1. user_points 테이블에 테스트 사용자 포인트 추가
INSERT INTO public.user_points (user_id, available_points, total_points, monthly_points)
SELECT 
    id,
    (random() * 1000)::INTEGER as available_points,
    (random() * 5000)::INTEGER as total_points,
    (random() * 500)::INTEGER as monthly_points
FROM public.users
WHERE id NOT IN (SELECT user_id FROM public.user_points)
ON CONFLICT (user_id) DO UPDATE SET
    available_points = EXCLUDED.available_points,
    total_points = EXCLUDED.total_points,
    monthly_points = EXCLUDED.monthly_points;

-- 2. 기존 데이터 업데이트 (더 높은 점수로)
UPDATE public.user_points
SET 
    total_points = total_points + (random() * 100)::INTEGER,
    monthly_points = monthly_points + (random() * 50)::INTEGER
WHERE total_points < 100;

-- 3. 결과 확인
SELECT 
    COUNT(*) as total_users,
    SUM(total_points) as total_points_sum,
    SUM(monthly_points) as monthly_points_sum,
    AVG(total_points) as avg_total_points,
    AVG(monthly_points) as avg_monthly_points
FROM public.user_points;

-- 4. 상위 10명 확인
SELECT 
    up.user_id,
    u.full_name,
    u.email,
    up.total_points,
    up.monthly_points
FROM public.user_points up
JOIN public.users u ON up.user_id = u.id
ORDER BY up.total_points DESC
LIMIT 10;

