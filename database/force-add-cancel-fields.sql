-- 강제로 취소 관련 컬럼 추가 (기존 데이터 처리 포함)
-- 이 스크립트는 Supabase SQL Editor에서 실행해야 합니다.

-- 1. 기존 컬럼이 있다면 삭제 (충돌 방지)
DO $$ 
BEGIN
    -- cancelled_at 컬럼이 있다면 삭제
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'bookings' AND column_name = 'cancelled_at') THEN
        ALTER TABLE bookings DROP COLUMN cancelled_at;
    END IF;
    
    -- cancel_reason 컬럼이 있다면 삭제
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'bookings' AND column_name = 'cancel_reason') THEN
        ALTER TABLE bookings DROP COLUMN cancel_reason;
    END IF;
END $$;

-- 2. 새 컬럼 추가
ALTER TABLE bookings 
ADD COLUMN cancelled_at TIMESTAMP WITH TIME ZONE;

ALTER TABLE bookings 
ADD COLUMN cancel_reason TEXT;

-- 3. 기존 취소된 예약들의 cancelled_at 설정
UPDATE bookings 
SET cancelled_at = updated_at 
WHERE status = 'cancelled' AND cancelled_at IS NULL;

-- 4. 컬럼 설명 추가
COMMENT ON COLUMN bookings.cancelled_at IS '예약 취소 시간';
COMMENT ON COLUMN bookings.cancel_reason IS '예약 취소 사유';

-- 5. 인덱스 추가
CREATE INDEX IF NOT EXISTS idx_bookings_cancelled_at ON bookings(cancelled_at);
CREATE INDEX IF NOT EXISTS idx_bookings_cancel_reason ON bookings(cancel_reason);

-- 6. 테이블 구조 확인
SELECT 
  column_name, 
  data_type, 
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'bookings' 
ORDER BY ordinal_position;

-- 7. RLS 정책 확인 및 업데이트
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE tablename = 'bookings';

-- 8. 테이블 권한 확인
SELECT grantee, privilege_type 
FROM information_schema.role_table_grants 
WHERE table_name = 'bookings';
