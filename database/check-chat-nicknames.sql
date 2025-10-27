-- ==========================================
-- 채팅 닉네임 시스템 확인 및 수정
-- ==========================================

-- 1. 현재 프로필 상태 확인
SELECT 
  u.id as user_id,
  u.email,
  u.raw_user_meta_data->>'name' as name,
  up.display_name,
  up.avatar_url,
  CASE 
    WHEN up.id IS NULL THEN '❌ 프로필 없음'
    WHEN up.display_name IS NULL THEN '⚠️ 닉네임 없음'
    ELSE '✅ 정상'
  END as status
FROM auth.users u
LEFT JOIN public.user_profiles up ON u.id = up.user_id
ORDER BY u.created_at DESC
LIMIT 20;

-- 2. 프로필 없는 사용자 찾기
SELECT 
  u.id,
  u.email,
  u.raw_user_meta_data->>'name' as name
FROM auth.users u
WHERE NOT EXISTS (
  SELECT 1 FROM public.user_profiles up WHERE up.user_id = u.id
)
LIMIT 10;

-- 3. 채팅 메시지와 프로필 연결 확인
SELECT 
  cm.id as message_id,
  cm.user_id,
  up.display_name,
  up.display_name IS NULL as nickname_missing
FROM chat_messages cm
LEFT JOIN user_profiles up ON cm.user_id = up.user_id
ORDER BY cm.created_at DESC
LIMIT 10;

-- 4. 프로필 없는 사용자에게 기본 닉네임 생성
INSERT INTO public.user_profiles (user_id, display_name)
SELECT 
  u.id,
  COALESCE(
    u.raw_user_meta_data->>'name',
    split_part(u.email, '@', 1) || '#' || substr(u.id::text, 1, 4)
  ) as display_name
FROM auth.users u
WHERE NOT EXISTS (
  SELECT 1 FROM public.user_profiles up WHERE up.user_id = u.id
)
ON CONFLICT (user_id) DO NOTHING;

-- 5. 다시 확인
SELECT 
  COUNT(*) as total_users,
  COUNT(up.id) as users_with_profile,
  COUNT(*) - COUNT(up.id) as users_without_profile
FROM auth.users u
LEFT JOIN public.user_profiles up ON u.id = up.user_id;

