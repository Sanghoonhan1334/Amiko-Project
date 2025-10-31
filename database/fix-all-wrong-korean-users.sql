-- 현지인인데 is_korean이 true로 잘못 설정된 모든 사용자 수정

-- 1. 중남미 국가 코드 리스트
WITH latin_america_countries AS (
  SELECT UNNEST(ARRAY['MX', 'CO', 'AR', 'PE', 'VE', 'CL', 'EC', 'GT', 'HN', 'NI', 'PA', 'PY', 'UY', 'BO', 'CR', 'DO', 'SV', 'CU', 'PR', 'BR']) AS code
)

-- 2. 잘못 설정된 사용자 확인 (중남미 출신인데 한국인으로 설정됨)
SELECT 
  id,
  email,
  full_name,
  nickname,
  is_korean,
  language,
  phone,
  created_at
FROM users
WHERE is_korean = true
AND (
  -- 이메일 도메인 체크
  email LIKE '%.pe' OR  -- 페루
  email LIKE '%.mx' OR  -- 멕시코
  email LIKE '%.co' OR  -- 콜롬비아
  email LIKE '%.ar' OR  -- 아르헨티나
  email LIKE '%.cl' OR  -- 칠레
  email LIKE '%.ec' OR  -- 에콰도르
  email LIKE '%.bo' OR  -- 볼리비아
  email LIKE '%.py' OR  -- 파라과이
  email LIKE '%.uy' OR  -- 우루과이
  email LIKE '%.ve' OR  -- 베네수엘라
  email LIKE '%.gt' OR  -- 과테말라
  email LIKE '%.hn' OR  -- 온두라스
  email LIKE '%.ni' OR  -- 니카라과
  email LIKE '%.pa' OR  -- 파나마
  email LIKE '%.cr' OR  -- 코스타리카
  email LIKE '%.do' OR  -- 도미니카
  email LIKE '%.sv' OR  -- 엘살바도르
  email LIKE '%.cu' OR  -- 쿠바
  email LIKE '%.pr' OR  -- 푸에르토리코
  email LIKE '%.br'     -- 브라질
)
ORDER BY created_at DESC;

-- 3. 실제 수정 (주의: 실행 전에 위 쿼리로 확인 먼저!)
-- UPDATE users 
-- SET is_korean = false, 
--     language = 'es'
-- WHERE is_korean = true
-- AND (
--   email LIKE '%.pe' OR email LIKE '%.mx' OR email LIKE '%.co' OR 
--   email LIKE '%.ar' OR email LIKE '%.cl' OR email LIKE '%.ec' OR 
--   email LIKE '%.bo' OR email LIKE '%.py' OR email LIKE '%.uy' OR 
--   email LIKE '%.ve' OR email LIKE '%.gt' OR email LIKE '%.hn' OR 
--   email LIKE '%.ni' OR email LIKE '%.pa' OR email LIKE '%.cr' OR 
--   email LIKE '%.do' OR email LIKE '%.sv' OR email LIKE '%.cu' OR 
--   email LIKE '%.pr' OR email LIKE '%.br'
-- );

-- 4. hopedesign.pe@gmail.com 개별 수정 (즉시 실행)
UPDATE users 
SET is_korean = false, 
    language = 'es'
WHERE email = 'hopedesign.pe@gmail.com';

-- 5. 결과 확인
SELECT 
  id,
  email,
  full_name,
  nickname,
  is_korean,
  language
FROM users
WHERE email = 'hopedesign.pe@gmail.com';

