-- =====================================================
-- 사용자 프로필 정보 업데이트
-- Description: 실제 프로필 이미지와 이름으로 업데이트
-- Date: 2025-10-15
-- =====================================================

-- 1. 기존 사용자 프로필 업데이트
UPDATE public.users 
SET 
    full_name = 'han133334',
    avatar_url = 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face'
WHERE id = '5f83ab21-fd61-4666-94b5-087d73477476';

-- 2. 다른 테스트 사용자들도 추가 (필요시)
INSERT INTO public.users (
    id, 
    email, 
    full_name, 
    avatar_url, 
    language, 
    is_admin
) VALUES 
(
    '11111111-1111-1111-1111-111111111111',
    'user1@example.com',
    '김철수',
    'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face',
    'ko',
    false
),
(
    '22222222-2222-2222-2222-222222222222',
    'user2@example.com',
    '이영희',
    'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=150&h=150&fit=crop&crop=face',
    'ko',
    false
),
(
    '33333333-3333-3333-3333-333333333333',
    'user3@example.com',
    '박민수',
    'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&h=150&fit=crop&crop=face',
    'ko',
    false
)
ON CONFLICT (id) DO UPDATE SET
    full_name = EXCLUDED.full_name,
    avatar_url = EXCLUDED.avatar_url,
    email = EXCLUDED.email,
    language = EXCLUDED.language,
    is_admin = EXCLUDED.is_admin;

-- 3. 기존 스토리들의 user_id를 다양한 사용자로 분산 (테스트용)
UPDATE public.stories 
SET user_id = '11111111-1111-1111-1111-111111111111'
WHERE id = (SELECT id FROM public.stories ORDER BY created_at ASC LIMIT 1 OFFSET 1);

UPDATE public.stories 
SET user_id = '22222222-2222-2222-2222-222222222222'
WHERE id = (SELECT id FROM public.stories ORDER BY created_at ASC LIMIT 1 OFFSET 2);

UPDATE public.stories 
SET user_id = '33333333-3333-3333-3333-333333333333'
WHERE id = (SELECT id FROM public.stories ORDER BY created_at ASC LIMIT 1 OFFSET 3);

-- 4. 결과 확인
SELECT 
    u.id,
    u.email,
    u.full_name,
    u.avatar_url,
    COUNT(s.id) as story_count
FROM public.users u
LEFT JOIN public.stories s ON u.id = s.user_id
GROUP BY u.id, u.email, u.full_name, u.avatar_url
ORDER BY story_count DESC;
