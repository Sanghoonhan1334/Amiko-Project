-- ==========================================
-- 채팅방 관리자 시스템
-- ==========================================
-- Description: 방장, 부방장, 일반 멤버 권한 시스템
-- Date: 2025-01-06
-- ==========================================

-- 1. 채팅방 참여자에 권한 필드 추가
ALTER TABLE chat_room_participants 
ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'member' CHECK (role IN ('owner', 'admin', 'moderator', 'member'));

-- 2. 역할 설명
COMMENT ON COLUMN chat_room_participants.role IS 
'권한: owner(방장), admin(부방장), moderator(모더레이터), member(일반멤버)';

-- 3. 채팅방에 방장 필드 추가
ALTER TABLE chat_rooms 
ADD COLUMN IF NOT EXISTS owner_id UUID REFERENCES auth.users(id);

-- 4. 채팅방 신고 테이블 생성
CREATE TABLE IF NOT EXISTS chat_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id UUID REFERENCES chat_rooms(id) ON DELETE CASCADE,
  reported_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  reporter_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  reason TEXT NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'reviewed', 'resolved', 'dismissed')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  reviewed_at TIMESTAMP WITH TIME ZONE,
  reviewed_by UUID REFERENCES auth.users(id)
);

-- 5. 추방 기록 테이블 생성
CREATE TABLE IF NOT EXISTS chat_bans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id UUID REFERENCES chat_rooms(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  banned_by UUID REFERENCES auth.users(id),
  reason TEXT,
  ban_type TEXT DEFAULT 'temporary' CHECK (ban_type IN ('temporary', 'permanent')),
  expires_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(room_id, user_id)
);

-- 6. 기존 채팅방의 생성자를 방장으로 설정
UPDATE chat_room_participants
SET role = 'owner'
WHERE EXISTS (
  SELECT 1 FROM chat_rooms 
  WHERE chat_rooms.id = chat_room_participants.room_id 
  AND chat_rooms.created_by = chat_room_participants.user_id
);

-- 7. 채팅방의 owner_id 업데이트
UPDATE chat_rooms
SET owner_id = created_by
WHERE owner_id IS NULL;

-- 8. 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_chat_participants_role ON chat_room_participants(role);
CREATE INDEX IF NOT EXISTS idx_chat_reports_status ON chat_reports(status);
CREATE INDEX IF NOT EXISTS idx_chat_bans_expires ON chat_bans(expires_at) WHERE expires_at IS NOT NULL;

-- 9. 자동 방장 설정 함수
CREATE OR REPLACE FUNCTION set_chat_room_owner()
RETURNS TRIGGER AS $$
BEGIN
  -- 채팅방 생성 시 생성자를 방장으로 설정
  IF TG_OP = 'INSERT' THEN
    INSERT INTO chat_room_participants (room_id, user_id, role)
    VALUES (NEW.id, NEW.created_by, 'owner')
    ON CONFLICT (room_id, user_id) DO UPDATE SET role = 'owner';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 10. 트리거 생성
DROP TRIGGER IF EXISTS trigger_set_chat_room_owner ON chat_rooms;
CREATE TRIGGER trigger_set_chat_room_owner
AFTER INSERT ON chat_rooms
FOR EACH ROW EXECUTE FUNCTION set_chat_room_owner();

-- 11. RLS 정책 업데이트 (추방된 사용자는 참여 불가)
CREATE POLICY "Participants can view messages except banned"
  ON chat_messages FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM chat_room_participants
      WHERE room_id = chat_messages.room_id
      AND user_id = auth.uid()
    )
    AND NOT EXISTS (
      SELECT 1 FROM chat_bans
      WHERE room_id = chat_messages.room_id
      AND user_id = auth.uid()
      AND (expires_at IS NULL OR expires_at > NOW())
    )
  );

-- 12. 채팅방 신고 조회 정책
ALTER TABLE chat_reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view reports"
  ON chat_reports FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM chat_room_participants
      WHERE room_id = chat_reports.room_id
      AND user_id = auth.uid()
      AND role IN ('owner', 'admin', 'moderator')
    )
  );

CREATE POLICY "Users can report"
  ON chat_reports FOR INSERT
  WITH CHECK (auth.uid() = reporter_id);

-- 13. 추방 기록 조회 정책
ALTER TABLE chat_bans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view bans"
  ON chat_bans FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM chat_room_participants
      WHERE room_id = chat_bans.room_id
      AND user_id = auth.uid()
      AND role IN ('owner', 'admin', 'moderator')
    )
  );

CREATE POLICY "Admins can ban users"
  ON chat_bans FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM chat_room_participants
      WHERE room_id = chat_bans.room_id
      AND user_id = auth.uid()
      AND role IN ('owner', 'admin', 'moderator')
    )
  );

-- ==========================================
-- 권한 설명:
-- ==========================================
-- owner (방장):
--   - 방장 변경
--   - 부방장 지정/해제
--   - 사용자 추방
--   - 방 설정 변경
--   - 방 삭제
--
-- admin (부방장):
--   - 모더레이터 지정/해제
--   - 사용자 추방
--   - 신고 처리
--
-- moderator (모더레이터):
--   - 사용자 추방 (임시)
--   - 신고 처리
--
-- member (일반 멤버):
--   - 채팅 참여
--   - 신고
-- ==========================================

