-- monthly_point 컬럼을 monthly_points로 이름 변경
-- (데이터베이스에 monthly_point로 생성된 경우를 위한 수정)

DO $$ 
BEGIN
    -- monthly_point 컬럼이 존재하는 경우 이름 변경
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'user_points' 
        AND column_name = 'monthly_point'
    ) THEN
        ALTER TABLE public.user_points RENAME COLUMN monthly_point TO monthly_points;
        RAISE NOTICE '컬럼명 변경 완료: monthly_point -> monthly_points';
    ELSIF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'user_points' 
        AND column_name = 'monthly_points'
    ) THEN
        -- monthly_points 컬럼이 없는 경우 새로 생성
        ALTER TABLE public.user_points ADD COLUMN monthly_points INTEGER DEFAULT 0;
        RAISE NOTICE '컬럼 생성 완료: monthly_points';
    ELSE
        RAISE NOTICE '컬럼 이미 정상: monthly_points';
    END IF;
END $$;

-- 결과 확인
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'user_points'
AND column_name IN ('monthly_point', 'monthly_points')
ORDER BY column_name;

-- 데이터 확인
-- 주의: 위의 컬럼명 확인 후에 수동으로 아래 중 하나를 실행하세요
-- (컬럼명이 monthly_point인 경우)
-- SELECT COUNT(*) as total_users, SUM(total_points) as total_points_sum, SUM(monthly_point) as monthly_points_sum FROM public.user_points;

-- (컬럼명이 monthly_points인 경우)
-- SELECT COUNT(*) as total_users, SUM(total_points) as total_points_sum, SUM(monthly_points) as monthly_points_sum FROM public.user_points;

