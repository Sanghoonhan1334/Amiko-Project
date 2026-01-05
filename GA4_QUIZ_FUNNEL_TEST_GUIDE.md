# GA4 퀴즈 퍼널 테스트 가이드

## 목표 퍼널
테스트 진입 → 시작 클릭 → 질문 50% 도달 → 테스트 완료 → 결과 공유

## 구현된 GA4 이벤트

### 1. `quiz_enter`
- **트리거**: 퀴즈 소개 페이지 진입 시
- **중복 방지**: `sessionStorage` 사용 (testId별로 구분)
- **위치**: `src/app/quiz/mood/page.tsx` - `useEffect` (퀴즈 데이터 로드 후)

### 2. `quiz_start_click`
- **트리거**: "시작하기" 버튼 클릭 시
- **중복 방지**: 없음 (클릭당 1회)
- **위치**: `src/app/quiz/mood/start/page.tsx` - `handleStart`

### 3. `quiz_progress_50`
- **트리거**: 전체 질문 수 대비 50% 이상 최초 도달 시
- **중복 방지**: `sessionStorage` 사용 (testId별로 구분)
- **위치**: `src/app/quiz/mood/questions/page.tsx` - `handleAnswerSelectAndNext` (다음 질문으로 이동 시)

### 4. `quiz_complete`
- **트리거**: 마지막 질문 완료 + 결과 페이지 진입 시
- **중복 방지**: `sessionStorage` 사용 (testId별로 구분)
- **위치**: `src/app/quiz/mood/questions/page.tsx` - `handleAnswerSelectAndNext` (마지막 질문 완료 시)

### 5. `quiz_result_share`
- **트리거**: 결과 공유 버튼 클릭 시
- **중복 방지**: 없음 (클릭당 1회)
- **위치**: `src/app/quiz/mood/result/page.tsx` - `handleShare`

## 테스트 시나리오

### 시나리오 1: 정상적인 퀴즈 플로우

1. **테스트 진입**
   - `/quiz/mood` 페이지 접속
   - 퀴즈 데이터 로드 완료 후
   - ✅ GA4 이벤트: `quiz_enter`
   - **확인 방법**: 브라우저 콘솔에서 `[GA4] Event tracked: quiz_enter` 로그 확인

2. **시작 클릭**
   - "COMENZAR" 버튼 클릭
   - ✅ GA4 이벤트: `quiz_start_click`
   - **확인 방법**: 브라우저 콘솔에서 `[GA4] Event tracked: quiz_start_click` 로그 확인

3. **질문 50% 도달**
   - 질문에 답변하며 진행
   - 전체 질문 수의 50% 이상 도달 시 (예: 10개 질문 중 5번째 질문 완료 후)
   - ✅ GA4 이벤트: `quiz_progress_50`
   - **확인 방법**: 브라우저 콘솔에서 `[GA4] Event tracked: quiz_progress_50` 로그 확인

4. **테스트 완료**
   - 마지막 질문에 답변 완료
   - 결과 페이지로 이동
   - ✅ GA4 이벤트: `quiz_complete`
   - **확인 방법**: 브라우저 콘솔에서 `[GA4] Event tracked: quiz_complete` 로그 확인

5. **결과 공유**
   - 결과 페이지에서 공유 버튼 클릭
   - ✅ GA4 이벤트: `quiz_result_share`
   - **확인 방법**: 브라우저 콘솔에서 `[GA4] Event tracked: quiz_result_share` 로그 확인

### 시나리오 2: 중간에 중단

1. **테스트 진입** → `quiz_enter`
2. **시작 클릭** → `quiz_start_click`
3. **질문 진행 중 중단** → `quiz_progress_50` (50% 도달 시), `quiz_complete` **전송되지 않음** ✅

### 시나리오 3: 50% 미만에서 중단

1. **테스트 진입** → `quiz_enter`
2. **시작 클릭** → `quiz_start_click`
3. **50% 미만에서 중단** → `quiz_progress_50` **전송되지 않음** ✅

## GA4 DebugView 확인 방법

### 1. Google Analytics 4 접속
- https://analytics.google.com/ 접속
- Admin → DebugView 메뉴 선택

### 2. 이벤트 발생 순서 확인
다음 순서로 이벤트가 표시되어야 합니다:

```
1. quiz_enter (테스트 진입)
2. quiz_start_click (시작 클릭)
3. quiz_progress_50 (질문 50% 도달)
4. quiz_complete (테스트 완료)
5. quiz_result_share (결과 공유)
```

### 3. 이벤트 파라미터 확인
각 이벤트의 파라미터를 확인:

- `quiz_enter`:
  - `test_id`: 퀴즈 ID
  - `page_location`: 현재 페이지 URL
  - `timestamp`: 이벤트 발생 시간

- `quiz_start_click`:
  - `test_id`: 퀴즈 ID
  - `page_location`: 현재 페이지 URL
  - `timestamp`: 이벤트 발생 시간

- `quiz_progress_50`:
  - `test_id`: 퀴즈 ID
  - `page_location`: 현재 페이지 URL
  - `timestamp`: 이벤트 발생 시간

- `quiz_complete`:
  - `test_id`: 퀴즈 ID
  - `result_type`: 결과 타입 (예: "happy", "sad" 등)
  - `page_location`: 현재 페이지 URL
  - `timestamp`: 이벤트 발생 시간

- `quiz_result_share`:
  - `test_id`: 퀴즈 ID
  - `channel`: 공유 채널 ("system", "copy", "whatsapp", "instagram", "tiktok" 등)
  - `page_location`: 현재 페이지 URL
  - `timestamp`: 이벤트 발생 시간

## 브라우저 콘솔 확인

### 개발자 도구 열기
1. F12 또는 우클릭 → 검사
2. Console 탭 선택

### 예상 로그 메시지
```
[GA4] Event tracked: quiz_enter { test_id: "...", page_location: "...", timestamp: "..." }
[GA4] Event tracked: quiz_start_click { test_id: "...", page_location: "...", timestamp: "..." }
[GA4] Event tracked: quiz_progress_50 { test_id: "...", page_location: "...", timestamp: "..." }
[GA4] Event tracked: quiz_complete { test_id: "...", result_type: "...", page_location: "...", timestamp: "..." }
[GA4] Event tracked: quiz_result_share { test_id: "...", channel: "...", page_location: "...", timestamp: "..." }
```

## Network 탭 확인

### 1. Network 탭 열기
- 개발자 도구 → Network 탭

### 2. 필터 설정
- 필터에 `google-analytics.com` 또는 `collect` 입력

### 3. 요청 확인
- `google-analytics.com/g/collect` 요청 확인
- 각 요청의 `en` 파라미터에서 이벤트 이름 확인:
  - `en=quiz_enter`
  - `en=quiz_start_click`
  - `en=quiz_progress_50`
  - `en=quiz_complete`
  - `en=quiz_result_share`

## 중복 호출 방지 확인

### sessionStorage 확인
브라우저 콘솔에서 다음 명령어로 확인:

```javascript
// 테스트 진입 이벤트 추적 여부 확인
sessionStorage.getItem('ga4_quiz_enter_[testId]')

// 질문 50% 도달 이벤트 추적 여부 확인
sessionStorage.getItem('ga4_quiz_progress_50_[testId]')

// 테스트 완료 이벤트 추적 여부 확인
sessionStorage.getItem('ga4_quiz_complete_[testId]')
```

각 키의 값이 `'true'`이면 이미 추적된 것입니다.

## 문제 해결

### 이벤트가 전송되지 않는 경우

1. **gtag 로드 확인**
   ```javascript
   typeof window.gtag === 'function' // 'function'이어야 함
   ```

2. **Analytics 컴포넌트 확인**
   - `src/app/layout.tsx`에서 `<Analytics />` 컴포넌트가 포함되어 있는지 확인

3. **환경 변수 확인**
   - `NEXT_PUBLIC_GA4_MEASUREMENT_ID` 환경 변수가 설정되어 있는지 확인

4. **브라우저 콘솔 에러 확인**
   - JavaScript 에러가 있는지 확인

### 중복 호출이 발생하는 경우

- `sessionStorage`가 제대로 작동하는지 확인
- 같은 testId로 여러 번 테스트할 때는 브라우저를 새로고침하거나 시크릿 모드 사용

### quiz_progress_50이 전송되지 않는 경우

- 질문 수가 홀수인 경우 50% 계산 확인
- 예: 9개 질문인 경우, 5번째 질문 완료 후 (5/9 = 55.6%) 전송되어야 함
- `currentQuestion + 1`이 `questions.length / 2` 이상인지 확인

## 참고 사항

- 이벤트는 `/quiz/mood` 퀴즈에 구현되어 있습니다
- 다른 퀴즈(`/quiz/entrepreneur`, `/quiz/idol-position` 등)에도 동일한 패턴으로 적용 가능합니다
- `testId`는 퀴즈 ID 또는 slug를 사용합니다
- `resultType`은 퀴즈 결과 타입에 따라 다릅니다 (예: "happy", "sad", "energetic" 등)
- `channel`은 공유 채널에 따라 다릅니다 ("system", "copy", "whatsapp", "instagram", "tiktok" 등)

