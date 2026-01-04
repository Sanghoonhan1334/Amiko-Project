-- ==========================================
-- last_read_at 컬럼 확인 및 추가 (필요시)
-- ==========================================
-- Description: chat_room_participants 테이블에 last_read_at 컬럼이 있는지 확인하고, 없으면 추가
-- Date: 2025-01-02
-- ==========================================

-- 1. 컬럼 존재 여부 확인
SELECT 
  column_name, 
  data_type, 
  is_nullable, 
  column_default
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'chat_room_participants'
  AND column_name = 'last_read_at';

-- 2. 컬럼이 없으면 추가 (위 쿼리 결과가 없을 때만 실행)
-- ALTER TABLE chat_room_participants 
-- ADD COLUMN IF NOT EXISTS last_read_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- 3. 기존 데이터에 last_read_at이 NULL인 경우 joined_at으로 설정
-- UPDATE chat_room_participants
-- SET last_read_at = joined_at
-- WHERE last_read_at IS NULL;

