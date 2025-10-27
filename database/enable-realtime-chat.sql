-- ==========================================
-- 🔥 채팅 실시간 활성화 SQL
-- ==========================================
-- 실행 방법: Supabase Dashboard → SQL Editor → 붙여넣기 → 실행

-- 1. 현재 Realtime 설정 확인
SELECT 
  tablename, 
  schemaname 
FROM pg_publication_tables 
WHERE pubname = 'supabase_realtime';

-- 2. chat_messages 테이블에 Realtime 활성화
ALTER PUBLICATION supabase_realtime ADD TABLE chat_messages;

-- 3. chat_room_participants 테이블에 Realtime 활성화
ALTER PUBLICATION supabase_realtime ADD TABLE chat_room_participants;

-- 4. 다시 확인 (chat_messages가 보이면 성공!)
SELECT 
  tablename, 
  schemaname 
FROM pg_publication_tables 
WHERE pubname = 'supabase_realtime';

-- ==========================================
-- ✅ 끝! 이제 실시간 채팅 작동합니다!
-- ==========================================
-- 브라우저 콘솔에서 "🎉 Realtime 연결 성공!" 확인하세요
-- ==========================================

