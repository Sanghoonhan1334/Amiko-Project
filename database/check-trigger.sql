-- 트리거 확인 및 재생성

-- 1. 트리거가 존재하는지 확인
SELECT 
  trigger_name,
  event_manipulation,
  action_timing,
  action_statement,
  action_orientation
FROM information_schema.triggers
WHERE trigger_name = 'trigger_update_participant_count';

-- 2. 함수 재생성 (if not exists는 함수에서 지원 안함)
CREATE OR REPLACE FUNCTION update_chat_room_participant_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE chat_rooms
    SET participant_count = participant_count + 1
    WHERE id = NEW.room_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE chat_rooms
    SET participant_count = GREATEST(participant_count - 1, 0)
    WHERE id = OLD.room_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- 3. 트리거 재생성 (DROP IF EXISTS로 안전하게)
DROP TRIGGER IF EXISTS trigger_update_participant_count ON chat_room_participants;

CREATE TRIGGER trigger_update_participant_count
AFTER INSERT OR DELETE ON chat_room_participants
FOR EACH ROW EXECUTE FUNCTION update_chat_room_participant_count();

-- 4. 트리거 확인
SELECT 
  trigger_name,
  event_manipulation,
  action_timing
FROM information_schema.triggers
WHERE trigger_name = 'trigger_update_participant_count';
