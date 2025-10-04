-- Supabase Storage 설정 스크립트
-- 이미지 업로드를 위한 Storage 버킷 생성

-- Storage 버킷 생성 (이미지용)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'images',
  'images',
  true,
  5242880, -- 5MB 제한
  ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp']
) ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = 5242880,
  allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp'];

-- Storage 정책 설정
-- 모든 사용자가 이미지를 읽을 수 있음
CREATE POLICY "이미지 읽기 허용" ON storage.objects
FOR SELECT USING (bucket_id = 'images');

-- 인증된 사용자만 이미지를 업로드할 수 있음
CREATE POLICY "이미지 업로드 허용" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'images' 
  AND auth.role() = 'authenticated'
);

-- 사용자는 자신이 업로드한 이미지만 삭제할 수 있음
CREATE POLICY "이미지 삭제 허용" ON storage.objects
FOR DELETE USING (
  bucket_id = 'images' 
  AND auth.role() = 'authenticated'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- RLS 활성화
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- 기존 Storage 정책이 있다면 삭제 후 재생성
DROP POLICY IF EXISTS "이미지 읽기 허용" ON storage.objects;
DROP POLICY IF EXISTS "이미지 업로드 허용" ON storage.objects;
DROP POLICY IF EXISTS "이미지 삭제 허용" ON storage.objects;

-- 새 정책 생성
CREATE POLICY "이미지 읽기 허용" ON storage.objects
FOR SELECT USING (bucket_id = 'images');

CREATE POLICY "이미지 업로드 허용" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'images' 
  AND auth.role() = 'authenticated'
);

CREATE POLICY "이미지 삭제 허용" ON storage.objects
FOR DELETE USING (
  bucket_id = 'images' 
  AND auth.role() = 'authenticated'
  AND auth.uid()::text = (storage.foldername(name))[1]
);
