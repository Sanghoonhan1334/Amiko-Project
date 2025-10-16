-- 실제 사용자 프로필 이미지 등록
-- 이 스크립트는 Supabase SQL Editor에서 직접 실행해야 합니다.

-- han133334@naver.com 사용자의 실제 프로필 이미지 설정
UPDATE public.users 
SET avatar_url = 'https://your-actual-image-url.com/profile.jpg'  -- 여기에 실제 이미지 URL 입력
WHERE id = '5f83ab21-fd61-4666-94b5-087d73477476';

-- 또는 기본 아바타만 사용하려면 (현재 상태)
-- UPDATE public.users 
-- SET avatar_url = NULL 
-- WHERE id = '5f83ab21-fd61-4666-94b5-087d73477476';

-- 결과 확인
SELECT id, email, full_name, avatar_url 
FROM public.users 
WHERE id = '5f83ab21-fd61-4666-94b5-087d73477476';
