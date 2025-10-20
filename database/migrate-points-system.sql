-- =====================================================
-- 포인트 시스템 마이그레이션 스크립트
-- Description: 기존 포인트 시스템을 통합 시스템으로 마이그레이션
-- Date: 2024-12-19
-- =====================================================

-- 1. 기존 충돌하는 테이블들 정리
DROP TABLE IF EXISTS public.points CASCADE;
DROP TABLE IF EXISTS public.point_history CASCADE;

-- 2. 기존 함수들 정리
DROP FUNCTION IF EXISTS add_points(UUID, TEXT, INTEGER, TEXT, UUID, TEXT) CASCADE;
DROP FUNCTION IF EXISTS check_daily_point_limit(UUID, TEXT) CASCADE;
DROP FUNCTION IF EXISTS add_points_with_limit(UUID, TEXT, INTEGER, TEXT, UUID, TEXT) CASCADE;

-- 3. 통합 포인트 시스템 스키마 적용
\i database/unified-points-system.sql

-- 4. 기존 데이터 마이그레이션 (필요한 경우)
-- 기존 user_profiles 테이블의 포인트 데이터를 새로운 시스템으로 이전
INSERT INTO public.user_points (user_id, available_points, total_points)
SELECT 
    up.user_id,
    COALESCE(up.available_points, 0) as available_points,
    COALESCE(up.total_points, 0) as total_points
FROM public.user_profiles up
WHERE up.user_id NOT IN (SELECT user_id FROM public.user_points)
ON CONFLICT (user_id) DO NOTHING;

-- 5. 포인트 시스템 상태 확인
SELECT 
    '포인트 시스템 마이그레이션 완료' as status,
    COUNT(*) as total_users,
    SUM(available_points) as total_available_points,
    SUM(total_points) as total_accumulated_points
FROM public.user_points;

-- 6. 테이블 구조 확인
SELECT 
    table_name,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name IN ('user_points', 'points_history', 'daily_points_limit')
ORDER BY table_name, ordinal_position;

-- 7. 함수 목록 확인
SELECT 
    routine_name,
    routine_type,
    data_type
FROM information_schema.routines 
WHERE routine_schema = 'public' 
AND routine_name LIKE '%point%'
ORDER BY routine_name;
