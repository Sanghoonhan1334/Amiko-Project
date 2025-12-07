-- 가입 시도 분석 쿼리
-- verification_codes와 users 테이블을 조인하여 실제 가입 완료 여부 확인

-- 1. 인증코드 발송된 번호별 통계
SELECT 
  phone_number,
  COUNT(*) as total_codes_sent,
  COUNT(CASE WHEN verified = true THEN 1 END) as verified_count,
  COUNT(CASE WHEN verified = false THEN 1 END) as unverified_count,
  MIN(created_at) as first_attempt,
  MAX(created_at) as last_attempt
FROM verification_codes
WHERE created_at >= NOW() - INTERVAL '7 days'
  AND phone_number IS NOT NULL
  AND (
    phone_number LIKE '%5529497115%'
    OR phone_number LIKE '%4144715108%'
    OR phone_number LIKE '%969664932%'
    OR phone_number LIKE '+525529497115%'
    OR phone_number LIKE '+584144715108%'
    OR phone_number LIKE '+51969664932%'
  )
GROUP BY phone_number
ORDER BY last_attempt DESC;

-- 2. 인증 완료된 번호로 실제 가입한 사용자 확인
SELECT 
  u.id,
  u.email,
  u.full_name,
  u.nickname,
  u.phone,
  u.phone_country,
  u.is_korean,
  u.language,
  u.created_at as user_created_at,
  vc.phone_number as verification_phone,
  vc.verified,
  vc.created_at as code_created_at
FROM users u
INNER JOIN verification_codes vc ON u.phone = vc.phone_number
WHERE u.created_at >= NOW() - INTERVAL '7 days'
  AND (
    u.phone LIKE '%5529497115%'
    OR u.phone LIKE '%4144715108%'
    OR u.phone LIKE '%969664932%'
    OR u.phone LIKE '+525529497115%'
    OR u.phone LIKE '+584144715108%'
    OR u.phone LIKE '+51969664932%'
    OR vc.phone_number LIKE '%5529497115%'
    OR vc.phone_number LIKE '%4144715108%'
    OR vc.phone_number LIKE '%969664932%'
  )
  AND vc.verified = true
ORDER BY u.created_at DESC;

-- 3. 인증코드는 발송되었지만 가입하지 않은 경우 (인증만 시도)
SELECT 
  vc.phone_number,
  vc.verified,
  vc.created_at as code_created_at,
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM users u 
      WHERE u.phone = vc.phone_number
      AND u.created_at >= vc.created_at - INTERVAL '1 hour'
      AND u.created_at <= vc.created_at + INTERVAL '1 hour'
    ) THEN '가입 완료'
    ELSE '가입 미완료 (인증만 시도)'
  END as signup_status
FROM verification_codes vc
WHERE vc.created_at >= NOW() - INTERVAL '7 days'
  AND vc.phone_number IS NOT NULL
  AND (
    vc.phone_number LIKE '%5529497115%'
    OR vc.phone_number LIKE '%4144715108%'
    OR vc.phone_number LIKE '%969664932%'
    OR vc.phone_number LIKE '+525529497115%'
    OR vc.phone_number LIKE '+584144715108%'
    OR vc.phone_number LIKE '+51969664932%'
  )
ORDER BY vc.created_at DESC;

