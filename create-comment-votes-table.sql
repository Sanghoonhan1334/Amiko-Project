-- 댓글 투표 테이블 생성
CREATE TABLE IF NOT EXISTS comment_votes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  comment_id UUID NOT NULL REFERENCES post_comments(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  vote_type VARCHAR(10) NOT NULL CHECK (vote_type IN ('like', 'dislike')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(comment_id, user_id)
);

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_comment_votes_comment_id ON comment_votes(comment_id);
CREATE INDEX IF NOT EXISTS idx_comment_votes_user_id ON comment_votes(user_id);
CREATE INDEX IF NOT EXISTS idx_comment_votes_vote_type ON comment_votes(vote_type);

-- RLS 정책 설정
ALTER TABLE comment_votes ENABLE ROW LEVEL SECURITY;

-- 사용자는 자신의 투표만 조회/수정/삭제 가능
CREATE POLICY "Users can view their own comment votes" ON comment_votes
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own comment votes" ON comment_votes
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own comment votes" ON comment_votes
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own comment votes" ON comment_votes
  FOR DELETE USING (auth.uid() = user_id);

-- 확인
SELECT 'comment_votes 테이블이 성공적으로 생성되었습니다.' as message;
