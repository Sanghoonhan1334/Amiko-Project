# Supabase 설정 가이드

## 1. 환경변수 설정
프로젝트 루트에 `.env.local` 파일을 생성하고 다음 내용을 추가하세요:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
```

## 2. Supabase Storage 버킷 생성
Supabase 대시보드에서 다음 단계를 따라하세요:

1. **Storage** 섹션으로 이동
2. **New bucket** 클릭
3. 버킷 이름: `news-images`
4. **Public bucket** 체크 (공개 접근 허용)
5. **Create bucket** 클릭

## 3. Storage 정책 설정
버킷 생성 후 다음 정책을 추가하세요:

### 업로드 정책 (INSERT)
```sql
CREATE POLICY "Allow public uploads" ON storage.objects
FOR INSERT WITH CHECK (bucket_id = 'news-images');
```

### 읽기 정책 (SELECT)
```sql
CREATE POLICY "Allow public reads" ON storage.objects
FOR SELECT USING (bucket_id = 'news-images');
```

## 4. 파일 크기 제한 설정
Supabase 대시보드에서:
1. **Settings** → **API** 이동
2. **File size limit** 설정 (권장: 50MB)

## 5. 테스트
환경변수 설정 후 뉴스 작성에서 이미지 업로드를 테스트해보세요.
