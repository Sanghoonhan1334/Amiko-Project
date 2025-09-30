-- =====================================================
-- 인증 시스템 스키마 업데이트
-- Date: 2025-01-17
-- Description: 국적, 인증 상태, 세션 관리 테이블 추가
-- =====================================================

-- 1. users 테이블에 국적 및 인증 상태 컬럼 추가
DO $$ 
BEGIN
    -- nationality 컬럼이 없으면 추가
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'users' 
        AND column_name = 'nationality'
    ) THEN
        ALTER TABLE users ADD COLUMN nationality VARCHAR(2);
    END IF;
    
    -- is_email_verified 컬럼이 없으면 추가
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'users' 
        AND column_name = 'is_email_verified'
    ) THEN
        ALTER TABLE users ADD COLUMN is_email_verified BOOLEAN DEFAULT false;
    END IF;
    
    -- is_phone_verified 컬럼이 없으면 추가
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'users' 
        AND column_name = 'is_phone_verified'
    ) THEN
        ALTER TABLE users ADD COLUMN is_phone_verified BOOLEAN DEFAULT false;
    END IF;
    
    -- email_verified_at 컬럼이 없으면 추가
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'users' 
        AND column_name = 'email_verified_at'
    ) THEN
        ALTER TABLE users ADD COLUMN email_verified_at TIMESTAMP WITH TIME ZONE;
    END IF;
    
    -- phone_verified_at 컬럼이 없으면 추가
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'users' 
        AND column_name = 'phone_verified_at'
    ) THEN
        ALTER TABLE users ADD COLUMN phone_verified_at TIMESTAMP WITH TIME ZONE;
    END IF;
END $$;

-- 2. verification_codes 테이블 생성 (인증코드 영구 저장)
CREATE TABLE IF NOT EXISTS verification_codes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  email TEXT,
  phone TEXT,
  code VARCHAR(6) NOT NULL,
  type VARCHAR(20) NOT NULL, -- 'email', 'sms', 'whatsapp'
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  used_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- verification_codes 테이블 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_verification_codes_email ON verification_codes(email);
CREATE INDEX IF NOT EXISTS idx_verification_codes_phone ON verification_codes(phone);
CREATE INDEX IF NOT EXISTS idx_verification_codes_code ON verification_codes(code);
CREATE INDEX IF NOT EXISTS idx_verification_codes_expires_at ON verification_codes(expires_at);

-- 3. user_sessions 테이블 생성 (사용자 세션 관리)
CREATE TABLE IF NOT EXISTS user_sessions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  session_token VARCHAR(255) UNIQUE NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_accessed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- user_sessions 테이블 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_user_sessions_user_id ON user_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_sessions_token ON user_sessions(session_token);
CREATE INDEX IF NOT EXISTS idx_user_sessions_expires_at ON user_sessions(expires_at);

-- 4. user_activity_logs 테이블 생성 (사용자 활동 로그)
CREATE TABLE IF NOT EXISTS user_activity_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  activity_type VARCHAR(50) NOT NULL, -- 'login', 'signup', 'email_verify', 'sms_verify'
  activity_data JSONB,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- user_activity_logs 테이블 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_user_activity_logs_user_id ON user_activity_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_user_activity_logs_activity_type ON user_activity_logs(activity_type);
CREATE INDEX IF NOT EXISTS idx_user_activity_logs_created_at ON user_activity_logs(created_at);

-- 5. RLS (Row Level Security) 정책 설정

-- user_sessions 테이블 RLS 활성화
ALTER TABLE user_sessions ENABLE ROW LEVEL SECURITY;

-- 사용자는 자신의 세션만 볼 수 있음
CREATE POLICY "Users can view own sessions" ON user_sessions
  FOR SELECT USING (auth.uid() = user_id);

-- 사용자는 자신의 세션만 삽입할 수 있음
CREATE POLICY "Users can insert own sessions" ON user_sessions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 사용자는 자신의 세션만 업데이트할 수 있음
CREATE POLICY "Users can update own sessions" ON user_sessions
  FOR UPDATE USING (auth.uid() = user_id);

-- 사용자는 자신의 세션만 삭제할 수 있음
CREATE POLICY "Users can delete own sessions" ON user_sessions
  FOR DELETE USING (auth.uid() = user_id);

-- user_activity_logs 테이블 RLS 활성화
ALTER TABLE user_activity_logs ENABLE ROW LEVEL SECURITY;

-- 사용자는 자신의 활동 로그만 볼 수 있음
CREATE POLICY "Users can view own activity logs" ON user_activity_logs
  FOR SELECT USING (auth.uid() = user_id);

-- 사용자는 자신의 활동 로그만 삽입할 수 있음
CREATE POLICY "Users can insert own activity logs" ON user_activity_logs
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- verification_codes 테이블은 RLS 없음 (임시 데이터, 관리자용)

-- 6. 만료된 인증코드 자동 삭제 함수
CREATE OR REPLACE FUNCTION cleanup_expired_verification_codes()
RETURNS void AS $$
BEGIN
  DELETE FROM verification_codes 
  WHERE expires_at < NOW() 
  AND used_at IS NULL;
END;
$$ LANGUAGE plpgsql;

-- 7. 만료된 세션 자동 삭제 함수
CREATE OR REPLACE FUNCTION cleanup_expired_sessions()
RETURNS void AS $$
BEGIN
  DELETE FROM user_sessions 
  WHERE expires_at < NOW();
END;
$$ LANGUAGE plpgsql;

-- 8. 사용자 활동 로그 삽입 함수
CREATE OR REPLACE FUNCTION log_user_activity(
  p_user_id UUID,
  p_activity_type VARCHAR(50),
  p_activity_data JSONB DEFAULT NULL,
  p_ip_address INET DEFAULT NULL,
  p_user_agent TEXT DEFAULT NULL
)
RETURNS void AS $$
BEGIN
  INSERT INTO user_activity_logs (
    user_id, 
    activity_type, 
    activity_data, 
    ip_address, 
    user_agent
  ) VALUES (
    p_user_id, 
    p_activity_type, 
    p_activity_data, 
    p_ip_address, 
    p_user_agent
  );
END;
$$ LANGUAGE plpgsql;

-- 완료 메시지
DO $$
BEGIN
  RAISE NOTICE '인증 시스템 스키마 업데이트 완료!';
  RAISE NOTICE '- users 테이블에 국적 및 인증 상태 컬럼 추가';
  RAISE NOTICE '- verification_codes 테이블 생성';
  RAISE NOTICE '- user_sessions 테이블 생성';
  RAISE NOTICE '- user_activity_logs 테이블 생성';
  RAISE NOTICE '- RLS 정책 설정 완료';
  RAISE NOTICE '- 유틸리티 함수 생성 완료';
END $$;
