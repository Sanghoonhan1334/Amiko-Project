-- =====================================================
-- SNS 인증 필드 추가
-- Description: 이메일 + SNS 인증 시스템을 위한 필드 추가
-- Date: 2024-12-19
-- =====================================================

-- 1. users 테이블에 SNS 인증 필드 추가
ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS sns_provider TEXT CHECK (sns_provider IN ('kakao', 'google', 'naver', 'apple')),
ADD COLUMN IF NOT EXISTS sns_id TEXT,
ADD COLUMN IF NOT EXISTS sns_email TEXT,
ADD COLUMN IF NOT EXISTS sns_name TEXT,
ADD COLUMN IF NOT EXISTS sns_profile_image TEXT,
ADD COLUMN IF NOT EXISTS sns_verified_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS email_verified_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS phone_verified_at TIMESTAMP WITH TIME ZONE;

-- 2. SNS ID와 이메일 조합으로 UNIQUE 제약조건 추가
-- (같은 SNS 계정으로 여러 이메일 계정 생성 방지)
CREATE UNIQUE INDEX IF NOT EXISTS idx_users_sns_unique 
ON public.users (sns_provider, sns_id) 
WHERE sns_provider IS NOT NULL AND sns_id IS NOT NULL;

-- 3. 이메일 인덱스 추가 (성능 최적화)
CREATE INDEX IF NOT EXISTS idx_users_email_verified ON public.users(email_verified_at);
CREATE INDEX IF NOT EXISTS idx_users_sns_provider ON public.users(sns_provider);
CREATE INDEX IF NOT EXISTS idx_users_sns_id ON public.users(sns_id);

-- 4. SNS 인증 기록 테이블 생성 (선택사항)
CREATE TABLE IF NOT EXISTS public.sns_auth_history (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    sns_provider TEXT NOT NULL,
    sns_id TEXT NOT NULL,
    sns_email TEXT,
    action TEXT NOT NULL CHECK (action IN ('link', 'unlink', 'login')),
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. SNS 인증 기록 인덱스
CREATE INDEX IF NOT EXISTS idx_sns_auth_history_user_id ON public.sns_auth_history(user_id);
CREATE INDEX IF NOT EXISTS idx_sns_auth_history_sns_provider ON public.sns_auth_history(sns_provider);
CREATE INDEX IF NOT EXISTS idx_sns_auth_history_created_at ON public.sns_auth_history(created_at DESC);

-- 6. RLS 정책 추가
ALTER TABLE public.sns_auth_history ENABLE ROW LEVEL SECURITY;

-- 사용자는 자신의 SNS 인증 기록만 볼 수 있음
CREATE POLICY "Users can view own sns auth history" ON public.sns_auth_history
    FOR SELECT USING (auth.uid() = user_id);

-- 관리자는 모든 SNS 인증 기록을 볼 수 있음
CREATE POLICY "Admins can view all sns auth history" ON public.sns_auth_history
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE public.users.id = auth.uid() 
            AND public.users.is_admin = true
        )
    );

-- =====================================================
-- 사용 예시 및 추가 설명
-- =====================================================

/*
새로운 사용자 테이블 구조:

public.users:
- id: UUID (Supabase Auth 연동)
- email: TEXT UNIQUE (이메일)
- password: TEXT (비밀번호, SNS 로그인 시 NULL 가능)
- full_name: TEXT (사용자 이름)
- phone: TEXT UNIQUE (전화번호)
- sns_provider: TEXT (kakao, google, naver, apple)
- sns_id: TEXT (SNS에서 받은 고유 ID)
- sns_email: TEXT (SNS 계정 이메일)
- sns_name: TEXT (SNS 계정 이름)
- sns_profile_image: TEXT (SNS 프로필 이미지)
- sns_verified_at: TIMESTAMP (SNS 인증 시간)
- email_verified_at: TIMESTAMP (이메일 인증 시간)
- phone_verified_at: TIMESTAMP (전화번호 인증 시간)
- created_at: TIMESTAMP
- updated_at: TIMESTAMP

인증 방식:
1. 이메일 + 비밀번호: 전통적인 방식
2. SNS 로그인: sns_provider + sns_id로 인증
3. 이메일 + SNS: 이중 인증 (가장 안전)

중복 방지:
- 이메일 UNIQUE
- 전화번호 UNIQUE  
- (sns_provider, sns_id) UNIQUE
- 이메일 + SNS 조합으로 강력한 중복 방지
*/
