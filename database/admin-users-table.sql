-- 운영진 사용자 테이블 생성
CREATE TABLE IF NOT EXISTS admin_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  email VARCHAR(255) UNIQUE NOT NULL,
  role VARCHAR(50) NOT NULL DEFAULT 'admin', -- admin, super_admin, news_manager 등
  permissions JSONB DEFAULT '{}', -- 세부 권한 설정
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  is_active BOOLEAN DEFAULT true
);

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_admin_users_user_id ON admin_users(user_id);
CREATE INDEX IF NOT EXISTS idx_admin_users_email ON admin_users(email);
CREATE INDEX IF NOT EXISTS idx_admin_users_role ON admin_users(role);
CREATE INDEX IF NOT EXISTS idx_admin_users_active ON admin_users(is_active);

-- RLS 정책 설정
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;

-- 운영진만 자신의 정보 조회 가능
CREATE POLICY "Admin users can view their own info" ON admin_users
  FOR SELECT USING (auth.uid() = user_id);

-- 운영진만 모든 운영진 정보 조회 가능 (운영진 간 상호 확인)
CREATE POLICY "Admins can view all admin users" ON admin_users
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM admin_users 
      WHERE user_id = auth.uid() AND is_active = true
    )
  );

-- 운영진 추가/수정/삭제는 서비스 계정에서만 가능 (API를 통해서만)
CREATE POLICY "Only service account can modify admin users" ON admin_users
  FOR ALL USING (false);

-- 운영진 역할 정의
COMMENT ON COLUMN admin_users.role IS 'admin: 일반 운영진, super_admin: 최고 관리자, news_manager: 뉴스 관리자';

-- 권한 예시
COMMENT ON COLUMN admin_users.permissions IS 'JSON 형태로 세부 권한 저장. 예: {"news": {"create": true, "edit": true, "delete": true}, "users": {"view": true}}';

-- 초기 운영진 데이터 삽입 (실제 이메일로 교체 필요)
INSERT INTO admin_users (user_id, email, role, permissions) VALUES
  -- 실제 사용자 ID로 교체해야 함
  ('00000000-0000-0000-0000-000000000000', 'admin@helloamiko.com', 'super_admin', '{"all": true}'),
  ('00000000-0000-0000-0000-000000000001', 'info@helloamiko.com', 'admin', '{"news": {"create": true, "edit": true, "delete": true}}'),
  ('00000000-0000-0000-0000-000000000002', 'support@helloamiko.com', 'admin', '{"users": {"view": true, "support": true}}'),
  ('00000000-0000-0000-0000-000000000003', 'news@helloamiko.com', 'news_manager', '{"news": {"create": true, "edit": true, "delete": true}}')
ON CONFLICT (email) DO NOTHING;

-- 업데이트 시간 자동 갱신 함수
CREATE OR REPLACE FUNCTION update_admin_users_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 트리거 생성
CREATE TRIGGER trigger_update_admin_users_updated_at
  BEFORE UPDATE ON admin_users
  FOR EACH ROW
  EXECUTE FUNCTION update_admin_users_updated_at();
