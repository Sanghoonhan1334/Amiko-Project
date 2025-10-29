-- 현재 user_points 테이블의 모든 컬럼 확인

-- 1. 전체 컬럼 목록
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'user_points'
ORDER BY ordinal_position;

-- 2. monthly로 시작하는 컬럼만 확인
SELECT 
    column_name, 
    data_type
FROM information_schema.columns 
WHERE table_name = 'user_points'
AND column_name LIKE '%month%';

-- 3. 실제 데이터 확인
SELECT * FROM public.user_points LIMIT 5;

