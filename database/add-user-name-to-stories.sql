-- 스토리 테이블에 user_name 컬럼 추가
ALTER TABLE stories ADD COLUMN IF NOT EXISTS user_name TEXT DEFAULT '익명';

-- 기존 스토리들의 user_name을 '익명'으로 설정
UPDATE stories SET user_name = '익명' WHERE user_name IS NULL;

-- user_name 컬럼을 NOT NULL로 변경
ALTER TABLE stories ALTER COLUMN user_name SET NOT NULL;
