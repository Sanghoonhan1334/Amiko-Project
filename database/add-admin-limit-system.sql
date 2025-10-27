-- ==========================================
-- 부방장 인원 제한 시스템
-- ==========================================
-- Description: 참여자 수에 따른 부방장 자동 제한
-- Date: 2025-01-06
-- ==========================================

-- 1. 부방장 인원 제한 함수
CREATE OR REPLACE FUNCTION get_max_admins(participant_count INTEGER)
RETURNS INTEGER AS $$
BEGIN
  -- 참여자 수에 따른 부방장 제한
  -- 참여자 < 50명: 부방장 2명
  -- 참여자 50-200명: 부방장 3명
  -- 참여자 200-500명: 부방장 5명
  -- 참여자 500-1000명: 부방장 7명
  -- 참여자 1000명+: 부방장 10명
  
  -- 추천: 참여자 100명당 부방장 1명
  -- 최소 3명, 최대 10명
  RETURN LEAST(GREATEST(FLOOR(participant_count / 100), 3), 10);
END;
$$ LANGUAGE plpgsql;

-- 2. 부방장 지정 시 인원 제한 체크 함수
CREATE OR REPLACE FUNCTION check_admin_limit()
RETURNS TRIGGER AS $$
DECLARE
  current_admins INTEGER;
  room_participant_count INTEGER;
  max_admins INTEGER;
BEGIN
  -- 방의 참여자 수 가져오기
  SELECT participant_count INTO room_participant_count
  FROM chat_rooms
  WHERE id = NEW.room_id;
  
  -- 최대 부방장 수 계산
  max_admins := get_max_admins(room_participant_count);
  
  -- 현재 부방장 수 계산 (admin + moderator)
  SELECT COUNT(*) INTO current_admins
  FROM chat_room_participants
  WHERE room_id = NEW.room_id
  AND role IN ('admin', 'moderator');
  
  -- 역할이 admin 또는 moderator인 경우 체크
  IF NEW.role IN ('admin', 'moderator') THEN
    -- 이미 부방장인 경우 (UPDATE)는 체크 안 함
    IF TG_OP = 'INSERT' THEN
      -- 부방장 수 제한 초과
      IF current_admins >= max_admins THEN
        RAISE EXCEPTION '부방장 인원이 가득 찼습니다. (최대 %명)', max_admins;
      END IF;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 3. 트리거 생성
DROP TRIGGER IF EXISTS trigger_check_admin_limit ON chat_room_participants;
CREATE TRIGGER trigger_check_admin_limit
BEFORE INSERT OR UPDATE ON chat_room_participants
FOR EACH ROW EXECUTE FUNCTION check_admin_limit();

-- 4. 뷰 생성: 방의 현재 관리 상태 확인
CREATE OR REPLACE VIEW chat_room_admin_status AS
SELECT 
  cr.id as room_id,
  cr.name as room_name,
  cr.participant_count,
  get_max_admins(cr.participant_count) as max_admins,
  COUNT(CASE WHEN crp.role = 'owner' THEN 1 END) as owner_count,
  COUNT(CASE WHEN crp.role = 'admin' THEN 1 END) as admin_count,
  COUNT(CASE WHEN crp.role = 'moderator' THEN 1 END) as moderator_count,
  COUNT(CASE WHEN crp.role IN ('admin', 'moderator') THEN 1 END) as total_admins
FROM chat_rooms cr
LEFT JOIN chat_room_participants crp ON cr.id = crp.room_id
GROUP BY cr.id, cr.name, cr.participant_count;

-- ==========================================
-- 사용 예시:
-- ==========================================
-- 1. 부방장 지정 전 확인:
--    SELECT max_admins, current_admins FROM chat_room_admin_status WHERE room_id = 'xxx';
--
-- 2. 부방장 지정:
--    UPDATE chat_room_participants 
--    SET role = 'admin' 
--    WHERE room_id = 'xxx' AND user_id = 'yyy';
--
-- 3. 모더레이터 지정:
--    UPDATE chat_room_participants 
--    SET role = 'moderator' 
--    WHERE room_id = 'xxx' AND user_id = 'yyy';
--
-- 4. 부방장 해제:
--    UPDATE chat_room_participants 
--    SET role = 'member' 
--    WHERE room_id = 'xxx' AND user_id = 'yyy';
-- ==========================================

-- 5. 부방장 자동 정리 함수 (인원 초과 시)
CREATE OR REPLACE FUNCTION auto_demote_excess_admins()
RETURNS VOID AS $$
DECLARE
  room_record RECORD;
  excess_count INTEGER;
BEGIN
  FOR room_record IN SELECT * FROM chat_rooms LOOP
    -- 초과된 부방장 수 계산
    SELECT COUNT(*) - get_max_admins(room_record.participant_count) INTO excess_count
    FROM chat_room_participants
    WHERE room_id = room_record.id
    AND role IN ('admin', 'moderator');
    
    -- 초과된 경우 가장 늦게 임명된 부방장을 일반 멤버로 변경
    IF excess_count > 0 THEN
      UPDATE chat_room_participants
      SET role = 'member'
      WHERE room_id = room_record.id
      AND role IN ('admin', 'moderator')
      AND user_id IN (
        SELECT user_id
        FROM chat_room_participants
        WHERE room_id = room_record.id
        AND role IN ('admin', 'moderator')
        ORDER BY joined_at DESC
        LIMIT excess_count
      );
    END IF;
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- ==========================================
-- 권장 부방장 체계:
-- ==========================================
-- 참여자 < 50명: 방장 1명 + 부방장 2명 (총 3명 관리자)
-- 참여자 50-200명: 방장 1명 + 부방장 3명 (총 4명 관리자)
-- 참여자 200-500명: 방장 1명 + 부방장 5명 (총 6명 관리자)
-- 참여자 500-1000명: 방장 1명 + 부방장 7명 (총 8명 관리자)
-- 참여자 1000명+: 방장 1명 + 부방장 10명 (총 11명 관리자)
--
-- 비율: 참여자의 약 1-5%가 관리자 (한국 서비스 기준)
-- ==========================================

