-- fan_art_comments 테이블 컬럼 확인
-- Check fan_art_comments table columns

SELECT 
  column_name, 
  data_type, 
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'fan_art_comments'
ORDER BY ordinal_position;

