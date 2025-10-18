-- 인증코드 테이블 스키마 업데이트
-- phone_e164 필드와 status 필드 추가

-- 1. phone_e164 필드 추가 (E.164 형식 전화번호)
ALTER TABLE verification_codes 
ADD COLUMN IF NOT EXISTS phone_e164 TEXT;

-- 2. status 필드 추가 (active, used, expired, replaced)
ALTER TABLE verification_codes 
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active';

-- 3. updated_at 필드 추가 (업데이트 시간 추적)
ALTER TABLE verification_codes 
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- 4. 인덱스 추가 (성능 최적화)
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

-- 7. 제약 조건 추가
ALTER TABLE verification_codes 
ADD CONSTRAINT IF NOT EXISTS verification_codes_status_check 
CHECK (status IN ('active', 'used', 'expired', 'replaced'));

-- 8. 결과 확인
SELECT 
  'verification_codes' as table_name,
  COUNT(*) as total_count,
  COUNT(CASE WHEN status = 'active' THEN 1 END) as active_count,
  COUNT(CASE WHEN status = 'used' THEN 1 END) as used_count,
  COUNT(CASE WHEN status = 'expired' THEN 1 END) as expired_count,
  COUNT(CASE WHEN phone_e164 IS NOT NULL THEN 1 END) as has_phone_e164_count
FROM verification_codes;
