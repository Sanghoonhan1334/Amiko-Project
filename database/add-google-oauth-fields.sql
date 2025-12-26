-- =====================================================
-- Google OAuth 프로필 완성 필드 추가
-- Description: Google OAuth 사용자를 위한 약관 동의 필드 추가
-- Date: 2025-01-XX
-- =====================================================

-- terms_agreed 필드 추가 (약관 동의 여부)
ALTER TABLE public.users
ADD COLUMN IF NOT EXISTS terms_agreed BOOLEAN DEFAULT false;

-- terms_agreed_at 필드 추가 (약관 동의 일시)
ALTER TABLE public.users
ADD COLUMN IF NOT EXISTS terms_agreed_at TIMESTAMP WITH TIME ZONE;

-- 컬럼 설명 추가
COMMENT ON COLUMN public.users.terms_agreed IS '약관 동의 여부 (Google OAuth 사용자용)';
COMMENT ON COLUMN public.users.terms_agreed_at IS '약관 동의 일시';

