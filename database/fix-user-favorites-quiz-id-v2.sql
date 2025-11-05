-- user_favorites 테이블의 quiz_id 컬럼을 UUID에서 TEXT로 변경 (v2)
-- Fix user_favorites.quiz_id from UUID to TEXT to support string IDs like "korean-level-1"

-- 1. 외래 키 제약 조건 삭제
ALTER TABLE user_favorites 
DROP CONSTRAINT IF EXISTS user_favorites_quiz_id_fkey;

-- 2. quiz_id 컬럼의 타입을 UUID에서 TEXT로 변경
ALTER TABLE user_favorites 
ALTER COLUMN quiz_id TYPE TEXT USING quiz_id::TEXT;

-- 3. 변경 확인
SELECT 
    column_name, 
    data_type, 
    character_maximum_length,
    is_nullable
FROM information_schema.columns
WHERE table_name = 'user_favorites'
  AND column_name = 'quiz_id';

-- 4. 기존 데이터 확인
SELECT 
    COUNT(*) as total_favorites,
    COUNT(DISTINCT quiz_id) as unique_quizzes
FROM user_favorites;

-- 완료 메시지
SELECT '✅ user_favorites.quiz_id 컬럼 타입 변경 완료!' as status,
       '이제 "korean-level-1" 같은 문자열 ID도 저장 가능합니다' as message;

