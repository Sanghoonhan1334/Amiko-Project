-- SNS 관련 필드 제거 스크립트
-- 보안을 위해 SNS 인증 기능을 제거하고 순수 이메일 + 비밀번호 방식만 사용

-- 1. SNS 관련 컬럼 제거
ALTER TABLE public.users DROP COLUMN IF EXISTS sns_provider;
ALTER TABLE public.users DROP COLUMN IF EXISTS sns_id;
ALTER TABLE public.users DROP COLUMN IF EXISTS sns_email;
ALTER TABLE public.users DROP COLUMN IF EXISTS sns_name;
ALTER TABLE public.users DROP COLUMN IF EXISTS sns_profile_image;
ALTER TABLE public.users DROP COLUMN IF EXISTS sns_verified_at;

-- 2. SNS 관련 제약조건 제거
ALTER TABLE public.users DROP CONSTRAINT IF EXISTS unique_sns_account;

-- 3. SNS 관련 인덱스 제거 (있다면)
DROP INDEX IF EXISTS idx_users_sns_provider;
DROP INDEX IF EXISTS idx_users_sns_id;

-- 4. 기존 이메일 + 전화번호 유니크 제약조건 유지
-- (이미 존재하는 제약조건들)
-- ALTER TABLE public.users ADD CONSTRAINT unique_email UNIQUE (email);
-- ALTER TABLE public.users ADD CONSTRAINT unique_phone UNIQUE (phone);

-- 5. 사용자 테이블 구조 확인
SELECT 
  column_name, 
  data_type, 
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'users' 
  AND table_schema = 'public'
ORDER BY ordinal_position;

-- 완료 메시지
SELECT 'SNS 관련 필드가 성공적으로 제거되었습니다.' as message;
