-- 목업 프로필 이미지 제거
-- 이 스크립트는 Supabase SQL Editor에서 직접 실행해야 합니다.

-- han133334@naver.com 사용자의 목업 프로필 이미지 제거
UPDATE public.users 
SET avatar_url = NULL 
WHERE id = '5f83ab21-fd61-4666-94b5-087d73477476';

-- 다른 사용자들의 목업 프로필 이미지도 제거 (필요시)
UPDATE public.users 
SET avatar_url = NULL 
WHERE avatar_url LIKE '%unsplash.com%';

-- 결과 확인
SELECT id, email, full_name, avatar_url 
FROM public.users 
WHERE id = '5f83ab21-fd61-4666-94b5-087d73477476';
