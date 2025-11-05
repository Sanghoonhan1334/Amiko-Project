-- 포인트 시스템 작동 여부 확인
-- 게시글 작성해도 포인트가 안 올라가는 문제 분석

-- ==========================================
-- 1단계: RPC 함수 존재 확인
-- ==========================================

-- add_points_with_limit 함수가 있는지 확인
SELECT 
  proname as function_name,
  proargtypes,
  prosrc as source_code
FROM pg_proc
WHERE proname = 'add_points_with_limit';

-- ==========================================
-- 2단계: 테이블 존재 확인
-- ==========================================

-- points_history 테이블 확인
SELECT EXISTS (
  SELECT FROM information_schema.tables 
  WHERE table_schema = 'public' 
  AND table_name = 'points_history'
) AS points_history_exists;

-- user_points 테이블 확인
SELECT EXISTS (
  SELECT FROM information_schema.tables 
  WHERE table_schema = 'public' 
  AND table_name = 'user_points'
) AS user_points_exists;

-- ==========================================
-- 3단계: 최근 포인트 내역 확인
-- ==========================================

-- 최근 포인트 히스토리 확인 (points_history 테이블)
SELECT 
  ph.id,
  ph.user_id,
  u.nickname,
  u.email,
  ph.points,
  ph.type,
  ph.description,
  ph.created_at
FROM points_history ph
LEFT JOIN users u ON ph.user_id = u.id
ORDER BY ph.created_at DESC
LIMIT 20;

-- user_points 테이블의 최근 업데이트
SELECT 
  up.user_id,
  u.nickname,
  u.email,
  up.total_points,
  up.available_points,
  up.updated_at
FROM user_points up
LEFT JOIN users u ON up.user_id = u.id
ORDER BY up.updated_at DESC
LIMIT 20;

-- ==========================================
-- 4단계: 테스트 사용자의 포인트 확인
-- ==========================================

-- 특정 사용자의 포인트 내역 (페루 계정으로 테스트한 사용자)
-- user_id를 실제 테스트한 사용자 ID로 변경하세요
SELECT 
  u.id,
  u.email,
  u.nickname,
  up.total_points,
  up.available_points,
  (
    SELECT COUNT(*) 
    FROM points_history ph 
    WHERE ph.user_id = u.id 
    AND ph.created_at >= CURRENT_DATE
  ) as today_point_records
FROM users u
LEFT JOIN user_points up ON u.id = up.user_id
WHERE u.is_korean = FALSE  -- 현지인
ORDER BY u.created_at DESC
LIMIT 10;

-- ==========================================
-- 5단계: 최근 게시글 작성 후 포인트 지급 여부 확인
-- ==========================================

-- 최근 게시글과 해당 사용자의 포인트 지급 여부
SELECT 
  gp.id as post_id,
  gp.title,
  gp.user_id,
  u.nickname,
  gp.created_at as post_created_at,
  (
    SELECT COUNT(*) 
    FROM points_history ph 
    WHERE ph.user_id = gp.user_id 
    AND ph.related_id = gp.id
    AND ph.type = 'freeboard_post'
  ) as point_record_exists,
  (
    SELECT ph.points
    FROM points_history ph 
    WHERE ph.user_id = gp.user_id 
    AND ph.related_id = gp.id
    AND ph.type = 'freeboard_post'
    LIMIT 1
  ) as points_given
FROM gallery_posts gp
LEFT JOIN users u ON gp.user_id = u.id
WHERE gp.is_deleted = FALSE
ORDER BY gp.created_at DESC
LIMIT 20;

