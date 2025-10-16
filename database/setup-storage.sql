-- Supabase Storage 설정
-- 이 스크립트는 Supabase SQL Editor에서 실행하세요

-- 1. profile-images 버킷 생성 (이미 있다면 생략)
INSERT INTO storage.buckets (id, name, public)
VALUES ('profile-images', 'profile-images', true)
ON CONFLICT (id) DO NOTHING;

-- 2. 프로필 이미지 업로드 정책 설정
CREATE POLICY "사용자는 자신의 프로필 이미지를 업로드할 수 있음" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'profile-images' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- 3. 프로필 이미지 조회 정책 설정
CREATE POLICY "모든 사용자는 프로필 이미지를 조회할 수 있음" ON storage.objects
FOR SELECT USING (bucket_id = 'profile-images');

-- 4. 프로필 이미지 업데이트 정책 설정
CREATE POLICY "사용자는 자신의 프로필 이미지를 업데이트할 수 있음" ON storage.objects
FOR UPDATE USING (
  bucket_id = 'profile-images' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- 5. 프로필 이미지 삭제 정책 설정
CREATE POLICY "사용자는 자신의 프로필 이미지를 삭제할 수 있음" ON storage.objects
FOR DELETE USING (
  bucket_id = 'profile-images' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);