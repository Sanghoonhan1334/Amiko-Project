-- 댓글 테이블 생성
CREATE TABLE IF NOT EXISTS post_comments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id UUID NOT NULL REFERENCES gallery_posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  parent_id UUID REFERENCES post_comments(id) ON DELETE CASCADE,
  like_count INTEGER DEFAULT 0,
  dislike_count INTEGER DEFAULT 0,
  is_deleted BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_post_comments_post_id ON post_comments(post_id);
CREATE INDEX IF NOT EXISTS idx_post_comments_user_id ON post_comments(user_id);
CREATE INDEX IF NOT EXISTS idx_post_comments_parent_id ON post_comments(parent_id);
CREATE INDEX IF NOT EXISTS idx_post_comments_created_at ON post_comments(created_at);

-- 댓글 투표 테이블 생성
CREATE TABLE IF NOT EXISTS comment_votes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  comment_id UUID NOT NULL REFERENCES post_comments(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  vote_type VARCHAR(10) NOT NULL CHECK (vote_type IN ('like', 'dislike')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(comment_id, user_id)
);

-- 댓글 투표 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_comment_votes_comment_id ON comment_votes(comment_id);
CREATE INDEX IF NOT EXISTS idx_comment_votes_user_id ON comment_votes(user_id);

-- 댓글 투표 처리 함수 생성
CREATE OR REPLACE FUNCTION handle_comment_vote(
  p_comment_id UUID,
  p_user_id UUID,
  p_vote_type VARCHAR(10),
  p_like_change INTEGER,
  p_dislike_change INTEGER
)
RETURNS VOID AS $$
BEGIN
  -- 기존 투표 삭제 또는 업데이트
  IF p_vote_type IS NULL THEN
    -- 투표 취소
    DELETE FROM comment_votes 
    WHERE comment_id = p_comment_id AND user_id = p_user_id;
  ELSE
    -- 투표 추가 또는 업데이트
    INSERT INTO comment_votes (comment_id, user_id, vote_type)
    VALUES (p_comment_id, p_user_id, p_vote_type)
    ON CONFLICT (comment_id, user_id)
    DO UPDATE SET 
      vote_type = p_vote_type,
      updated_at = NOW();
  END IF;

  -- 댓글 카운트 업데이트
  UPDATE post_comments 
  SET 
    like_count = GREATEST(0, like_count + p_like_change),
    dislike_count = GREATEST(0, dislike_count + p_dislike_change),
    updated_at = NOW()
  WHERE id = p_comment_id;
END;
$$ LANGUAGE plpgsql;

-- RLS 정책 설정
ALTER TABLE post_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE comment_votes ENABLE ROW LEVEL SECURITY;

-- 댓글 정책
CREATE POLICY "Anyone can view comments" ON post_comments
  FOR SELECT USING (NOT is_deleted);

CREATE POLICY "Users can insert their own comments" ON post_comments
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own comments" ON post_comments
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own comments" ON post_comments
  FOR DELETE USING (auth.uid() = user_id);

-- 댓글 투표 정책
CREATE POLICY "Users can view their own votes" ON comment_votes
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own votes" ON comment_votes
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own votes" ON comment_votes
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own votes" ON comment_votes
  FOR DELETE USING (auth.uid() = user_id);
