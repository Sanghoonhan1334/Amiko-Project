# FanZone 테스트 체크리스트

## ✅ 확인사항

### 1. 브라우저에서 확인
```
URL: http://localhost:3000/community/fanzone
```

**예상 결과:**
- ✅ 10개의 FanRoom이 표시됨
- ✅ "En llamas 🔥" 섹션에 트렌딩 FanRoom 표시
- ✅ "Descubre comunidades" 섹션에 모든 FanRoom 표시
- ✅ 각 FanRoom 카드에 이미지, 이름, 설명, 멤버 수 표시
- ✅ 국가 필터 작동 (LATAM, México, Perú 등)
- ✅ 카테고리 필터 작동 (K-Pop, K-Drama 등)

### 2. 터미널에서 API 테스트
```bash
# 개발 서버가 실행 중인 상태에서
node scripts/test-fanzone-api.js
```

**예상 결과:**
- ✅ 기본 리스트 조회 성공
- ✅ 트렌딩 필터 작동
- ✅ 카테고리 필터 작동
- ✅ 검색 기능 작동
- ✅ 국가별 필터 작동

## 🐛 문제 해결

### 문제 1: "No hay comunidades disponibles" 메시지 표시
**원인:** 데이터베이스에 데이터가 없음

**해결:**
1. Supabase Dashboard 접속
2. SQL Editor 열기
3. `database/seed-fanzone-test-data.sql` 파일 내용 복사
4. 실행
5. 데이터 확인: `SELECT * FROM fanrooms;`

### 문제 2: API 오류 발생
**원인:** RLS 정책 문제 또는 권한 문제

**해결:**
1. Supabase에서 RLS 확인
2. `fanzone-regional-schema.sql` 다시 실행
3. 브라우저 콘솔에서 에러 확인

### 문제 3: 이미지가 표시되지 않음
**원인:** cover_image 필드가 NULL

**해결:**
- 정상 동작 (테스트 데이터에는 이미지 URL 없음)
- 첫 글자로 대체 이미지 표시되어야 함

### 문제 4: 멤버 수가 0으로 표시됨
**원인:** member_count가 1로 설정되어야 함

**해결:**
1. 데이터 확인: `SELECT member_count FROM fanrooms;`
2. 트리거 확인: member_count 자동 업데이트됨

## 📊 데이터 확인 쿼리

### 모든 FanRoom 조회
```sql
SELECT 
  id,
  name,
  slug,
  category,
  country,
  member_count,
  is_trending,
  is_featured,
  created_at
FROM fanrooms
ORDER BY created_at DESC;
```

### 멤버 수 확인
```sql
SELECT 
  name,
  member_count,
  active_members
FROM fanrooms;
```

### 트렌딩 FanRoom 확인
```sql
SELECT 
  name,
  is_trending,
  trending_score
FROM fanrooms
WHERE is_trending = true
ORDER BY trending_score DESC;
```

## 🎯 성공 기준

다음 항목이 모두 체크되면 성공입니다:

- [ ] 10개의 FanRoom이 브라우저에 표시됨
- [ ] 트렌딩 FanRoom이 "En llamas" 섹션에 표시됨
- [ ] 필터 기능이 작동함 (국가, 카테고리)
- [ ] 검색 기능이 작동함
- [ ] 각 FanRoom 카드 클릭 시 상세 페이지로 이동
- [ ] 로딩 중 skeleton이 표시됨
- [ ] 빈 상태(empty state)가 데이터 없을 때 표시됨

## 🚀 다음 단계

모든 테스트가 통과되면:

1. ✅ 목업 데이터 제거 완료
2. ✅ 실제 데이터베이스 연결 완료
3. ✅ 기본 CRUD 기능 작동 확인
4. ⏳ 상세 페이지 구현 (Posts, Media, Chat, Members)
5. ⏳ 실시간 기능 구현 (Supabase Realtime)
6. ⏳ 이미지 업로드 기능 구현

