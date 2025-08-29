-- 잘못된 상담사 ID를 가진 예약 데이터 정리
-- 1. 잘못된 형식의 상담사 ID를 가진 예약 확인
SELECT 
  id,
  consultant_id,
  status,
  created_at
FROM bookings 
WHERE consultant_id !~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$';

-- 2. 잘못된 상담사 ID를 가진 예약 삭제 (주의: 실제 운영 환경에서는 백업 후 실행)
-- DELETE FROM bookings 
-- WHERE consultant_id !~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$';

-- 3. 또는 잘못된 상담사 ID를 NULL로 설정
-- UPDATE bookings 
-- SET consultant_id = NULL
-- WHERE consultant_id !~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$';

-- 4. 상담사 ID가 NULL인 예약을 기본 상담사로 설정 (선택사항)
-- UPDATE bookings 
-- SET consultant_id = '66836318-efea-4996-bafd-9cc744c3ff0e'
-- WHERE consultant_id IS NULL;
