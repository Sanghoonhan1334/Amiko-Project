-- 현지인인데 is_korean이 true로 잘못 설정된 사용자 수정

-- 1. 먼저 확인: 이메일 도메인으로 판단 (전부 수정하지 말고 확인 후 선택적으로 수정)
SELECT 
  id,
  email,
  full_name,
  nickname,
  is_korean,
  language
FROM users
WHERE is_korean = true
AND (
  email LIKE '%.pe' OR  -- 페루
  email LIKE '%.mx' OR  -- 멕시코
  email LIKE '%.co' OR  -- 콜롬비아
  email LIKE '%.ar' OR  -- 아르헨티나
  email LIKE '%.cl' OR  -- 칠레
  email LIKE '%.ec' OR  -- 에콰도르
  email LIKE '%.bo' OR  -- 볼리비아
  email LIKE '%.py' OR  -- 파라과이
  email LIKE '%.uy' OR  -- 우루과이
  email LIKE '%.ve'     -- 베네수엘라
);

-- 2. hopedesign.pe@gmail.com 사용자 수정
UPDATE users 
SET is_korean = false, 
    language = 'es'
WHERE email = 'hopedesign.pe@gmail.com';

-- 3. 확인: 수정된 결과 확인
SELECT 
  id,
  email,
  full_name,
  nickname,
  is_korean,
  language
FROM users
WHERE email = 'hopedesign.pe@gmail.com';

