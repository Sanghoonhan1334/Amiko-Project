-- =====================================================
-- user_type 제약 조건 수정
-- Description: user_type의 값을 'worker'에서 'general'로 변경
-- Date: 2025-01-06
-- =====================================================

-- 1. 기존 제약 조건 삭제
ALTER TABLE public.users 
DROP CONSTRAINT IF EXISTS users_user_type_check;

-- 2. 새로운 제약 조건 추가 (student, general)
ALTER TABLE public.users 
ADD CONSTRAINT users_user_type_check 
CHECK (user_type IN ('student', 'general'));

-- 3. 기존 'worker' 값을 'general'로 업데이트 (있다면)
UPDATE public.users 
SET user_type = 'general' 
WHERE user_type = 'worker';

-- 4. 완료 메시지
DO $$
BEGIN
    RAISE NOTICE 'user_type 제약 조건이 성공적으로 업데이트되었습니다.';
    RAISE NOTICE '허용되는 값: student, general';
    RAISE NOTICE '기존 worker 값은 general로 변경되었습니다.';
END $$;

