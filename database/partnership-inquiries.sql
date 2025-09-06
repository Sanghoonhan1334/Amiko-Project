-- 제휴 문의 테이블 생성
CREATE TABLE IF NOT EXISTS partnership_inquiries (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  company_name VARCHAR(255) NOT NULL,
  representative_name VARCHAR(100) NOT NULL,
  position VARCHAR(100) NOT NULL,
  email VARCHAR(255) NOT NULL,
  phone VARCHAR(50) NOT NULL,
  business_field VARCHAR(100) NOT NULL,
  company_size VARCHAR(50) NOT NULL,
  partnership_type VARCHAR(100) NOT NULL,
  budget VARCHAR(50) NOT NULL,
  expected_effect TEXT,
  message TEXT NOT NULL,
  attachment_url TEXT,
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'reviewing', 'approved', 'rejected', 'completed')),
  admin_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_partnership_inquiries_status ON partnership_inquiries(status);
CREATE INDEX IF NOT EXISTS idx_partnership_inquiries_created_at ON partnership_inquiries(created_at);
CREATE INDEX IF NOT EXISTS idx_partnership_inquiries_email ON partnership_inquiries(email);

-- RLS (Row Level Security) 활성화
ALTER TABLE partnership_inquiries ENABLE ROW LEVEL SECURITY;

-- 관리자만 모든 제휴 문의를 조회할 수 있도록 정책 설정
CREATE POLICY "관리자는 모든 제휴 문의 조회 가능" ON partnership_inquiries
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'admin'
    )
  );

-- 관리자만 제휴 문의를 업데이트할 수 있도록 정책 설정
CREATE POLICY "관리자는 제휴 문의 업데이트 가능" ON partnership_inquiries
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'admin'
    )
  );

-- 모든 사용자가 제휴 문의를 생성할 수 있도록 정책 설정
CREATE POLICY "모든 사용자는 제휴 문의 생성 가능" ON partnership_inquiries
  FOR INSERT WITH CHECK (true);

-- 첨부파일 저장을 위한 Storage 버킷 생성 (수동으로 실행 필요)
-- INSERT INTO storage.buckets (id, name, public) VALUES ('partnership-attachments', 'partnership-attachments', true);

-- Storage 정책 설정 (수동으로 실행 필요)
-- CREATE POLICY "제휴 문의 첨부파일 업로드 허용" ON storage.objects
--   FOR INSERT WITH CHECK (bucket_id = 'partnership-attachments');

-- CREATE POLICY "제휴 문의 첨부파일 다운로드 허용" ON storage.objects
--   FOR SELECT USING (bucket_id = 'partnership-attachments');

-- 업데이트 시간 자동 갱신을 위한 트리거 함수
CREATE OR REPLACE FUNCTION update_partnership_inquiries_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 트리거 생성
CREATE TRIGGER update_partnership_inquiries_updated_at
  BEFORE UPDATE ON partnership_inquiries
  FOR EACH ROW
  EXECUTE FUNCTION update_partnership_inquiries_updated_at();

-- 댓글: 이 스크립트를 실행한 후 Supabase 대시보드에서 다음을 수동으로 실행해야 합니다:
-- 1. Storage > Create Bucket: 'partnership-attachments' (Public: true)
-- 2. Storage > Policies에서 위의 Storage 정책들을 추가
