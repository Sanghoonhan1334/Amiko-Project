# FanZone 디버깅 가이드

## 🔍 현재 상황

코드는 실제 API를 호출하도록 구현되어 있지만, 데이터가 목업처럼 보일 수 있습니다.

## ✅ 확인 방법

### 1. 브라우저 개발자 도구 열기
- Mac: `Cmd + Option + J`
- Windows: `F12` 또는 `Ctrl + Shift + J`

### 2. 콘솔 탭 확인
다음 로그가 보여야 합니다:
```
📦 Loaded fanrooms: {success: true, fanrooms: [...], pagination: {...}}
```

### 3. 네트워크 탭 확인
`/api/fanzone/list` 요청을 찾아서:
- 상태 코드 확인 (200 OK인지)
- 응답 데이터 확인 (실제 DB 데이터인지)

### 4. 실제 데이터 확인
응답 데이터를 확인했을 때:
- **목업 데이터**: 멤버 수가 1250, 890 등 큰 숫자
- **실제 DB 데이터**: 멤버 수가 1 (초기값)

## 🐛 문제 해결

### 문제 1: 콘솔에 로그가 없음
**원인:** 컴포넌트가 마운트되지 않았거나 API 호출이 실패

**해결:**
1. 페이지 새로고침
2. 브라우저 콘솔에서 에러 확인
3. 네트워크 탭에서 요청 확인

### 문제 2: 네트워크 요청이 없음
**원인:** API 호출 코드가 실행되지 않음

**해결:**
```bash
# 코드 확인
cat src/components/main/app/community/fanzone/FanZoneHome.tsx | grep -A 20 "loadFanrooms"
```

### 문제 3: 응답이 에러
**원인:** RLS 정책 또는 데이터베이스 접근 문제

**해결:**
1. Supabase Dashboard 확인
2. RLS 정책 확인
3. 데이터 존재 확인: `SELECT * FROM fanrooms;`

## 🎯 실제 데이터 확인 방법

### Supabase에서 직접 확인
```sql
SELECT 
  name,
  slug,
  member_count,
  is_trending,
  created_at
FROM fanrooms
ORDER BY created_at DESC;
```

### API로 직접 테스트
```bash
curl "http://localhost:3000/api/fanzone/list?country=latam&limit=10"
```

## 📊 예상 결과

### 목업 데이터 (제거해야 함)
```json
{
  "name": "BTS Army México",
  "memberCount": 1250,
  "coverImage": "https://images.unsplash.com/..."
}
```

### 실제 DB 데이터 (현재)
```json
{
  "name": "BTS Army México",
  "member_count": 1,
  "cover_image": null
}
```

## ✅ 최종 확인

브라우저 콘솔에서 확인할 수 있는 것:
1. `📦 Loaded fanrooms:` 로그가 있음
2. 응답에 `success: true` 포함
3. `fanrooms` 배열에 데이터 있음
4. 각 FanRoom의 `member_count`가 1

위 사항이 모두 확인되면 실제 데이터를 사용하고 있는 것입니다!

