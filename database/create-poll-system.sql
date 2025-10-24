-- 투표 시스템 데이터베이스 스키마
-- 투표게시판 전용 투표 시스템

-- 투표 테이블
CREATE TABLE IF NOT EXISTS polls (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(255) NOT NULL,
  description TEXT,
  category VARCHAR(50) DEFAULT 'general', -- K-POP, K-Drama, 일반 등
  author_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE, -- 투표 마감일 (선택사항)
  is_active BOOLEAN DEFAULT true,
  allow_multiple BOOLEAN DEFAULT false, -- 다중 선택 허용 여부
  total_votes INTEGER DEFAULT 0
);

-- 투표 선택지 테이블
CREATE TABLE IF NOT EXISTS poll_options (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  poll_id UUID REFERENCES polls(id) ON DELETE CASCADE,
  option_text VARCHAR(255) NOT NULL,
  option_image_url TEXT, -- 선택지에 이미지 추가 가능
  vote_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 투표 참여 기록 테이블
CREATE TABLE IF NOT EXISTS poll_votes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  poll_id UUID REFERENCES polls(id) ON DELETE CASCADE,
  option_id UUID REFERENCES poll_options(id) ON DELETE CASCADE,
  voter_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  voted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(poll_id, voter_id) -- 한 사용자는 한 투표에 한 번만 참여 가능
);

-- 투표 댓글 테이블 (선택사항)
CREATE TABLE IF NOT EXISTS poll_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  poll_id UUID REFERENCES polls(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_polls_category ON polls(category);
CREATE INDEX IF NOT EXISTS idx_polls_author ON polls(author_id);
CREATE INDEX IF NOT EXISTS idx_polls_created_at ON polls(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_poll_options_poll_id ON poll_options(poll_id);
CREATE INDEX IF NOT EXISTS idx_poll_votes_poll_id ON poll_votes(poll_id);
CREATE INDEX IF NOT EXISTS idx_poll_votes_voter_id ON poll_votes(voter_id);
CREATE INDEX IF NOT EXISTS idx_poll_comments_poll_id ON poll_comments(poll_id);

-- 투표 개수 업데이트 트리거 함수
CREATE OR REPLACE FUNCTION update_poll_vote_counts()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    -- 투표 옵션의 투표 수 증가
    UPDATE poll_options 
    SET vote_count = vote_count + 1 
    WHERE id = NEW.option_id;
    
    -- 투표의 총 투표 수 증가
    UPDATE polls 
    SET total_votes = total_votes + 1 
    WHERE id = NEW.poll_id;
    
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    -- 투표 옵션의 투표 수 감소
    UPDATE poll_options 
    SET vote_count = vote_count - 1 
    WHERE id = OLD.option_id;
    
    -- 투표의 총 투표 수 감소
    UPDATE polls 
    SET total_votes = total_votes - 1 
    WHERE id = OLD.poll_id;
    
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- 트리거 생성
CREATE TRIGGER trigger_update_poll_vote_counts
  AFTER INSERT OR DELETE ON poll_votes
  FOR EACH ROW
  EXECUTE FUNCTION update_poll_vote_counts();

-- RLS (Row Level Security) 정책 설정
ALTER TABLE polls ENABLE ROW LEVEL SECURITY;
ALTER TABLE poll_options ENABLE ROW LEVEL SECURITY;
ALTER TABLE poll_votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE poll_comments ENABLE ROW LEVEL SECURITY;

-- 투표 조회 정책 (모든 사용자가 읽기 가능)
CREATE POLICY "Anyone can view polls" ON polls
  FOR SELECT USING (true);

CREATE POLICY "Anyone can view poll options" ON poll_options
  FOR SELECT USING (true);

CREATE POLICY "Anyone can view poll votes" ON poll_votes
  FOR SELECT USING (true);

CREATE POLICY "Anyone can view poll comments" ON poll_comments
  FOR SELECT USING (true);

-- 투표 생성 정책 (인증된 사용자만 생성 가능)
CREATE POLICY "Authenticated users can create polls" ON polls
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can create poll options" ON poll_options
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- 투표 참여 정책 (인증된 사용자만 투표 가능)
CREATE POLICY "Authenticated users can vote" ON poll_votes
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- 투표 수정/삭제 정책 (작성자만 가능)
CREATE POLICY "Users can update own polls" ON polls
  FOR UPDATE USING (auth.uid() = author_id);

CREATE POLICY "Users can delete own polls" ON polls
  FOR DELETE USING (auth.uid() = author_id);

CREATE POLICY "Users can update own poll options" ON poll_options
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM polls 
      WHERE polls.id = poll_options.poll_id 
      AND polls.author_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete own poll options" ON poll_options
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM polls 
      WHERE polls.id = poll_options.poll_id 
      AND polls.author_id = auth.uid()
    )
  );

-- 댓글 정책
CREATE POLICY "Authenticated users can create poll comments" ON poll_comments
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Users can update own poll comments" ON poll_comments
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own poll comments" ON poll_comments
  FOR DELETE USING (auth.uid() = user_id);

-- 업데이트 시간 자동 갱신 함수
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 업데이트 시간 트리거
CREATE TRIGGER trigger_update_polls_updated_at
  BEFORE UPDATE ON polls
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_update_poll_comments_updated_at
  BEFORE UPDATE ON poll_comments
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- 샘플 데이터 삽입 (테스트용)
INSERT INTO polls (title, description, category, author_id, expires_at) VALUES
('가장 좋아하는 K-POP 그룹은?', '여러분이 가장 좋아하는 K-POP 그룹에 투표해주세요!', 'K-POP', (SELECT id FROM auth.users LIMIT 1), NOW() + INTERVAL '7 days'),
('이번 달 가장 기대되는 K-Drama는?', '새로 시작하는 K-Drama 중에서 가장 기대되는 작품을 골라주세요.', 'K-Drama', (SELECT id FROM auth.users LIMIT 1), NOW() + INTERVAL '5 days');

-- 샘플 투표 선택지
INSERT INTO poll_options (poll_id, option_text) VALUES
((SELECT id FROM polls WHERE title = '가장 좋아하는 K-POP 그룹은?'), 'BTS'),
((SELECT id FROM polls WHERE title = '가장 좋아하는 K-POP 그룹은?'), 'BLACKPINK'),
((SELECT id FROM polls WHERE title = '가장 좋아하는 K-POP 그룹은?'), 'NewJeans'),
((SELECT id FROM polls WHERE title = '가장 좋아하는 K-POP 그룹은?'), 'ITZY'),
((SELECT id FROM polls WHERE title = '가장 좋아하는 K-POP 그룹은?'), 'aespa'),
((SELECT id FROM polls WHERE title = '이번 달 가장 기대되는 K-Drama는?'), '더 글로리 시즌2'),
((SELECT id FROM polls WHERE title = '이번 달 가장 기대되는 K-Drama는?'), '사랑의 불시착2'),
((SELECT id FROM polls WHERE title = '이번 달 가장 기대되는 K-Drama는?'), '오징어 게임2'),
((SELECT id FROM polls WHERE title = '이번 달 가장 기대되는 K-Drama는?'), '기타');

COMMENT ON TABLE polls IS '투표게시판의 투표 정보를 저장하는 테이블';
COMMENT ON TABLE poll_options IS '투표의 선택지 정보를 저장하는 테이블';
COMMENT ON TABLE poll_votes IS '사용자의 투표 참여 기록을 저장하는 테이블';
COMMENT ON TABLE poll_comments IS '투표에 대한 댓글을 저장하는 테이블';