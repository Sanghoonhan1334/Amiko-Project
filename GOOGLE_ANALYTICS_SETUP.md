# Google Analytics 4 (GA4) 설정 가이드

## 📋 개요

Amiko 플랫폼에 Google Analytics 4를 설정하는 방법입니다.

## 🔧 설정 방법

### 1. Google Analytics 계정 생성 및 Measurement ID 발급

1. **Google Analytics 웹사이트 접속**
   - https://analytics.google.com/ 접속
   - 구글 계정으로 로그인

2. **속성(Property) 생성**
   - 좌측 하단 "관리" 클릭
   - "속성 만들기" 클릭
   - 속성 이름 입력 (예: "Amiko Web")
   - 보고 시간대 선택 (KST - 한국 시간대)
   - 화폐 선택 (KRW)

3. **데이터 스트림 설정**
   - "웹" 선택
   - 웹사이트 URL 입력: `https://www.helloamiko.com`
   - 스트림 이름 입력: "Amiko Main Website"

4. **Measurement ID 확인**
   - 생성된 데이터 스트림에서 "측정 ID" 복사
   - 형식: `G-XXXXXXXXXX` (G-로 시작하는 11자리 문자열)

### 2. 환경 변수 설정

`.env.local` 파일에 Measurement ID를 추가합니다:

```bash
# Google Analytics 설정
NEXT_PUBLIC_GA_MEASUREMENT_ID=G-XXXXXXXXXX
```

⚠️ **주의**: `G-XXXXXXXXXX` 부분을 실제 Measurement ID로 교체해주세요.

### 3. Vercel 환경 변수 설정

프로덕션 배포를 위해 Vercel에도 환경 변수를 설정해야 합니다:

1. **Vercel 대시보드 접속**
   - https://vercel.com/dashboard 접속

2. **프로젝트 선택**
   - Amiko 프로젝트 선택

3. **환경 변수 추가**
   - "Settings" → "Environment Variables" 클릭
   - Name: `NEXT_PUBLIC_GA_MEASUREMENT_ID`
   - Value: `G-XXXXXXXXXX` (실제 Measurement ID)
   - Environment: Production, Preview, Development 모두 선택
   - "Save" 클릭

4. **재배포**
   - "Deployments" 탭으로 이동
   - 최신 배포에서 "Redeploy" 클릭

## 📊 데이터 확인 방법

### Google Analytics 대시보드 접속

1. **Google Analytics 홈페이지**
   - https://analytics.google.com/ 접속
   - 로그인

2. **보고서 확인**
   - 좌측 메뉴에서 "보고서" 클릭
   - 실시간: 현재 활성 사용자 확인
   - 수집 중: 최근 30분간의 활동 확인
   - 참여도: 페이지뷰, 평균 세션 시간 등

### 확인 가능한 데이터

✅ **자동으로 수집되는 데이터:**
- 페이지뷰 (자동)
- 방문자 수
- 세션 수
- 이탈률
- 평균 세션 시간
- 디바이스 유형 (모바일/데스크톱)
- 브라우저 정보
- 지리적 위치

✅ **커스텀 이벤트로 추적 가능:**
- 버튼 클릭
- 폼 제출
- 다운로드
- 비디오 재생
- 스크롤 깊이
- 등등...

## 💡 커스텀 이벤트 추가 방법

### 예시: 버튼 클릭 추적

```typescript
import { event } from '@/lib/gtag'

function handleButtonClick() {
  event({
    action: 'click',
    category: 'engagement',
    label: 'Sign Up Button',
    value: 1
  })
  
  // 실제 버튼 클릭 로직
}
```

### 예시: 퀴즈 완료 추적

```typescript
import { event } from '@/lib/gtag'

function handleQuizComplete(quizId: string, score: number) {
  event({
    action: 'complete',
    category: 'quiz',
    label: quizId,
    value: score
  })
}
```

### 예시: 결제 완료 추적

```typescript
import { event } from '@/lib/gtag'

function handlePurchaseComplete(amount: number, productName: string) {
  event({
    action: 'purchase',
    category: 'ecommerce',
    label: productName,
    value: amount
  })
}
```

## 🎯 주요 파일 구조

```
src/
├── lib/
│   └── gtag.ts              # Google Analytics 유틸리티 함수
├── components/
│   └── analytics/
│       └── GoogleAnalytics.tsx  # 페이지뷰 자동 추적 컴포넌트
└── app/
    └── layout.tsx           # GA4 스크립트 로드
```

## 🔍 문제 해결

### 데이터가 안 보여요
1. Measurement ID가 올바른지 확인
2. 환경 변수가 `.env.local`과 Vercel 모두에 설정되었는지 확인
3. 브라우저 캐시 삭제 후 재접속
4. Google Analytics 실시간 보고서 확인 (최대 48시간 지연 가능)

### 개발 환경에서 테스트하고 싶어요
1. 개발 모드에서도 동작합니다
2. `localhost:3000` 방문 데이터는 GA4에서 필터링됩니다
3. 실제 도메인으로 배포 후 테스트하는 것을 권장합니다

### 개인정보 보호 관련
- Google Analytics는 개인을 식별할 수 있는 정보를 수집하지 않습니다
- IP 주소는 익명화됩니다
- GDPR 및 개인정보 보호 법규를 준수합니다

## 📚 참고 자료

- [Google Analytics 공식 문서](https://developers.google.com/analytics)
- [GA4 측정 ID 찾기](https://support.google.com/analytics/answer/9304153)
- [Next.js + Google Analytics](https://nextjs.org/learn/seo/analytics)

## ✅ 체크리스트

- [ ] Google Analytics 계정 생성
- [ ] Measurement ID 발급 (`G-XXXXXXXXXX`)
- [ ] `.env.local`에 환경 변수 추가
- [ ] Vercel에 환경 변수 추가
- [ ] 프로덕션 배포 및 재배포
- [ ] 실시간 보고서에서 데이터 확인
- [ ] 커스텀 이벤트 추가 (선택사항)

---

**작성일**: 2025-01-27  
**작성자**: Amiko Development Team

