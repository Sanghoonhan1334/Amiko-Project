-- conversation_partners 테이블에 등록된 파트너 확인

SELECT 
  cp.id,
  cp.user_id,
  u.full_name,
  u.email,
  u.avatar_url,
  cp.status,
  cp.country,
  cp.created_at
FROM conversation_partners cp
JOIN users u ON cp.user_id = u.id
ORDER BY cp.created_at DESC;

-- 특정 사용자의 파트너 등록 여부 확인
-- 아래 user_id를 실제 사용자 ID로 바꾸세요
-- SELECT * FROM conversation_partners WHERE user_id = 'YOUR_USER_ID';

