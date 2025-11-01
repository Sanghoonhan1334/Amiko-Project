-- 예약 ID로 직접 조회하여 존재 여부 확인
SELECT 
  id,
  partner_id,
  user_id,
  date,
  start_time,
  end_time,
  topic,
  status,
  meet_url,
  created_at,
  approved_at
FROM booking_requests
WHERE id = '21b58f08-1935-4a24-ac21-bc33d5800976';

-- 파트너 ID로 조회
SELECT 
  id,
  partner_id,
  user_id,
  date,
  start_time,
  end_time,
  topic,
  status,
  meet_url,
  created_at,
  approved_at
FROM booking_requests
WHERE partner_id = '6ea93c19-81ba-4f9f-a848-325c5418cbba'
ORDER BY created_at DESC
LIMIT 10;

