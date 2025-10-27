-- ==========================================
-- 닉네임 시스템 FK 문제 해결
-- ==========================================

-- 1. user_profiles 테이블의 FK 확인
SELECT
  tc.table_name, 
  kcu.column_name, 
  ccu.table_name AS foreign_table_name,
  ccu.column_name AS foreign_column_name 
FROM information_schema.table_constraints AS tc 
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY' 
  AND tc.table_name = 'user_profiles';

-- 2. public.users 테이블 확인
SELECT COUNT(*) as count FROM public.users;

-- 3. auth.users와 public.users 동기화
INSERT INTO public.users (id, email, nickname, created_at, updated_at)
SELECT 
  au.id,
  au.email,
  COALESCE(
    au.raw_user_meta_data->>'name',
    split_part(au.email, '@', 1)
  ) || '#' || substr(au.id::text, 1, 4) as nickname,
  au.created_at,
  au.updated_at
FROM auth.users au
WHERE NOT EXISTS (
  SELECT 1 FROM public.users pu WHERE pu.id = au.id
)
ON CONFLICT (id) DO NOTHING;

-- 4. 그 다음에 프로필 생성
INSERT INTO public.user_profiles (user_id, display_name)
SELECT 
  u.id,
  COALESCE(
    au.raw_user_meta_data->>'name',
    split_part(au.email, '@', 1) || '#' || substr(u.id::text, 1, 4)
  ) as display_name
FROM public.users u
JOIN auth.users au ON u.id = au.id
WHERE NOT EXISTS (
  SELECT 1 FROM public.user_profiles up WHERE up.user_id = u.id
)
ON CONFLICT (user_id) DO NOTHING;

-- 5. 결과 확인
SELECT 
  COUNT(*) as total_users,
  COUNT(up.id) as users_with_profile,
  COUNT(*) - COUNT(up.id) as users_without_profile
FROM public.users u
LEFT JOIN public.user_profiles up ON u.id = up.user_id;

