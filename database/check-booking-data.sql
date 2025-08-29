-- 예약 데이터와 상담사 ID 확인
SELECT 
  b.id as booking_id,
  b.consultant_id,
  b.status,
  b.created_at,
  CASE 
    WHEN b.consultant_id ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' 
    THEN 'Valid UUID'
    ELSE 'Invalid ID Format'
  END as id_format_check
FROM bookings b
ORDER BY b.created_at DESC
LIMIT 20;

-- 잘못된 형식의 상담사 ID를 가진 예약 개수
SELECT 
  COUNT(*) as invalid_consultant_ids_count
FROM bookings 
WHERE consultant_id !~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$';

-- 상담사 테이블 상태 확인
SELECT 
  COUNT(*) as total_consultants,
  COUNT(CASE WHEN is_active = true THEN 1 END) as active_consultants
FROM consultants;
