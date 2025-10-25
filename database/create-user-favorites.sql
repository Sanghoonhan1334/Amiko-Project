-- 즐겨찾기 테이블 생성
CREATE TABLE IF NOT EXISTS user_favorites (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  quiz_id UUID REFERENCES quizzes(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, quiz_id)
);

-- 인덱스 생성 (성능 최적화)
CREATE INDEX IF NOT EXISTS idx_user_favorites_user_id ON user_favorites(user_id);
CREATE INDEX IF NOT EXISTS idx_user_favorites_quiz_id ON user_favorites(quiz_id);

-- RLS (Row Level Security) 활성화
ALTER TABLE user_favorites ENABLE ROW LEVEL SECURITY;

-- 정책 생성: 사용자는 자신의 즐겨찾기만 볼 수 있음
CREATE POLICY "Users can view their own favorites" ON user_favorites
  FOR SELECT USING (auth.uid() = user_id);

-- 정책 생성: 사용자는 자신의 즐겨찾기만 추가할 수 있음
CREATE POLICY "Users can insert their own favorites" ON user_favorites
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 정책 생성: 사용자는 자신의 즐겨찾기만 삭제할 수 있음
CREATE POLICY "Users can delete their own favorites" ON user_favorites
  FOR DELETE USING (auth.uid() = user_id);

-- 즐겨찾기 개수를 위한 함수 생성
CREATE OR REPLACE FUNCTION get_quiz_favorite_count(quiz_uuid UUID)
RETURNS INTEGER AS $$
BEGIN
  RETURN (
    SELECT COUNT(*)::INTEGER 
    FROM user_favorites 
    WHERE quiz_id = quiz_uuid
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 즐겨찾기 여부 확인 함수 생성
CREATE OR REPLACE FUNCTION is_quiz_favorited_by_user(quiz_uuid UUID, user_uuid UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 
    FROM user_favorites 
    WHERE quiz_id = quiz_uuid AND user_id = user_uuid
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
