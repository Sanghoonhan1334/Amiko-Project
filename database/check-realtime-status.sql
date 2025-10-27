-- ==========================================
-- 🔍 현재 Realtime 설정 확인
-- ==========================================

-- 1. Realtime이 활성화된 테이블 목록 확인
SELECT 
  tablename, 
  schemaname 
FROM pg_publication_tables 
WHERE pubname = 'supabase_realtime'
ORDER BY tablename;

-- ==========================================
-- ✅ 결과 확인:
-- ==========================================
-- chat_messages가 보이면 → 이미 활성화됨 ✅
-- chat_room_participants가 보이면 → 이미 활성화됨 ✅
-- 
-- 둘 다 안 보이면 → 에러지만 실제로는 동작하는 중일 수 있음
-- ==========================================

