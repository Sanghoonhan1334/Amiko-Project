-- 최근 가입 시도 확인 (전화번호 기준)
-- Twilio 로그에 나타난 번호들로 가입 시도가 있었는지 확인

-- 1. 멕시코 (+52 5529497115)
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
  updated_at
FROM users
WHERE phone LIKE '%5529497115%'
   OR phone LIKE '%525529497115%'
   OR phone LIKE '+525529497115%'
ORDER BY created_at DESC;

-- 2. 베네수엘라 (+58 4144715108)
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
  updated_at
FROM users
WHERE phone LIKE '%4144715108%'
   OR phone LIKE '%584144715108%'
   OR phone LIKE '+584144715108%'
ORDER BY created_at DESC;

-- 3. 페루 (+51 969664932)
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
  updated_at
FROM users
WHERE phone LIKE '%969664932%'
   OR phone LIKE '%51969664932%'
   OR phone LIKE '+51969664932%'
ORDER BY created_at DESC;

-- 4. 최근 7일 이내 가입한 모든 사용자 (멕시코, 베네수엘라, 페루)
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
WHERE created_at >= NOW() - INTERVAL '7 days'
  AND (
    phone_country IN ('MX', 'VE', 'PE', '52', '58', '51')
    OR phone LIKE '+52%'
    OR phone LIKE '+58%'
    OR phone LIKE '+51%'
    OR phone LIKE '52%'
    OR phone LIKE '58%'
    OR phone LIKE '51%'
  )
ORDER BY created_at DESC;

-- 5. 최근 인증코드 발송 기록 확인 (verification_codes 테이블)
SELECT 
  id,
  phone_number,
  code,
  type,
  verified,
  created_at,
  expires_at
FROM verification_codes
WHERE created_at >= NOW() - INTERVAL '7 days'
  AND (
    phone_number LIKE '%5529497115%'
    OR phone_number LIKE '%4144715108%'
    OR phone_number LIKE '%969664932%'
    OR phone_number LIKE '+525529497115%'
    OR phone_number LIKE '+584144715108%'
    OR phone_number LIKE '+51969664932%'
  )
ORDER BY created_at DESC;

