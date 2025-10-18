-- =====================================================
-- users 테이블에 password 필드 추가
-- Description: 비밀번호 재설정 기능을 위한 password 필드 추가
-- Date: 2025-01-18
-- =====================================================

-- 1. users 테이블에 password 필드 추가
ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS password TEXT;

-- 2. password 필드에 대한 인덱스 생성 (선택사항)
-- CREATE INDEX IF NOT EXISTS idx_users_password ON public.users(password);

-- 3. 기존 사용자들의 password 필드를 NULL로 설정 (Supabase Auth 사용)
-- UPDATE public.users SET password = NULL WHERE password IS NOT NULL;

-- =====================================================
-- 추가 설명
-- =====================================================

/*
password 필드 추가 이유:
1. 커스텀 비밀번호 재설정 기능을 위해 필요
2. Supabase Auth의 기본 비밀번호 재설정 대신 커스텀 로직 사용
3. 다국어 이메일 템플릿을 위한 커스텀 토큰 시스템

주의사항:
- 기존 Supabase Auth 사용자들은 password 필드가 NULL
- 새로 가입하는 사용자만 password 필드에 해시된 비밀번호 저장
- 비밀번호 재설정 시에만 이 필드 사용
*/
