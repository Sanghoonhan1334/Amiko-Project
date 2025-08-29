-- 예약 테이블에 취소 관련 컬럼 추가
-- 이 스크립트는 Supabase SQL Editor에서 실행해야 합니다.

-- 1. cancelled_at 컬럼 추가 (취소 시간)
ALTER TABLE bookings 
ADD COLUMN IF NOT EXISTS cancelled_at TIMESTAMP WITH TIME ZONE;

-- 2. cancel_reason 컬럼 추가 (취소 사유)
ALTER TABLE bookings 
ADD COLUMN IF NOT EXISTS cancel_reason TEXT;

-- 3. 기존 취소된 예약들의 cancelled_at 설정
UPDATE bookings 
SET cancelled_at = updated_at 
WHERE status = 'cancelled' AND cancelled_at IS NULL;

-- 4. 컬럼 설명 추가
COMMENT ON COLUMN bookings.cancelled_at IS '예약 취소 시간';
COMMENT ON COLUMN bookings.cancel_reason IS '예약 취소 사유';

-- 5. 인덱스 추가 (성능 향상)
CREATE INDEX IF NOT EXISTS idx_bookings_cancelled_at ON bookings(cancelled_at);
CREATE INDEX IF NOT EXISTS idx_bookings_cancel_reason ON bookings(cancel_reason);

-- 6. 현재 테이블 구조 확인
SELECT 
  column_name, 
  data_type, 
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'bookings' 
ORDER BY ordinal_position;
