-- 참여자 수 디버깅 쿼리

-- 1. 트리거가 존재하는지 확인
SELECT 
  trigger_name,
  event_manipulation,
  action_timing,
  action_statement
FROM information_schema.triggers
WHERE trigger_name = 'trigger_update_participant_count';

-- 2. 현재 채팅방별 실제 참여자 수 확인
SELECT 
  cr.id,
  cr.name,
  cr.participant_count as stored_count,
  COUNT(crp.user_id) as actual_count,
  (cr.participant_count - COUNT(crp.user_id)) as difference
FROM chat_rooms cr
LEFT JOIN chat_room_participants crp ON cr.id = crp.room_id
WHERE cr.is_active = true
GROUP BY cr.id, cr.name, cr.participant_count
ORDER BY difference DESC;

-- 3. participant_count 수동 동기화 (필요시 실행)
-- UPDATE chat_rooms cr
-- SET participant_count = (
--   SELECT COUNT(*) 
--   FROM chat_room_participants crp 
--   WHERE crp.room_id = cr.id
-- )
-- WHERE cr.is_active = true;

