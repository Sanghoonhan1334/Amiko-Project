-- 테스트별 댓글 시스템 테이블 생성
CREATE TABLE IF NOT EXISTS test_comments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  test_id VARCHAR(50) NOT NULL, -- 'mbti-kpop', 'idol-position' 등
  user_id UUID REFERENCES auth.users(id),
  user_name VARCHAR(100),
  user_avatar_url TEXT,
  comment TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 인덱스 생성 (성능 최적화)
CREATE INDEX IF NOT EXISTS idx_test_comments_test_id ON test_comments(test_id);
CREATE INDEX IF NOT EXISTS idx_test_comments_created_at ON test_comments(created_at DESC);

-- RLS (Row Level Security) 정책 설정
ALTER TABLE test_comments ENABLE ROW LEVEL SECURITY;

-- 모든 사용자가 댓글을 읽을 수 있음
CREATE POLICY "Anyone can view test comments" ON test_comments
  FOR SELECT USING (true);

-- 인증된 사용자만 댓글을 작성할 수 있음
CREATE POLICY "Authenticated users can insert test comments" ON test_comments
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- 사용자는 자신의 댓글만 수정/삭제할 수 있음
CREATE POLICY "Users can update own test comments" ON test_comments
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own test comments" ON test_comments
  FOR DELETE USING (auth.uid() = user_id);

-- 댓글 수를 위한 함수 (선택사항)
CREATE OR REPLACE FUNCTION get_test_comment_count(test_id_param VARCHAR(50))
RETURNS INTEGER AS $$
BEGIN
  RETURN (
    SELECT COUNT(*)
    FROM test_comments
    WHERE test_id = test_id_param
  );
END;
$$ LANGUAGE plpgsql;
