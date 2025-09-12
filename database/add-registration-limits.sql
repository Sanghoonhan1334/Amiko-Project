-- =====================================================
-- 계정 생성 제한을 위한 추가 테이블
-- Description: IP, 디바이스 기반 중복 계정 방지
-- Date: 2024-12-19
-- =====================================================

-- 1. 계정 생성 기록 테이블
CREATE TABLE IF NOT EXISTS public.registration_attempts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    ip_address INET NOT NULL,
    user_agent TEXT,
    email TEXT NOT NULL,
    phone TEXT NOT NULL,
    country TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    success BOOLEAN DEFAULT FALSE
);

-- 2. 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_registration_attempts_ip ON public.registration_attempts(ip_address);
CREATE INDEX IF NOT EXISTS idx_registration_attempts_email ON public.registration_attempts(email);
CREATE INDEX IF NOT EXISTS idx_registration_attempts_phone ON public.registration_attempts(phone);
CREATE INDEX IF NOT EXISTS idx_registration_attempts_created_at ON public.registration_attempts(created_at DESC);

-- 3. RLS 활성화
ALTER TABLE public.registration_attempts ENABLE ROW LEVEL SECURITY;

-- 4. 관리자만 조회 가능한 정책
CREATE POLICY "Admins can view registration attempts" ON public.registration_attempts
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE public.users.id = auth.uid() 
            AND public.users.is_admin = true
        )
    );

-- 5. 함수: IP별 계정 생성 제한 체크
CREATE OR REPLACE FUNCTION check_registration_limit(
    p_ip_address INET,
    p_hours INTEGER DEFAULT 24
) RETURNS BOOLEAN AS $$
DECLARE
    attempt_count INTEGER;
BEGIN
    -- 지정된 시간 내 동일 IP에서 성공한 계정 생성 수 체크
    SELECT COUNT(*) INTO attempt_count
    FROM public.registration_attempts
    WHERE ip_address = p_ip_address
    AND success = TRUE
    AND created_at > NOW() - INTERVAL '1 hour' * p_hours;
    
    -- 24시간 내 3개 이상 계정 생성 시도 시 제한
    RETURN attempt_count < 3;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. 함수: 디바이스 핑거프린트 기반 체크 (선택사항)
CREATE OR REPLACE FUNCTION check_device_registration_limit(
    p_user_agent TEXT,
    p_hours INTEGER DEFAULT 24
) RETURNS BOOLEAN AS $$
DECLARE
    attempt_count INTEGER;
BEGIN
    -- 동일 User-Agent로 생성된 계정 수 체크
    SELECT COUNT(*) INTO attempt_count
    FROM public.registration_attempts
    WHERE user_agent = p_user_agent
    AND success = TRUE
    AND created_at > NOW() - INTERVAL '1 hour' * p_hours;
    
    RETURN attempt_count < 2;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 사용 예시 및 추가 설명
-- =====================================================

/*
사용 방법:

1. 회원가입 API에서 호출:
   SELECT check_registration_limit('192.168.1.1'::INET, 24);

2. 디바이스 기반 체크:
   SELECT check_device_registration_limit('Mozilla/5.0...', 24);

3. 계정 생성 기록 저장:
   INSERT INTO public.registration_attempts 
   (ip_address, user_agent, email, phone, country, success)
   VALUES ('192.168.1.1', 'Mozilla/5.0...', 'user@email.com', '+821012345678', 'KR', true);

제한 정책:
- IP당 24시간 내 최대 3개 계정
- 디바이스당 24시간 내 최대 2개 계정
- 전화번호 UNIQUE 제약조건과 함께 사용

보안 고려사항:
- VPN 사용자 고려 필요
- 공용 IP 환경 (학교, 회사) 고려
- 정상적인 가족 구성원의 계정 생성 고려
- 필요시 관리자 승인 프로세스 추가
*/
