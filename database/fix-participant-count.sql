-- 참여자 수 수동 동기화

-- 1. 모든 채팅방의 participant_count를 실제 참여자 수로 업데이트
UPDATE chat_rooms cr
SET participant_count = (
  SELECT COUNT(*) 
  FROM chat_room_participants crp 
  WHERE crp.room_id = cr.id
)
WHERE cr.is_active = true;

-- 2. 확인 쿼리
SELECT 
  cr.id,
  cr.name,
  cr.participant_count as stored_count,
  COUNT(crp.user_id) as actual_count
FROM chat_rooms cr
LEFT JOIN chat_room_participants crp ON cr.id = crp.room_id
WHERE cr.is_active = true
GROUP BY cr.id, cr.name, cr.participant_count;

