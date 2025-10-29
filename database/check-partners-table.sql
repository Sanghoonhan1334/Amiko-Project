-- conversation_partners 테이블 확인

-- 1. 테이블 존재 확인
SELECT table_name 
FROM information_schema.tables 
WHERE table_name = 'conversation_partners';

-- 2. 컬럼 확인
SELECT column_name, data_type
FROM information_schema.columns 
WHERE table_name = 'conversation_partners'
ORDER BY ordinal_position;

-- 3. RLS 정책 확인
SELECT policyname, cmd, definition
FROM pg_policies 
WHERE tablename = 'conversation_partners';

-- 4. 데이터 확인
SELECT COUNT(*) as total FROM conversation_partners;

