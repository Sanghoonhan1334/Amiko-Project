-- 파트너의 정기 스케줄 및 가능 시간 조회 스크립트
-- 사용법: 파트너의 user_id로 조회

-- 0. 먼저 파트너가 등록되어 있는지 확인
SELECT 
  cp.*,
  u.email,
  u.full_name,
  u.id as user_id
FROM conversation_partners cp
JOIN users u ON cp.user_id = u.id
ORDER BY cp.created_at DESC
LIMIT 10;

-- 1. 정기 스케줄 (partner_recurring_schedules) - 모든 데이터 조회 (is_active 상관없이)
SELECT 
  prs.*,
  u.email,
  u.full_name,
  cp.is_active as partner_active
FROM partner_recurring_schedules prs
LEFT JOIN conversation_partners cp ON prs.partner_id = cp.user_id
LEFT JOIN users u ON prs.partner_id = u.id
ORDER BY prs.created_at DESC
LIMIT 20;

-- 1-1. 정기 스케줄 (active만)
SELECT 
  prs.*,
  u.email,
  u.full_name
FROM partner_recurring_schedules prs
LEFT JOIN conversation_partners cp ON prs.partner_id = cp.user_id
LEFT JOIN users u ON prs.partner_id = u.id
WHERE prs.is_active = true
ORDER BY prs.day_of_week, prs.start_time;

-- 2. 가능 시간 (available_schedules) 조회
-- user_id를 실제 파트너 ID로 변경하세요
SELECT 
  asch.*,
  u.email,
  u.full_name
FROM available_schedules asch
JOIN conversation_partners cp ON asch.partner_id = cp.user_id
JOIN users u ON cp.user_id = u.id
ORDER BY asch.date, asch.start_time;

-- 3. 특정 파트너의 모든 정보 조회
-- 파트너 이메일로 조회하려면 아래 쿼리 사용
/*
SELECT 
  u.id as user_id,
  u.email,
  u.full_name,
  cp.is_active as partner_active,
  (SELECT COUNT(*) FROM partner_recurring_schedules prs WHERE prs.partner_id = u.id AND prs.is_active = true) as recurring_count,
  (SELECT COUNT(*) FROM available_schedules asch WHERE asch.partner_id = u.id) as available_count
FROM users u
JOIN conversation_partners cp ON u.id = cp.user_id
WHERE u.email = 'your-partner-email@example.com';
*/

-- 4. 오늘과 내일 날짜의 가능 시간만 조회
SELECT 
  asch.*,
  u.email,
  u.full_name
FROM available_schedules asch
JOIN conversation_partners cp ON asch.partner_id = cp.user_id
JOIN users u ON cp.user_id = u.id
WHERE asch.date >= CURRENT_DATE
  AND asch.date <= CURRENT_DATE + INTERVAL '1 day'
ORDER BY asch.date, asch.start_time;
