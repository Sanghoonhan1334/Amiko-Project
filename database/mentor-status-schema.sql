-- 멘토 상태 관리 시스템 스키마

-- 멘토 테이블 (기본 정보)
CREATE TABLE IF NOT EXISTS mentors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  avatar_url TEXT,
  is_korean BOOLEAN DEFAULT false,
  specialties TEXT[] DEFAULT '{}',
  bio TEXT,
  experience_years INTEGER DEFAULT 0,
  rating DECIMAL(3,2) DEFAULT 0.0,
  total_sessions INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 멘토 상태 테이블
CREATE TABLE IF NOT EXISTS mentor_status (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  mentor_id UUID REFERENCES mentors(id) ON DELETE CASCADE,
  status VARCHAR(20) NOT NULL CHECK (status IN ('online', 'busy', 'offline')),
  is_active BOOLEAN DEFAULT true,
  last_activity TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  current_session_id UUID,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(mentor_id)
);

-- 멘토 세션 테이블 (상담 세션 추적)
CREATE TABLE IF NOT EXISTS mentor_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  mentor_id UUID REFERENCES mentors(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  session_type VARCHAR(50) NOT NULL CHECK (session_type IN ('video_call', 'chat', 'consultation')),
  status VARCHAR(20) NOT NULL CHECK (status IN ('active', 'completed', 'cancelled')),
  started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  ended_at TIMESTAMP WITH TIME ZONE,
  duration_minutes INTEGER DEFAULT 0,
  notes TEXT,
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  feedback TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 멘토 상태 변경 로그 테이블
CREATE TABLE IF NOT EXISTS mentor_status_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  mentor_id UUID REFERENCES mentors(id) ON DELETE CASCADE,
  previous_status VARCHAR(20),
  new_status VARCHAR(20) NOT NULL,
  changed_by UUID REFERENCES auth.users(id),
  reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_mentor_status_mentor_id ON mentor_status(mentor_id);
CREATE INDEX IF NOT EXISTS idx_mentor_status_status ON mentor_status(status);
CREATE INDEX IF NOT EXISTS idx_mentor_status_active ON mentor_status(is_active);
CREATE INDEX IF NOT EXISTS idx_mentor_sessions_mentor_id ON mentor_sessions(mentor_id);
CREATE INDEX IF NOT EXISTS idx_mentor_sessions_user_id ON mentor_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_mentor_sessions_status ON mentor_sessions(status);
CREATE INDEX IF NOT EXISTS idx_mentor_status_logs_mentor_id ON mentor_status_logs(mentor_id);
CREATE INDEX IF NOT EXISTS idx_mentor_status_logs_created_at ON mentor_status_logs(created_at);

-- RLS (Row Level Security) 정책
ALTER TABLE mentors ENABLE ROW LEVEL SECURITY;
ALTER TABLE mentor_status ENABLE ROW LEVEL SECURITY;
ALTER TABLE mentor_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE mentor_status_logs ENABLE ROW LEVEL SECURITY;

-- 멘토 테이블 정책
CREATE POLICY "멘토 정보는 모든 사용자가 조회 가능" ON mentors
  FOR SELECT USING (true);

CREATE POLICY "멘토는 자신의 정보만 수정 가능" ON mentors
  FOR UPDATE USING (auth.uid() = id);

-- 멘토 상태 테이블 정책
CREATE POLICY "멘토 상태는 모든 사용자가 조회 가능" ON mentor_status
  FOR SELECT USING (true);

CREATE POLICY "멘토는 자신의 상태만 수정 가능" ON mentor_status
  FOR UPDATE USING (auth.uid() = mentor_id);

CREATE POLICY "멘토는 자신의 상태만 삽입 가능" ON mentor_status
  FOR INSERT WITH CHECK (auth.uid() = mentor_id);

-- 멘토 세션 테이블 정책
CREATE POLICY "사용자는 자신의 세션만 조회 가능" ON mentor_sessions
  FOR SELECT USING (auth.uid() = user_id OR auth.uid() = mentor_id);

CREATE POLICY "멘토는 자신의 세션만 수정 가능" ON mentor_sessions
  FOR UPDATE USING (auth.uid() = mentor_id);

CREATE POLICY "사용자는 세션 생성 가능" ON mentor_sessions
  FOR INSERT WITH CHECK (auth.uid() = user_id OR auth.uid() = mentor_id);

-- 멘토 상태 로그 테이블 정책
CREATE POLICY "멘토 상태 로그는 모든 사용자가 조회 가능" ON mentor_status_logs
  FOR SELECT USING (true);

CREATE POLICY "시스템만 로그 삽입 가능" ON mentor_status_logs
  FOR INSERT WITH CHECK (true);

-- 트리거 함수: 멘토 상태 변경 시 로그 생성
CREATE OR REPLACE FUNCTION log_mentor_status_change()
RETURNS TRIGGER AS $$
BEGIN
  -- 상태가 변경된 경우에만 로그 생성
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    INSERT INTO mentor_status_logs (
      mentor_id,
      previous_status,
      new_status,
      changed_by,
      reason
    ) VALUES (
      NEW.mentor_id,
      OLD.status,
      NEW.status,
      auth.uid(),
      'Status changed via API'
    );
  END IF;
  
  -- updated_at 자동 업데이트
  NEW.updated_at = NOW();
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 트리거 생성
CREATE TRIGGER mentor_status_change_trigger
  BEFORE UPDATE ON mentor_status
  FOR EACH ROW
  EXECUTE FUNCTION log_mentor_status_change();

-- 트리거 함수: 멘토 세션 상태 변경 시 멘토 상태 업데이트
CREATE OR REPLACE FUNCTION update_mentor_status_on_session_change()
RETURNS TRIGGER AS $$
BEGIN
  -- 세션이 시작되면 멘토 상태를 'busy'로 변경
  IF NEW.status = 'active' AND OLD.status != 'active' THEN
    UPDATE mentor_status 
    SET status = 'busy', 
        current_session_id = NEW.id,
        updated_at = NOW()
    WHERE mentor_id = NEW.mentor_id;
  END IF;
  
  -- 세션이 종료되면 멘토 상태를 'online'으로 변경
  IF NEW.status IN ('completed', 'cancelled') AND OLD.status = 'active' THEN
    UPDATE mentor_status 
    SET status = 'online', 
        current_session_id = NULL,
        updated_at = NOW()
    WHERE mentor_id = NEW.mentor_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 트리거 생성
CREATE TRIGGER mentor_session_status_trigger
  AFTER UPDATE ON mentor_sessions
  FOR EACH ROW
  EXECUTE FUNCTION update_mentor_status_on_session_change();

-- 샘플 데이터 삽입
INSERT INTO mentors (id, name, email, is_korean, specialties, bio, experience_years, rating, total_sessions) VALUES
  ('550e8400-e29b-41d4-a716-446655440001', '김멘토', 'kim.mentor@amiko.com', true, ARRAY['한국어', '문화', '여행'], '한국 문화 전문가로 5년간 멘토링 경험', 5, 4.8, 120),
  ('550e8400-e29b-41d4-a716-446655440002', '이멘토', 'lee.mentor@amiko.com', true, ARRAY['비즈니스', '언어교환'], '비즈니스 한국어 전문 멘토', 3, 4.6, 85),
  ('550e8400-e29b-41d4-a716-446655440003', '박멘토', 'park.mentor@amiko.com', true, ARRAY['음식', '라이프스타일'], '한국 음식과 라이프스타일 전문가', 4, 4.9, 95)
ON CONFLICT (email) DO NOTHING;

-- 샘플 멘토 상태 데이터
INSERT INTO mentor_status (mentor_id, status, is_active) VALUES
  ('550e8400-e29b-41d4-a716-446655440001', 'online', true),
  ('550e8400-e29b-41d4-a716-446655440002', 'busy', true),
  ('550e8400-e29b-41d4-a716-446655440003', 'offline', true)
ON CONFLICT (mentor_id) DO NOTHING;
