-- 운영진 사용자 테이블 생성 (단계별 실행)

-- 1단계: 테이블 생성
CREATE TABLE IF NOT EXISTS admin_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  email VARCHAR(255) UNIQUE NOT NULL,
  role VARCHAR(50) NOT NULL DEFAULT 'admin',
  permissions JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  is_active BOOLEAN DEFAULT true
);

-- 2단계: 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_admin_users_user_id ON admin_users(user_id);
CREATE INDEX IF NOT EXISTS idx_admin_users_email ON admin_users(email);
CREATE INDEX IF NOT EXISTS idx_admin_users_role ON admin_users(role);
CREATE INDEX IF NOT EXISTS idx_admin_users_active ON admin_users(is_active);

-- 3단계: RLS 정책 설정
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;

-- 운영진만 자신의 정보 조회 가능
CREATE POLICY "Admin users can view their own info" ON admin_users
  FOR SELECT USING (auth.uid() = user_id);

-- 운영진만 모든 운영진 정보 조회 가능
CREATE POLICY "Admins can view all admin users" ON admin_users
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM admin_users 
      WHERE user_id = auth.uid() AND is_active = true
    )
  );

-- 운영진 추가/수정/삭제는 서비스 계정에서만 가능
CREATE POLICY "Only service account can modify admin users" ON admin_users
  FOR ALL USING (false);

-- 4단계: 업데이트 시간 자동 갱신 함수
CREATE OR REPLACE FUNCTION update_admin_users_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 5단계: 트리거 생성
CREATE TRIGGER trigger_update_admin_users_updated_at
  BEFORE UPDATE ON admin_users
  FOR EACH ROW
  EXECUTE FUNCTION update_admin_users_updated_at();

-- 6단계: 테이블 생성 확인
SELECT 'admin_users 테이블이 성공적으로 생성되었습니다!' as message;
