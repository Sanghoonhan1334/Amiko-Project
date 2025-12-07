# 🚀 Google Analytics 설정 단계별 가이드

## ⚡ 1단계: Google Analytics 계정 만들기 (5분)

### 1-1. Google Analytics 웹사이트 접속
👉 **https://analytics.google.com/** 클릭하여 접속

### 1-2. 로그인
- 구글 계정으로 로그인 (Gmail 계정 있으면 됩니다)
- 첫 방문이면 "측정 시작" 버튼 클릭

### 1-3. 계정 만들기
- **계정 이름**: `Amiko` (원하는 이름)
- **계정 데이터 공유 설정**: 모두 체크
- **다음** 클릭

### 1-4. 속성 만들기 (가장 중요!)
- **속성 이름**: `Amiko Website`
- **보고 시간대**: `대한민국 시간대 (GMT+09:00)`
- **화폐**: `KRW (원)`
- **다음** 클릭

### 1-5. 비즈니스 정보 입력
- **업종 카테고리**: `컬처 및 예술` 또는 `엔터테인먼트`
- **사업 규모**: `소규모` / `중규모` / `대규모` 중 선택
- **Google 서비스** 사용 목적: 원하는 것 체크 (광고, 측정 등)
- **만들기** 클릭

### 1-6. 약관 동의
- Google Analytics 약관 읽고 동의
- **동의함** 클릭

---

## 🎯 2단계: Measurement ID 받기 (2분)

### 2-1. 데이터 스트림 설정
창에서 "데이터 스트림 만들기" 화면이 보이면:

1. **웹** 클릭
2. **웹사이트 URL**: `https://www.helloamiko.com`
3. **스트림 이름**: `Amiko Main Website`
4. **스트림 만들기** 클릭

### 2-2. Measurement ID 복사
스크롤 다운하면 **측정 ID** 라는 항목이 보입니다

**형태**: `G-XXXXXXXXXX` (G-로 시작하는 글자와 숫자 조합)

👉 이 `G-XXXXXXXXXX` 전체를 복사하세요!

---

## ✅ 3단계: 코드에 Measurement ID 넣기 (1분)

### 3-1. 환경 변수 파일 열기
프로젝트 폴더에서 `.env.local` 파일을 열어주세요

### 3-2. Measurement ID 추가
`.env.local` 파일 맨 아래에 다음 한 줄 추가:

```bash
NEXT_PUBLIC_GA_MEASUREMENT_ID=G-XXXXXXXXXX
```

👆 위에서 복사한 Measurement ID로 교체해주세요!

예시:
```bash
NEXT_PUBLIC_GA_MEASUREMENT_ID=G-ABC123XYZ89
```

### 3-3. 파일 저장
저장 후 터미널에서 개발 서버 재시작:

```bash
# Ctrl + C로 서버 중지 후
npm run dev
```

---

## 🎉 4단계: 확인하기 (5분 후)

### 4-1. Google Analytics 실시간 보고서 확인
1. https://analytics.google.com/ 접속
2. 좌측 메뉴에서 **보고서** 클릭
3. **실시간** 클릭
4. 브라우저에서 **http://localhost:3000** 접속
5. GA 대시보드에서 "실시간 사용자 1" 이 보이면 성공! ✅

**참고**: 로컬환경(`localhost`)은 실제로는 추적이 안 될 수 있습니다. 프로덕션(배포된 사이트)에서만 정확히 작동합니다.

---

## 🌐 5단계: Vercel에도 환경 변수 추가 (배포용)

### 5-1. Vercel 대시보드 접속
👉 https://vercel.com/dashboard

### 5-2. 프로젝트 선택
Amiko 프로젝트 클릭

### 5-3. Settings → Environment Variables
좌측 메뉴에서:
1. **Settings** 클릭
2. **Environment Variables** 클릭

### 5-4. 환경 변수 추가
1. **Add New** 클릭
2. **Name**: `NEXT_PUBLIC_GA_MEASUREMENT_ID`
3. **Value**: 위에서 복사한 `G-XXXXXXXXXX`
4. 모든 환경 체크: ☑️ Production, ☑️ Preview, ☑️ Development
5. **Save** 클릭

### 5-5. 재배포
1. **Deployments** 탭 클릭
2. 최신 배포 항목 우측의 **⋯** 클릭
3. **Redeploy** 클릭
4. **Redeploy** 확인

### 5-6. 확인
배포 완료 후 실제 도메인에서 사이트 방문하고, GA4 실시간 보고서에서 확인!

---

## 🔥 자주 하는 질문

### Q1. Measurement ID가 안 보여요
→ 데이터 스트림을 만들지 않았을 수 있습니다. "데이터 스트림 만들기" → "웹" 선택하세요.

### Q2. localhost에서 안 되나요?
→ 기본적으로 localhost는 필터링됩니다. 실제 배포된 도메인에서 확인하세요.

### Q3. 데이터가 언제 보이나요?
→ 실시간 보고서는 즉시, 다른 보고서는 최대 24-48시간 지연될 수 있습니다.

### Q4. 비용이 들나요?
→ 무료입니다! Google Analytics는 완전 무료 서비스입니다.

### Q5. 기존 Google Analytics 계정이 있어요
→ 기존 계정 사용하셔도 됩니다. "속성 만들기"만 추가하면 됩니다.

---

## ✅ 체크리스트

진행 상황을 체크해보세요:

- [ ] Google Analytics 계정 생성
- [ ] 속성(Property) 생성 완료
- [ ] 데이터 스트림(웹) 추가 완료
- [ ] Measurement ID 복사 완료
- [ ] `.env.local`에 ID 추가 완료
- [ ] 로컬 개발 서버 재시작 완료
- [ ] Vercel에 환경 변수 추가 완료
- [ ] Vercel 재배포 완료
- [ ] 실시간 보고서에서 데이터 확인 완료

---

**총 소요 시간**: 약 15-20분  
**난이도**: ⭐⭐☆☆☆ (쉬움)  
**비용**: 무료

문제가 생기면 언제든 말씀해주세요! 🚀

