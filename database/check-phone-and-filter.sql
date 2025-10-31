-- 전화번호 국가 코드로 한국인 판별 확인 및 필터링 테스트

-- 1. 모든 사용자의 전화번호 및 추출된 국가 코드 확인
SELECT 
  id,
  email,
  full_name,
  nickname,
  phone,
  phone_country,
  is_korean,
  language,
  created_at
FROM users
ORDER BY created_at DESC
LIMIT 50;

-- 2. 전화번호가 82로 시작하는 사용자 (한국인으로 필터링되어야 함)
SELECT 
  id,
  email,
  full_name,
  nickname,
  phone,
  phone_country,
  is_korean,
  language,
  created_at
FROM users
WHERE phone LIKE '82%'
ORDER BY updated_at DESC;

-- 3. 전화번호가 82로 시작하지 않는 사용자 (현지인)
SELECT 
  id,
  email,
  full_name,
  nickname,
  phone,
  phone_country,
  is_korean,
  language,
  created_at
FROM users
WHERE phone IS NOT NULL 
  AND phone != ''
  AND NOT (phone LIKE '82%' AND phone NOT LIKE '821%')
ORDER BY updated_at DESC
LIMIT 20;

-- 4. Sam1334 사용자의 전화번호 확인
SELECT 
  id,
  email,
  full_name,
  nickname,
  phone,
  phone_country,
  is_korean,
  language,
  created_at
FROM users
WHERE nickname ILIKE '%sam1334%' OR email ILIKE '%sam1334%';

-- 5. hopedesign.pe@gmail.com 사용자의 전화번호 확인
SELECT 
  id,
  email,
  full_name,
  nickname,
  phone,
  phone_country,
  is_korean,
  language,
  created_at
FROM users
WHERE email ILIKE '%hopedesign.pe%';

-- 6. 전화번호 기반 한국인 필터링 테스트
-- (온라인 사용자 API에서 사용하는 로직)
SELECT 
  id,
  email,
  full_name,
  nickname,
  phone,
  SUBSTRING(phone, 1, 2) as phone_prefix,
  updated_at,
  CASE 
    WHEN phone IS NOT NULL AND phone != '' 
      AND SUBSTRING(phone, 1, 2) = '82' 
      AND SUBSTRING(phone, 1, 3) != '821'
    THEN '한국인'
    ELSE '현지인'
  END as user_type
FROM users
WHERE phone IS NOT NULL AND phone != ''
ORDER BY updated_at DESC
LIMIT 20;

