-- 현재 데이터베이스에 존재하는 테이블 확인
-- 이 파일을 Supabase SQL Editor에서 실행하세요

-- 1. 모든 테이블 목록 조회
SELECT 
  schemaname,
  tablename,
  tableowner
FROM pg_tables 
WHERE schemaname = 'public'
ORDER BY tablename;

-- 2. notification으로 시작하는 테이블만 조회
SELECT 
  tablename,
  tableowner
FROM pg_tables 
WHERE schemaname = 'public' 
  AND tablename LIKE 'notification%'
ORDER BY tablename;

-- 3. 특정 테이블의 구조 확인 (notification_settings가 있다면)
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'notification_settings'
ORDER BY ordinal_position;

-- 4. 테이블에 데이터가 있는지 확인
SELECT COUNT(*) as row_count FROM notification_settings;
