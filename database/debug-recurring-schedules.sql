-- 정기 스케줄 등록 디버깅용 스크립트
-- 정기 스케줄 테이블 구조 및 데이터 확인

-- 1. 테이블이 존재하는지 확인
SELECT 
  table_name,
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'partner_recurring_schedules'
ORDER BY ordinal_position;

-- 2. 테이블에 데이터가 있는지 확인 (전체)
SELECT COUNT(*) as total_count FROM partner_recurring_schedules;
SELECT COUNT(*) as active_count FROM partner_recurring_schedules WHERE is_active = true;
SELECT COUNT(*) as inactive_count FROM partner_recurring_schedules WHERE is_active = false;

-- 3. 모든 정기 스케줄 조회 (상세)
SELECT 
  prs.id,
  prs.partner_id,
  prs.day_of_week,
  prs.start_time,
  prs.end_time,
  prs.is_active,
  prs.created_at,
  u.email as partner_email,
  u.full_name as partner_name,
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
LEFT JOIN users u ON prs.partner_id = u.id
ORDER BY prs.created_at DESC;

-- 4. conversation_partners 테이블 확인
SELECT 
  cp.*,
  u.email,
  u.full_name
FROM conversation_partners cp
LEFT JOIN users u ON cp.user_id = u.id
ORDER BY cp.created_at DESC;
