# YouTube API 설정 가이드

AMIKO 홈탭에 YouTube 채널의 최신 영상을 자동으로 표시하기 위한 YouTube Data API v3 설정 가이드입니다.

---

## 📋 목차
1. [API 키 발급](#1-api-키-발급)
2. [환경 변수 설정](#2-환경-변수-설정)
3. [테스트](#3-테스트)
4. [할당량 관리](#4-할당량-관리)

---

## 1. API 키 발급

### 1️⃣ Google Cloud Console 접속
```
https://console.cloud.google.com/
```

### 2️⃣ 프로젝트 생성 (또는 기존 프로젝트 선택)
- 왼쪽 상단 프로젝트 선택 드롭다운 클릭
- "새 프로젝트" 클릭
- 프로젝트 이름: `AMIKO-Project` (또는 원하는 이름)

### 3️⃣ YouTube Data API v3 활성화
```
1. 왼쪽 메뉴: "API 및 서비스" → "라이브러리"
2. 검색창에 "YouTube Data API v3" 입력
3. "YouTube Data API v3" 클릭
4. "사용" 버튼 클릭
```

### 4️⃣ API 키 생성
```
1. 왼쪽 메뉴: "API 및 서비스" → "사용자 인증 정보"
2. 상단 "+ 사용자 인증 정보 만들기" 클릭
3. "API 키" 선택
4. API 키가 생성됨 (예: AIzaSyC...)
```

### 5️⃣ API 키 제한 설정 (선택사항, 보안 강화)
```
1. 생성된 API 키 옆 연필 아이콘 클릭
2. "API 제한사항" 섹션에서:
   - "키 제한" 선택
   - "YouTube Data API v3"만 체크
3. "애플리케이션 제한사항"에서:
   - "HTTP 리퍼러 (웹사이트)" 선택
   - 허용할 도메인 추가:
     * localhost:3000/*
     * yourdomain.com/*
4. "저장" 클릭
```

---

## 2. 환경 변수 설정

### 개발 환경 (.env.local)

프로젝트 루트에 `.env.local` 파일을 생성하거나 열고, 다음 라인을 추가:

```env
# YouTube Data API v3
NEXT_PUBLIC_YOUTUBE_API_KEY=여기에_발급받은_API_키_입력

# 예시:
# NEXT_PUBLIC_YOUTUBE_API_KEY=AIzaSyC1234567890abcdefghijklmnopqrstuvwx
```

### 프로덕션 환경 (Vercel)

Vercel 대시보드에서 환경 변수 추가:

```
1. Vercel 프로젝트 선택
2. Settings → Environment Variables
3. 새 변수 추가:
   - Name: NEXT_PUBLIC_YOUTUBE_API_KEY
   - Value: (발급받은 API 키)
   - Environment: Production, Preview, Development (모두 체크)
4. Save
5. 재배포 필요
```

---

## 3. 테스트

### 로컬 개발 서버 재시작
```bash
# 서버 중지 (Ctrl + C)
# .env.local 파일 저장 후
npm run dev
```

### 브라우저 콘솔 확인
```
F12 → Console 탭

예상 로그:
🎥 [홈탭] YouTube 영상 로딩 시작...
🎥 [홈탭] YouTube 영상 로드 완료: 6 개
```

### 홈탭 확인
- "Videos Recientes de AMIKO" 섹션에 최신 영상 2개 표시
- 썸네일, 제목, 영상 길이 자동 표시
- 클릭 시 YouTube에서 새 탭으로 영상 재생
- 호버 시 빨간 재생 버튼 표시

---

## 4. 할당량 관리

### YouTube Data API v3 할당량
- **일일 할당량**: 10,000 units (무료)
- **Search.list**: 100 units per request
- **Videos.list**: 1 unit per request

### 현재 구현 사용량
```
1회 로드당 사용량:
- Search.list (최신 영상 6개): 100 units
- Videos.list (6개 상세): 1 unit
총: 101 units per 홈탭 로드
```

### 일일 예상 사용량
```
10,000 units ÷ 101 units = 약 99회 로드 가능

실제로는:
- 캐싱으로 API 호출 최소화
- 페이지 로드 시에만 호출
- 일일 수백~수천 명 접속 가능
```

### 할당량 초과 시 대응
1. **캐싱 추가** (추천):
   - API 응답을 서버에 캐시 (5분~1시간)
   - 모든 사용자가 같은 결과 공유
   
2. **요청 빈도 조정**:
   - maxResults를 6 → 4로 감소
   
3. **할당량 증가 요청**:
   - Google Cloud Console에서 증가 요청 가능
   - 유료 플랜 고려

---

## 5. 채널 정보

### AMIKO 공식 채널
- **URL**: https://www.youtube.com/@AMIKO_Officialstudio
- **채널 ID**: UCyOu_9LYOcDwzHLWW_MTXIQ
- **로드 영상 수**: 최대 6개 (홈탭에는 2개 표시)

---

## 🚨 문제 해결

### API 키가 작동하지 않는 경우
1. API 키 제한 설정 확인 (HTTP 리퍼러, API 제한)
2. YouTube Data API v3가 활성화되었는지 확인
3. 브라우저 콘솔에서 에러 메시지 확인
4. 개발 서버 재시작

### 영상이 표시되지 않는 경우
```javascript
// 브라우저 콘솔에서 디버깅:
localStorage.clear()
location.reload()
```

### 할당량 초과 시
```
Error: YouTube API 오류: 403
→ 일일 할당량 초과
→ 다음 날 자정(PST)에 리셋됨
```

---

## 📚 참고 문서

- [YouTube Data API v3 문서](https://developers.google.com/youtube/v3)
- [할당량 계산기](https://developers.google.com/youtube/v3/determine_quota_cost)
- [API 키 Best Practices](https://cloud.google.com/docs/authentication/api-keys)

---

## ✅ 체크리스트

- [ ] Google Cloud Console에서 프로젝트 생성
- [ ] YouTube Data API v3 활성화
- [ ] API 키 발급
- [ ] API 키 제한 설정 (선택)
- [ ] `.env.local`에 `NEXT_PUBLIC_YOUTUBE_API_KEY` 추가
- [ ] 개발 서버 재시작
- [ ] 홈탭에서 영상 표시 확인
- [ ] Vercel 환경 변수 설정 (프로덕션 배포 전)

---

## 🎯 완료!

설정이 완료되면 AMIKO 홈탭에 YouTube 채널의 최신 영상이 자동으로 표시됩니다! 🎥✨

