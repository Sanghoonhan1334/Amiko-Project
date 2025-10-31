-- Sam1334 및 현지인일 가능성이 있는 사용자 확인

-- 1. Sam1334 사용자 찾기
SELECT 
  id,
  email,
  full_name,
  nickname,
  is_korean,
  language,
  created_at
FROM users
WHERE nickname ILIKE '%sam1334%' OR email ILIKE '%sam1334%';

-- 2. language가 'es'이면서 is_korean이 true인 사용자 찾기 (잘못된 데이터)
SELECT 
  id,
  email,
  full_name,
  nickname,
  is_korean,
  language,
  created_at
FROM users
WHERE language = 'es' AND is_korean = true;

-- 3. 현재 온라인 사용자 목록과 그들의 is_korean, language 상태
SELECT 
  id,
  email,
  full_name,
  nickname,
  is_korean,
  language,
  updated_at
FROM users
WHERE is_korean = true
AND language = 'ko'
ORDER BY updated_at DESC
LIMIT 10;

-- 4. 현지인 사용자 찾기 (language가 es이고 is_korean이 false인 사용자)
SELECT 
  id,
  email,
  full_name,
  nickname,
  is_korean,
  language,
  updated_at
FROM users
WHERE (language = 'es' OR language = 'en') AND is_korean = false
ORDER BY updated_at DESC
LIMIT 10;

-- 5. 잘못 설정된 사용자 수정 (language가 es이면서 is_korean이 true인 경우)
-- 주의: 실제로 수정하기 전에 먼저 결과를 확인하세요!
-- UPDATE users SET is_korean = false WHERE language = 'es' AND is_korean = true;

