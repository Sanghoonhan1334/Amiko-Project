-- 특정 사용자가 파트너로 등록되어 있는지 확인
-- 사용 전에 user_id를 실제 값으로 변경하세요

-- 예시: 특정 사용자 ID 확인
SELECT 
    cp.id,
    cp.user_id,
    cp.name,
    cp.status,
    cp.is_active,
    u.email,
    u.nickname,
    u.is_korean
FROM public.conversation_partners cp
LEFT JOIN public.users u ON cp.user_id = u.id
WHERE cp.user_id = '6ea93c19-81ba-4f9f-a848-325c5418cbba';

-- 모든 파트너 목록 확인
SELECT 
    cp.id,
    cp.user_id,
    cp.name,
    cp.status,
    cp.is_active,
    u.email,
    u.nickname
FROM public.conversation_partners cp
LEFT JOIN public.users u ON cp.user_id = u.id
ORDER BY cp.created_at DESC
LIMIT 10;

-- 테이블 구조 확인
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'conversation_partners'
ORDER BY ordinal_position;
