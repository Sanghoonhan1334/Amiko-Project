-- 기존 한국인 사용자의 is_korean 필드를 true로 설정

-- 1. language가 'ko'인 경우 is_korean을 true로 설정
UPDATE users 
SET is_korean = true 
WHERE language = 'ko' 
AND (is_korean IS NULL OR is_korean = false);

-- 2. country가 'KR'인 경우 (user_profiles 테이블에 country 필드가 있다면)
-- UPDATE users 
-- SET is_korean = true 
-- WHERE country = 'KR' 
-- AND (is_korean IS NULL OR is_korean = false);

-- 3. 전화번호가 +82로 시작하는 경우
UPDATE users 
SET is_korean = true 
WHERE phone LIKE '+82%' 
AND (is_korean IS NULL OR is_korean = false);

-- 4. 이메일이 .kr로 끝나는 경우
UPDATE users 
SET is_korean = true 
WHERE email LIKE '%.kr' 
AND (is_korean IS NULL OR is_korean = false);

-- 결과 확인
SELECT 
  id, 
  email, 
  full_name, 
  language, 
  phone,
  is_korean,
  created_at
FROM users 
WHERE is_korean = true
ORDER BY created_at DESC
LIMIT 20;

