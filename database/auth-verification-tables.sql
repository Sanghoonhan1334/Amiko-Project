-- =====================================================
-- 인증 관련 테이블
-- Description: 이메일/SMS 인증, 지문 인증, 검증 코드 관리
-- Date: 2025-01-17
-- =====================================================

-- 1. 인증코드 테이블
CREATE TABLE IF NOT EXISTS public.verification_codes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    email TEXT,
    phone_number TEXT,
    code TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('email', 'sms', 'wa')),
    verified BOOLEAN DEFAULT FALSE,
    verified_at TIMESTAMP WITH TIME ZONE,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. 지문 인증 테이블
CREATE TABLE IF NOT EXISTS public.biometric_credentials (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    credential_id TEXT NOT NULL UNIQUE,
    public_key TEXT NOT NULL,
    counter INTEGER DEFAULT 0,
    device_name TEXT,
    device_type TEXT CHECK (device_type IN ('fingerprint', 'face_id', 'touch_id', 'windows_hello')),
    is_active BOOLEAN DEFAULT TRUE,
    last_used_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. 인증 로그 테이블
CREATE TABLE IF NOT EXISTS public.auth_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    auth_type TEXT NOT NULL CHECK (auth_type IN ('email', 'sms', 'biometric', 'password')),
    action_type TEXT NOT NULL CHECK (action_type IN ('login', 'logout', 'register', 'verify', 'resend', 'failed')),
    success BOOLEAN NOT NULL,
    ip_address INET,
    user_agent TEXT,
    device_info JSONB,
    location_info JSONB,
    error_message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. 사용자 인증 상태 테이블
CREATE TABLE IF NOT EXISTS public.user_auth_status (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    email_verified BOOLEAN DEFAULT FALSE,
    phone_verified BOOLEAN DEFAULT FALSE,
    biometric_enabled BOOLEAN DEFAULT FALSE,
    two_factor_enabled BOOLEAN DEFAULT FALSE,
    last_email_verification TIMESTAMP WITH TIME ZONE,
    last_phone_verification TIMESTAMP WITH TIME ZONE,
    last_biometric_setup TIMESTAMP WITH TIME ZONE,
    verification_attempts INTEGER DEFAULT 0,
    last_verification_attempt TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. 인증 시도 제한 테이블
CREATE TABLE IF NOT EXISTS public.auth_rate_limits (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    identifier TEXT NOT NULL, -- 이메일 또는 전화번호
    auth_type TEXT NOT NULL CHECK (auth_type IN ('email', 'sms')),
    attempt_count INTEGER DEFAULT 1,
    last_attempt TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    blocked_until TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(identifier, auth_type)
);

-- =====================================================
-- 인덱스 생성
-- =====================================================

-- 인증코드 테이블 인덱스
CREATE INDEX IF NOT EXISTS idx_verification_codes_email ON public.verification_codes(email);
CREATE INDEX IF NOT EXISTS idx_verification_codes_phone ON public.verification_codes(phone_number);
CREATE INDEX IF NOT EXISTS idx_verification_codes_type ON public.verification_codes(type);
CREATE INDEX IF NOT EXISTS idx_verification_codes_expires ON public.verification_codes(expires_at);
CREATE INDEX IF NOT EXISTS idx_verification_codes_verified ON public.verification_codes(verified);

-- 지문 인증 테이블 인덱스
CREATE INDEX IF NOT EXISTS idx_biometric_credentials_user_id ON public.biometric_credentials(user_id);
CREATE INDEX IF NOT EXISTS idx_biometric_credentials_active ON public.biometric_credentials(is_active);
CREATE INDEX IF NOT EXISTS idx_biometric_credentials_last_used ON public.biometric_credentials(last_used_at);

-- 인증 로그 테이블 인덱스
CREATE INDEX IF NOT EXISTS idx_auth_logs_user_id ON public.auth_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_auth_logs_auth_type ON public.auth_logs(auth_type);
CREATE INDEX IF NOT EXISTS idx_auth_logs_action_type ON public.auth_logs(action_type);
CREATE INDEX IF NOT EXISTS idx_auth_logs_success ON public.auth_logs(success);
CREATE INDEX IF NOT EXISTS idx_auth_logs_created_at ON public.auth_logs(created_at DESC);

-- 사용자 인증 상태 테이블 인덱스
CREATE INDEX IF NOT EXISTS idx_user_auth_status_user_id ON public.user_auth_status(user_id);
CREATE INDEX IF NOT EXISTS idx_user_auth_status_email_verified ON public.user_auth_status(email_verified);
CREATE INDEX IF NOT EXISTS idx_user_auth_status_phone_verified ON public.user_auth_status(phone_verified);
CREATE INDEX IF NOT EXISTS idx_user_auth_status_biometric_enabled ON public.user_auth_status(biometric_enabled);

-- 인증 시도 제한 테이블 인덱스
CREATE INDEX IF NOT EXISTS idx_auth_rate_limits_identifier ON public.auth_rate_limits(identifier);
CREATE INDEX IF NOT EXISTS idx_auth_rate_limits_auth_type ON public.auth_rate_limits(auth_type);
CREATE INDEX IF NOT EXISTS idx_auth_rate_limits_blocked_until ON public.auth_rate_limits(blocked_until);

-- =====================================================
-- RLS (Row Level Security) 정책
-- =====================================================

-- 인증코드 테이블 RLS
ALTER TABLE public.verification_codes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own verification codes" ON public.verification_codes
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM auth.users 
            WHERE auth.users.email = verification_codes.email
            AND auth.users.id = auth.uid()
        )
    );

-- 지문 인증 테이블 RLS
ALTER TABLE public.biometric_credentials ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own biometric credentials" ON public.biometric_credentials
    FOR ALL USING (auth.uid() = user_id);

-- 인증 로그 테이블 RLS
ALTER TABLE public.auth_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own auth logs" ON public.auth_logs
    FOR SELECT USING (auth.uid() = user_id);

-- 사용자 인증 상태 테이블 RLS
ALTER TABLE public.user_auth_status ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own auth status" ON public.user_auth_status
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own auth status" ON public.user_auth_status
    FOR UPDATE USING (auth.uid() = user_id);

-- 인증 시도 제한 테이블 RLS (관리자만 접근)
ALTER TABLE public.auth_rate_limits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage rate limits" ON public.auth_rate_limits
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE public.users.id = auth.uid() 
            AND public.users.is_admin = true
        )
    );

-- =====================================================
-- 함수 및 트리거
-- =====================================================

-- 인증코드 만료 정리 함수
CREATE OR REPLACE FUNCTION cleanup_expired_verification_codes()
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM public.verification_codes
    WHERE expires_at < NOW() - INTERVAL '1 hour';
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 인증 시도 제한 확인 함수
CREATE OR REPLACE FUNCTION check_auth_rate_limit(p_identifier TEXT, p_auth_type TEXT)
RETURNS BOOLEAN AS $$
DECLARE
    rate_limit_record RECORD;
    max_attempts INTEGER := 5;
    block_duration INTERVAL := '1 hour';
BEGIN
    -- 기존 시도 기록 조회
    SELECT * INTO rate_limit_record
    FROM public.auth_rate_limits
    WHERE identifier = p_identifier AND auth_type = p_auth_type;
    
    -- 기록이 없는 경우 새로 생성
    IF NOT FOUND THEN
        INSERT INTO public.auth_rate_limits (identifier, auth_type, attempt_count)
        VALUES (p_identifier, p_auth_type, 1);
        RETURN TRUE;
    END IF;
    
    -- 차단 시간이 지났는지 확인
    IF rate_limit_record.blocked_until IS NOT NULL AND rate_limit_record.blocked_until > NOW() THEN
        RETURN FALSE;
    END IF;
    
    -- 시도 횟수 증가
    UPDATE public.auth_rate_limits
    SET attempt_count = attempt_count + 1,
        last_attempt = NOW(),
        blocked_until = CASE 
            WHEN attempt_count + 1 >= max_attempts THEN NOW() + block_duration
            ELSE NULL
        END
    WHERE identifier = p_identifier AND auth_type = p_auth_type;
    
    -- 최대 시도 횟수 초과 시 차단
    IF rate_limit_record.attempt_count + 1 >= max_attempts THEN
        RETURN FALSE;
    END IF;
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 인증 성공 시 시도 제한 초기화 함수
CREATE OR REPLACE FUNCTION reset_auth_rate_limit(p_identifier TEXT, p_auth_type TEXT)
RETURNS VOID AS $$
BEGIN
    DELETE FROM public.auth_rate_limits
    WHERE identifier = p_identifier AND auth_type = p_auth_type;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 인증 로그 자동 기록 함수
CREATE OR REPLACE FUNCTION log_auth_attempt(
    p_user_id UUID,
    p_auth_type TEXT,
    p_action_type TEXT,
    p_success BOOLEAN,
    p_ip_address INET,
    p_user_agent TEXT,
    p_error_message TEXT DEFAULT NULL
)
RETURNS VOID AS $$
BEGIN
    INSERT INTO public.auth_logs (
        user_id, auth_type, action_type, success, 
        ip_address, user_agent, error_message
    ) VALUES (
        p_user_id, p_auth_type, p_action_type, p_success,
        p_ip_address, p_user_agent, p_error_message
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 사용자 인증 상태 업데이트 함수
CREATE OR REPLACE FUNCTION update_user_auth_status(
    p_user_id UUID,
    p_email_verified BOOLEAN DEFAULT NULL,
    p_phone_verified BOOLEAN DEFAULT NULL,
    p_biometric_enabled BOOLEAN DEFAULT NULL
)
RETURNS VOID AS $$
BEGIN
    INSERT INTO public.user_auth_status (user_id, email_verified, phone_verified, biometric_enabled)
    VALUES (p_user_id, COALESCE(p_email_verified, FALSE), COALESCE(p_phone_verified, FALSE), COALESCE(p_biometric_enabled, FALSE))
    ON CONFLICT (user_id) DO UPDATE SET
        email_verified = COALESCE(p_email_verified, user_auth_status.email_verified),
        phone_verified = COALESCE(p_phone_verified, user_auth_status.phone_verified),
        biometric_enabled = COALESCE(p_biometric_enabled, user_auth_status.biometric_enabled),
        last_email_verification = CASE WHEN p_email_verified THEN NOW() ELSE user_auth_status.last_email_verification END,
        last_phone_verification = CASE WHEN p_phone_verified THEN NOW() ELSE user_auth_status.last_phone_verification END,
        last_biometric_setup = CASE WHEN p_biometric_enabled THEN NOW() ELSE user_auth_status.last_biometric_setup END,
        updated_at = NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 정기 정리 작업 (cron job으로 실행)
-- =====================================================

-- 만료된 인증코드 정리 (매시간)
-- SELECT cleanup_expired_verification_codes();

-- 오래된 인증 로그 정리 (매일)
-- DELETE FROM public.auth_logs WHERE created_at < NOW() - INTERVAL '90 days';

-- =====================================================
-- 사용 예시 및 추가 설명
-- =====================================================

/*
사용 방법:

1. 이메일 인증코드 발송:
   INSERT INTO public.verification_codes (email, code, type, expires_at)
   VALUES ('user@example.com', '123456', 'email', NOW() + INTERVAL '10 minutes');

2. SMS 인증코드 발송:
   INSERT INTO public.verification_codes (phone_number, code, type, expires_at)
   VALUES ('+82-10-1234-5678', '123456', 'sms', NOW() + INTERVAL '5 minutes');

3. 지문 인증 등록:
   INSERT INTO public.biometric_credentials (user_id, credential_id, public_key, device_type)
   VALUES ('user-uuid', 'credential-id', 'public-key', 'fingerprint');

4. 인증 시도 제한 확인:
   SELECT check_auth_rate_limit('user@example.com', 'email');

5. 인증 성공 시 제한 초기화:
   SELECT reset_auth_rate_limit('user@example.com', 'email');

6. 인증 로그 기록:
   SELECT log_auth_attempt('user-uuid', 'email', 'verify', true, '127.0.0.1', 'Mozilla/5.0...');

7. 사용자 인증 상태 업데이트:
   SELECT update_user_auth_status('user-uuid', true, false, true);

보안 고려사항:
- 모든 테이블에 RLS 정책 적용
- 인증코드는 암호화하여 저장 권장
- IP 주소 및 User-Agent 로깅
- 인증 시도 제한으로 무차별 대입 공격 방지
- 정기적인 만료된 데이터 정리

성능 고려사항:
- 인증코드 테이블에 적절한 인덱스 설정
- 만료된 데이터 정기 정리
- 인증 로그 테이블 파티셔닝 고려
- 캐시를 활용한 인증 상태 관리
*/
