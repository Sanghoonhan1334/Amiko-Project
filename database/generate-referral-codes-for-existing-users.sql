-- 기존 사용자들에게 추천인 코드 생성
-- Supabase SQL Editor에서 실행하세요

-- 1. 기존 코드가 모두 같은 값이므로 삭제하고 다시 생성
DELETE FROM public.referrals;

-- 2. 각 사용자마다 고유한 추천인 코드 생성
DO $$
DECLARE
    user_record RECORD;
    new_code VARCHAR;
BEGIN
    FOR user_record IN 
        SELECT id FROM public.users
    LOOP
        -- 중복되지 않는 코드 생성
        LOOP
            new_code := generate_referral_code();
            EXIT WHEN NOT EXISTS (
                SELECT 1 FROM public.referrals WHERE referral_code = new_code
            );
        END LOOP;
        
        -- 추천인 코드 생성
        INSERT INTO public.referrals (user_id, referral_code, referred_by)
        VALUES (user_record.id, new_code, NULL);
    END LOOP;
END $$;

-- 2. 결과 확인
SELECT 
    COUNT(*) as total_users,
    COUNT(CASE WHEN r.referral_code IS NOT NULL THEN 1 END) as users_with_code,
    COUNT(CASE WHEN r.referral_code IS NULL THEN 1 END) as users_without_code
FROM public.users u
LEFT JOIN public.referrals r ON u.id = r.user_id;

-- 3. 추천인 코드 샘플 확인
SELECT 
    u.email,
    u.full_name,
    r.referral_code
FROM public.users u
LEFT JOIN public.referrals r ON u.id = r.user_id
LIMIT 10;

-- 완료 메시지
SELECT '기존 사용자들의 추천인 코드 생성 완료!' as message;

