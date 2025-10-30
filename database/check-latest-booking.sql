-- 최근 예약 확인 쿼리
-- 페루 시간 10월 29일 23:40 → 한국 시간 10월 30일 13:40

-- 1. 최근 예약 요청 조회 (최신순, 상위 10개)
SELECT 
    br.id,
    br.partner_id,
    br.user_id,
    br.date as kst_date,
    br.start_time as kst_start_time,
    br.end_time as kst_end_time,
    br.duration,
    br.topic,
    br.description,
    br.status,
    br.created_at,
    -- 파트너 정보
    u.full_name as partner_name,
    u.nickname as partner_nickname,
    -- 예약한 사용자 정보
    u2.full_name as user_name,
    u2.nickname as user_nickname,
    u2.email as user_email
FROM booking_requests br
LEFT JOIN users u ON u.id = br.partner_id
LEFT JOIN users u2 ON u2.id = br.user_id
ORDER BY br.created_at DESC
LIMIT 10;

-- 2. 특정 날짜/시간으로 검색 (한국 시간 기준)
-- 페루 10월 29일 23:40 = 한국 10월 30일 13:40
SELECT 
    br.id,
    br.partner_id,
    br.user_id,
    br.date as kst_date,
    br.start_time as kst_start_time,
    br.end_time as kst_end_time,
    br.duration,
    br.topic,
    br.status,
    br.created_at,
    u.full_name as partner_name,
    u2.full_name as user_name
FROM booking_requests br
LEFT JOIN users u ON u.id = br.partner_id
LEFT JOIN users u2 ON u2.id = br.user_id
WHERE br.date = '2025-10-30'
  AND br.start_time = '13:40:00'
ORDER BY br.created_at DESC;

-- 3. 오늘 생성된 모든 예약 요청
SELECT 
    br.id,
    br.partner_id,
    br.user_id,
    br.date as kst_date,
    br.start_time as kst_start_time,
    br.end_time as kst_end_time,
    br.duration,
    br.topic,
    br.status,
    br.created_at,
    u.full_name as partner_name,
    u2.full_name as user_name,
    -- KST 날짜/시간을 페루 시간으로 변환 계산
    -- KST = UTC+9, 페루 = UTC-5 (차이: 14시간)
    -- KST 13:40 = 페루 23:40 (전날)
    -- 계산식: KST 시간 - 14시간 = 페루 시간
    TO_CHAR((br.date::timestamp + br.start_time::time - INTERVAL '14 hours')::date, 'YYYY-MM-DD') as peru_date,
    TO_CHAR((br.date::timestamp + br.start_time::time - INTERVAL '14 hours')::time, 'HH24:MI:SS') as peru_start_time
FROM booking_requests br
LEFT JOIN users u ON u.id = br.partner_id
LEFT JOIN users u2 ON u2.id = br.user_id
WHERE DATE(br.created_at) = CURRENT_DATE
ORDER BY br.created_at DESC;

-- 4. 특정 사용자의 최근 예약 요청
SELECT 
    br.id,
    br.partner_id,
    br.user_id,
    br.date as kst_date,
    br.start_time as kst_start_time,
    br.end_time as kst_end_time,
    br.duration,
    br.topic,
    br.status,
    br.created_at,
    u.full_name as partner_name,
    u2.email as user_email
FROM booking_requests br
LEFT JOIN users u ON u.id = br.partner_id
LEFT JOIN users u2 ON u2.id = br.user_id
WHERE br.user_id = (
    -- 여기에 확인하고 싶은 user_id를 넣으세요
    SELECT id FROM users ORDER BY created_at DESC LIMIT 1
)
ORDER BY br.created_at DESC;

