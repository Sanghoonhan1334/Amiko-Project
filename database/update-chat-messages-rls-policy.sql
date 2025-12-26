-- 채팅 메시지 RLS 정책 업데이트
-- 메시지 조회: 활성화된 채팅방이면 누구나 볼 수 있음 (참가자 등록 불필요)
-- 메시지 전송: 참가자만 가능 (기존 유지)

-- 기존 정책 삭제
DROP POLICY IF EXISTS "Participants can view messages" ON chat_messages;
DROP POLICY IF EXISTS "Participants can view messages except banned" ON chat_messages;

-- 새로운 정책: 활성화된 채팅방의 메시지는 누구나 볼 수 있음
CREATE POLICY "Anyone can view messages from active rooms"
  ON chat_messages FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM chat_rooms
      WHERE id = chat_messages.room_id
      AND is_active = true
    )
  );

-- 메시지 전송 정책은 기존 유지 (참가자만 가능)
-- "Participants can send messages" 정책은 그대로 유지

-- 참고: 메시지 전송 시 참가자 등록은 애플리케이션 로직에서 처리
-- (sendMessage 함수에서 joinRoom() 호출)

