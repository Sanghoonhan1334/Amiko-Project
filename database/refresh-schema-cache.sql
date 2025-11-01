-- Supabase 스키마 캐시 새로고침
-- Refresh Supabase Schema Cache

-- 방법 1: NOTIFY를 사용하여 PostgREST에 스키마 변경 알림 (권장)
NOTIFY pgrst, 'reload schema';

-- 방법 2: 테이블 comment 업데이트하여 스키마 변경 감지
COMMENT ON TABLE fan_art_comments IS 'Fan art comments with reply support';

-- 확인: parent_comment_id 컬럼이 존재하는지 체크
SELECT 
  column_name, 
  data_type, 
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'fan_art_comments'
ORDER BY ordinal_position;

