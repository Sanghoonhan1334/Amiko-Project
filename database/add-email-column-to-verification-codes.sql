-- =====================================================
-- verification_codes 테이블에 email 컬럼 추가 마이그레이션
-- Description: 이메일 인증 코드 저장을 위한 email 컬럼 추가
-- Date: 2026-01-02
-- =====================================================

-- 1. email 컬럼 추가 (이미 존재하면 스킵)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public'
        AND table_name = 'verification_codes' 
        AND column_name = 'email'
    ) THEN
        ALTER TABLE public.verification_codes 
        ADD COLUMN email TEXT;
        
        RAISE NOTICE 'verification_codes 테이블에 email 컬럼이 추가되었습니다.';
    ELSE
        RAISE NOTICE 'verification_codes 테이블에 email 컬럼이 이미 존재합니다.';
    END IF;
END $$;

-- 2. email 컬럼 인덱스 추가 (성능 최적화)
CREATE INDEX IF NOT EXISTS idx_verification_codes_email 
ON public.verification_codes(email)
WHERE email IS NOT NULL;

-- 3. email과 type 조합 인덱스 추가 (이메일 인증 코드 조회 최적화)
CREATE INDEX IF NOT EXISTS idx_verification_codes_email_type 
ON public.verification_codes(email, type)
WHERE email IS NOT NULL;

-- 4. 제약 조건 추가: email 또는 phone_number 중 하나는 필수
-- (기존 데이터와의 호환성을 위해 제약 조건은 추가하지 않음)
-- 필요시 다음 제약 조건을 활성화할 수 있습니다:
-- ALTER TABLE public.verification_codes 
-- ADD CONSTRAINT check_email_or_phone 
-- CHECK (email IS NOT NULL OR phone_number IS NOT NULL);

-- 5. 코멘트 추가
COMMENT ON COLUMN public.verification_codes.email IS '이메일 주소 (이메일 인증 코드 발송 시 사용)';

