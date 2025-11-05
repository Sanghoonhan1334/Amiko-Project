-- user_favorites INSERT 정책 수정
-- WITH CHECK 조건 추가

-- 1. 기존 INSERT 정책 삭제
DROP POLICY IF EXISTS "Users can insert their own favorites" ON user_favorites;

-- 2. 새로운 INSERT 정책 생성 (WITH CHECK 포함)
CREATE POLICY "Users can insert their own favorites"
ON user_favorites
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- 3. 정책 확인
SELECT 
    policyname,
    cmd,
    qual,
    with_check
FROM pg_policies
WHERE tablename = 'user_favorites'
  AND cmd = 'INSERT';

-- 완료 메시지
SELECT '✅ INSERT 정책이 WITH CHECK 조건과 함께 재생성되었습니다.' as status;

