-- 채팅방 데이터 확인 쿼리
-- 이전에 다른 타입의 채팅방이 있었는지 확인

-- 1. 모든 채팅방 타입 확인
SELECT 
  type,
  COUNT(*) as count,
  COUNT(CASE WHEN is_active = true THEN 1 END) as active_count,
  COUNT(CASE WHEN is_active = false THEN 1 END) as inactive_count
FROM chat_rooms
GROUP BY type
ORDER BY count DESC;

-- 2. 타입별 상세 정보
SELECT 
  id,
  name,
  type,
  country,
  fanclub_name,
  description,
  created_by,
  is_active,
  participant_count,
  created_at,
  updated_at
FROM chat_rooms
ORDER BY created_at DESC;

-- 3. CHECK 제약조건 확인 (다른 타입이 있는지 확인)
SELECT 
  type,
  COUNT(*) as count
FROM chat_rooms
WHERE type NOT IN ('country', 'fanclub')
GROUP BY type;

-- 4. 나라별 채팅방 목록
SELECT 
  id,
  name,
  country,
  description,
  is_active,
  participant_count,
  created_at
FROM chat_rooms
WHERE type = 'country'
ORDER BY created_at DESC;

-- 5. 팬클럽 채팅방 목록
SELECT 
  id,
  name,
  fanclub_name,
  description,
  is_active,
  participant_count,
  created_at
FROM chat_rooms
WHERE type = 'fanclub'
ORDER BY created_at DESC;

-- 6. 비활성화된 채팅방 확인
SELECT 
  id,
  name,
  type,
  country,
  fanclub_name,
  is_active,
  created_at
FROM chat_rooms
WHERE is_active = false
ORDER BY created_at DESC;




