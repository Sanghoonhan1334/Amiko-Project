-- 인증코드 테이블 스키마 업데이트
-- phone_e164 필드와 status 필드 추가

-- 1. phone_e164 필드 추가 (E.164 형식 전화번호)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'verification_codes' AND column_name = 'phone_e164'
    ) THEN
        ALTER TABLE verification_codes ADD COLUMN phone_e164 TEXT;
    END IF;
END $$;

-- 2. status 필드 추가 (active, used, expired, replaced)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'verification_codes' AND column_name = 'status'
    ) THEN
        ALTER TABLE verification_codes ADD COLUMN status TEXT DEFAULT 'active';
    END IF;
END $$;

-- 3. updated_at 필드 추가 (업데이트 시간 추적)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'verification_codes' AND column_name = 'updated_at'
    ) THEN
        ALTER TABLE verification_codes ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
    END IF;
END $$;

-- 4. 인덱스 추가 (성능 최적화) - PostgreSQL 호환
CREATE INDEX IF NOT EXISTS idx_verification_codes_phone_e164_type 
ON verification_codes(phone_e164, type);

CREATE INDEX IF NOT EXISTS idx_verification_codes_status 
ON verification_codes(status);

CREATE INDEX IF NOT EXISTS idx_verification_codes_created_at 
ON verification_codes(created_at DESC);

-- 5. 기존 데이터 정리 (phone_e164 채우기)
UPDATE verification_codes 
SET phone_e164 = phone_number 
WHERE phone_e164 IS NULL AND phone_number IS NOT NULL;

-- 6. 기존 데이터 상태 정리
UPDATE verification_codes 
SET status = CASE 
  WHEN verified = true THEN 'used'
  WHEN expires_at < NOW() THEN 'expired'
  ELSE 'active'
END
WHERE status IS NULL;

-- 7. 제약 조건 추가 (IF NOT EXISTS 대신 DO 블록 사용)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'verification_codes_status_check'
    ) THEN
        ALTER TABLE verification_codes 
        ADD CONSTRAINT verification_codes_status_check 
        CHECK (status IN ('active', 'used', 'expired', 'replaced'));
    END IF;
END $$;

-- 8. 결과 확인
SELECT 
  'verification_codes' as table_name,
  COUNT(*) as total_count,
  COUNT(CASE WHEN status = 'active' THEN 1 END) as active_count,
  COUNT(CASE WHEN status = 'used' THEN 1 END) as used_count,
  COUNT(CASE WHEN status = 'expired' THEN 1 END) as expired_count,
  COUNT(CASE WHEN phone_e164 IS NOT NULL THEN 1 END) as has_phone_e164_count
FROM verification_codes;
