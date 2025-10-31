-- Sam1334 사용자 찾기 및 한국 번호 추가 가능 여부 확인

-- 1. Sam1334 사용자 찾기
SELECT 
  id,
  email,
  full_name,
  nickname,
  phone,
  phone_country,
  is_korean,
  language,
  is_phone_verified,
  phone_verified_at,
  created_at
FROM users
WHERE nickname ILIKE '%sam1334%' OR email ILIKE '%sam1334%';

-- 2. 한국 번호 추가 (예: 010-1234-5678 -> 821012345678)
-- 주의: 실제 번호를 입력하기 전에 확인하세요!
-- UPDATE users 
-- SET 
--   phone = '821012345678',  -- 실제 한국 전화번호로 교체 필요
--   phone_country = '82',
--   is_korean = true,
--   language = 'ko'
-- WHERE nickname ILIKE '%sam1334%' OR email ILIKE '%sam1334%';

-- 3. 업데이트 후 확인
-- SELECT id, email, full_name, phone, phone_country, is_korean, language
-- FROM users
-- WHERE nickname ILIKE '%sam1334%' OR email ILIKE '%sam1334%';

