-- 특정 파트너의 스케줄 확인 쿼리
-- user_id: 6ea93c19-81ba-4f9f-a848-325c5418cbba (한상훈)

-- 1. 파트너 정보 확인
SELECT 
  cp.*,
  u.email,
  u.full_name,
  u.id as user_id
FROM conversation_partners cp
JOIN users u ON cp.user_id = u.id
WHERE cp.user_id = '6ea93c19-81ba-4f9f-a848-325c5418cbba';

-- 2. 이 파트너의 정기 스케줄 (모두)
SELECT 
  prs.*,
  CASE prs.day_of_week
    WHEN 0 THEN '일요일'
    WHEN 1 THEN '월요일'
    WHEN 2 THEN '화요일'
    WHEN 3 THEN '수요일'
    WHEN 4 THEN '목요일'
    WHEN 5 THEN '금요일'
    WHEN 6 THEN '토요일'
    ELSE '알 수 없음'
  END as day_name
FROM partner_recurring_schedules prs
WHERE prs.partner_id = '6ea93c19-81ba-4f9f-a848-325c5418cbba'
ORDER BY prs.day_of_week, prs.start_time;

-- 3. 이 파트너의 정기 스케줄 (active만)
SELECT 
  prs.*,
  CASE prs.day_of_week
    WHEN 0 THEN '일요일'
    WHEN 1 THEN '월요일'
    WHEN 2 THEN '화요일'
    WHEN 3 THEN '수요일'
    WHEN 4 THEN '목요일'
    WHEN 5 THEN '금요일'
    WHEN 6 THEN '토요일'
    ELSE '알 수 없음'
  END as day_name
FROM partner_recurring_schedules prs
WHERE prs.partner_id = '6ea93c19-81ba-4f9f-a848-325c5418cbba'
  AND prs.is_active = true
ORDER BY prs.day_of_week, prs.start_time;

-- 4. 이 파트너의 가능 시간 (available_schedules)
SELECT 
  asch.*,
  CASE EXTRACT(DOW FROM asch.date::date)
    WHEN 0 THEN '일요일'
    WHEN 1 THEN '월요일'
    WHEN 2 THEN '화요일'
    WHEN 3 THEN '수요일'
    WHEN 4 THEN '목요일'
    WHEN 5 THEN '금요일'
    WHEN 6 THEN '토요일'
  END as day_name
FROM available_schedules asch
WHERE asch.partner_id = '6ea93c19-81ba-4f9f-a848-325c5418cbba'
ORDER BY asch.date, asch.start_time;

-- 5. 이 파트너의 최근 내일/오늘 가능 시간
SELECT 
  asch.*,
  CASE EXTRACT(DOW FROM asch.date::date)
    WHEN 0 THEN '일요일'
    WHEN 1 THEN '월요일'
    WHEN 2 THEN '화요일'
    WHEN 3 THEN '수요일'
    WHEN 4 THEN '목요일'
    WHEN 5 THEN '금요일'
    WHEN 6 THEN '토요일'
  END as day_name
FROM available_schedules asch
WHERE asch.partner_id = '6ea93c19-81ba-4f9f-a848-325c5418cbba'
  AND asch.date >= CURRENT_DATE
  AND asch.date <= CURRENT_DATE + INTERVAL '1 day'
ORDER BY asch.date, asch.start_time;

-- 6. 테이블에 데이터가 있는지 개수 확인
SELECT 
  'partner_recurring_schedules' as table_name,
  COUNT(*) as total_count,
  COUNT(*) FILTER (WHERE is_active = true) as active_count,
  COUNT(*) FILTER (WHERE partner_id = '6ea93c19-81ba-4f9f-a848-325c5418cbba') as this_partner_count
FROM partner_recurring_schedules
UNION ALL
SELECT 
  'available_schedules' as table_name,
  COUNT(*) as total_count,
  COUNT(*) FILTER (WHERE status = 'available') as active_count,
  COUNT(*) FILTER (WHERE partner_id = '6ea93c19-81ba-4f9f-a848-325c5418cbba') as this_partner_count
FROM available_schedules;
