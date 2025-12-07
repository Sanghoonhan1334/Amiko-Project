-- 이메일 상태 확인 쿼리
-- 특정 이메일이 데이터베이스에 존재하는지, 삭제되었는지 확인
--
-- ⚠️ 주의: auth.users 테이블은 직접 쿼리할 수 없습니다.
-- API를 사용하거나 Supabase Dashboard에서 확인하세요:
-- POST /api/admin/check-user-email
-- { "email": "your-email@example.com" }
--
-- 사용 예시:
-- 이메일 주소를 아래에 입력하고 실행하세요
-- 예: WHERE email = 'test@example.com'

-- 1. users 테이블에서 이메일 확인 (삭제 여부 포함)
SELECT 
  id,
  email,
  full_name,
  nickname,
  phone,
  phone_country,
  is_korean,
  language,
  created_at,
  updated_at,
  deleted_at,
  CASE 
    WHEN deleted_at IS NULL THEN '활성 계정'
    ELSE '삭제된 계정'
  END AS status
FROM users
WHERE email = 'your-email@example.com'  -- 여기에 확인할 이메일 입력
ORDER BY created_at DESC;

-- 2. auth.users 테이블에서 이메일 확인 (Supabase Auth)
-- 주의: auth.users는 직접 쿼리할 수 없으므로 Supabase Dashboard에서 확인하거나
-- API를 통해 확인해야 합니다.

-- 3. 삭제된 계정이지만 아직 데이터가 남아있는 경우 확인
SELECT 
  id,
  email,
  full_name,
  nickname,
  phone,
  deleted_at,
  created_at,
  updated_at
FROM users
WHERE email = 'your-email@example.com'  -- 여기에 확인할 이메일 입력
  AND deleted_at IS NOT NULL
ORDER BY deleted_at DESC;

-- 4. 특정 이메일의 모든 관련 데이터 확인 (users + verification_codes)
SELECT 
  'users' AS table_name,
  id::text AS record_id,
  email,
  full_name AS name,
  phone,
  deleted_at,
  created_at
FROM users
WHERE email = 'your-email@example.com'  -- 여기에 확인할 이메일 입력

UNION ALL

SELECT 
  'verification_codes' AS table_name,
  id::text AS record_id,
  email,
  NULL AS name,
  phone_number AS phone,
  NULL AS deleted_at,
  created_at
FROM verification_codes
WHERE email = 'your-email@example.com'  -- 여기에 확인할 이메일 입력

ORDER BY created_at DESC;

-- 5. 삭제되지 않은 활성 계정만 확인 (중복 체크에서 걸리는 경우)
SELECT 
  id,
  email,
  full_name,
  nickname,
  phone,
  created_at,
  updated_at
FROM users
WHERE email = 'your-email@example.com'  -- 여기에 확인할 이메일 입력
  AND deleted_at IS NULL  -- 삭제되지 않은 계정만
ORDER BY created_at DESC;

-- 6. 특정 이메일을 완전히 삭제하는 쿼리 (주의: 신중하게 사용하세요!)
-- 먼저 위 쿼리로 확인한 후, 정말 삭제가 필요한 경우에만 실행하세요
/*
-- users 테이블에서 완전 삭제 (soft delete)
UPDATE users
SET deleted_at = NOW()
WHERE email = 'your-email@example.com'
  AND deleted_at IS NULL;

-- verification_codes 테이블에서 삭제
DELETE FROM verification_codes
WHERE email = 'your-email@example.com';

-- 주의: auth.users는 Supabase Dashboard에서 수동으로 삭제하거나
-- API를 통해 삭제해야 합니다.
*/

