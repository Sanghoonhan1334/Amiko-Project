-- 게시글 투표 테이블 생성
CREATE TABLE IF NOT EXISTS post_votes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id UUID NOT NULL REFERENCES gallery_posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  vote_type VARCHAR(10) NOT NULL CHECK (vote_type IN ('like', 'dislike')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(post_id, user_id)
);

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_post_votes_post_id ON post_votes(post_id);
CREATE INDEX IF NOT EXISTS idx_post_votes_user_id ON post_votes(user_id);

-- 투표 처리 함수 생성
CREATE OR REPLACE FUNCTION handle_post_vote(
  p_post_id UUID,
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
    DELETE FROM post_votes 
    WHERE post_id = p_post_id AND user_id = p_user_id;
  ELSE
    -- 투표 추가 또는 업데이트
    INSERT INTO post_votes (post_id, user_id, vote_type)
    VALUES (p_post_id, p_user_id, p_vote_type)
    ON CONFLICT (post_id, user_id)
    DO UPDATE SET 
      vote_type = p_vote_type,
      updated_at = NOW();
  END IF;

  -- 게시글 카운트 업데이트
  UPDATE gallery_posts 
  SET 
    like_count = GREATEST(0, like_count + p_like_change),
    dislike_count = GREATEST(0, dislike_count + p_dislike_change),
    updated_at = NOW()
  WHERE id = p_post_id;
END;
$$ LANGUAGE plpgsql;

-- RLS 정책 설정
ALTER TABLE post_votes ENABLE ROW LEVEL SECURITY;

-- 사용자는 자신의 투표만 조회/수정 가능
CREATE POLICY "Users can view their own votes" ON post_votes
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own votes" ON post_votes
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own votes" ON post_votes
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own votes" ON post_votes
  FOR DELETE USING (auth.uid() = user_id);

-- 모든 사용자는 투표 통계 조회 가능
CREATE POLICY "Anyone can view vote counts" ON gallery_posts
  FOR SELECT USING (true);
