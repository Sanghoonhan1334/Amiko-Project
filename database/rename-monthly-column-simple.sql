-- 간단한 컬럼명 변경 스크립트
-- 이 스크립트를 전체 선택해서 Supabase SQL Editor에서 실행하세요

-- 1단계: 현재 컬럼명 확인
SELECT column_name 
FROM information_schema.columns 
WHERE table_name = 'user_points'
AND column_name LIKE '%month%';

-- 2단계: 컬럼명 변경 (monthly_point -> monthly_points)
-- 먼저 위 쿼리로 컬럼명을 확인한 후 아래 쿼리를 실행하세요
ALTER TABLE public.user_points 
RENAME COLUMN monthly_point TO monthly_points;

-- 3단계: 변경 확인
SELECT column_name 
FROM information_schema.columns 
WHERE table_name = 'user_points'
AND column_name LIKE '%month%';

