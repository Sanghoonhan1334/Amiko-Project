# GA4 Localhost Debug Mode 설정 완료

## 수정된 파일

### 1. `src/components/analytics/Analytics.tsx`
**변경 사항:**
- `debug_mode: true`를 gtag config에 추가
- localhost 환경 자동 감지
- 중복 실행 방지 로직 추가 (`window.__GA4_INITIALIZED__`)
- 스크립트 로드 확인 로그 추가

**변경 이유:**
- localhost에서도 DebugView에 이벤트가 표시되도록 debug_mode 활성화
- 개발 환경에서 GA4 디버깅 가능하도록 설정

### 2. `src/lib/analytics.ts` (trackPageView 함수)
**변경 사항:**
- `trackPageView` 함수의 gtag config에 `debug_mode` 추가
- localhost 환경 감지 로직 추가

**변경 이유:**
- 페이지뷰 추적 시에도 debug_mode가 적용되도록 보장

### 3. `src/lib/gtag.ts` (pageview 함수)
**변경 사항:**
- `pageview` 함수의 gtag config에 `debug_mode` 추가
- localhost 환경 감지 로직 추가

**변경 이유:**
- 기존 gtag.ts의 pageview 함수에도 debug_mode 적용

## Debug Mode 활성화 조건

다음 조건 중 하나라도 만족하면 `debug_mode: true`가 설정됩니다:
1. `process.env.NODE_ENV === 'development'`
2. `window.location.hostname === 'localhost'`
3. `window.location.hostname === '127.0.0.1'`
4. `window.location.hostname.includes('localhost')`

## Measurement ID 확인

현재 사용 중인 Measurement ID:
- 환경 변수: `NEXT_PUBLIC_GA4_MEASUREMENT_ID`
- 기본값: `G-5RM3B0CKWJ` (환경 변수가 없을 경우)

## 테스트 방법

### 1. Chrome 콘솔 확인

1. 브라우저에서 `http://localhost:3000` 접속
2. 개발자 도구 열기 (F12)
3. Console 탭에서 다음 로그 확인:
   ```
   [GA4] Script loaded successfully { measurementId: 'G-5RM3B0CKWJ', debugMode: true, hostname: 'localhost' }
   [GA4] Initialized { measurementId: 'G-5RM3B0CKWJ', debugMode: true, hostname: 'localhost' }
   [GA4] Page view: /
   [GA4] Event tracked: session_start
   ```

4. `window.gtag` 함수 확인:
   ```javascript
   typeof window.gtag  // 'function'이어야 함
   ```

5. `window.dataLayer` 확인:
   ```javascript
   window.dataLayer  // 배열이어야 하며, 이벤트들이 쌓여있어야 함
   ```

### 2. Network 탭 확인

1. 개발자 도구 > Network 탭 열기
2. 필터에 `collect` 입력
3. 페이지 로드 및 이벤트 발생 시 다음 요청 확인:
   ```
   https://www.google-analytics.com/g/collect?v=2&...
   ```
4. 요청이 발생하면 GA4에 정상 전송 중

### 3. GA4 DebugView 확인

1. Google Analytics 4 대시보드 접속
2. **관리 (Admin)** > **DebugView** 메뉴로 이동
3. localhost에서 앱 사용:
   - 페이지 이동
   - 버튼 클릭
   - 폼 제출 등
4. DebugView에서 실시간으로 이벤트 확인:
   - `page_view`
   - `session_start`
   - `cta_click`
   - `view_*_tab`
   - 기타 커스텀 이벤트

### 4. 수동 이벤트 테스트

브라우저 콘솔에서 직접 이벤트 전송 테스트:
```javascript
// gtag가 로드되었는지 확인
window.gtag('event', 'test_event', {
  test_param: 'test_value'
})

// dataLayer 확인
console.log(window.dataLayer)
```

## 문제 해결

### 이벤트가 DebugView에 나타나지 않는 경우

1. **Measurement ID 확인:**
   ```javascript
   // 콘솔에서 확인
   console.log(process.env.NEXT_PUBLIC_GA4_MEASUREMENT_ID)
   ```

2. **gtag 로드 확인:**
   ```javascript
   // 콘솔에서 확인
   typeof window.gtag  // 'function'이어야 함
   ```

3. **Network 요청 확인:**
   - Network 탭에서 `collect` 요청이 있는지 확인
   - 요청이 없다면 스크립트가 로드되지 않은 것

4. **중복 초기화 확인:**
   ```javascript
   // 콘솔에서 확인
   window.__GA4_INITIALIZED__  // true여야 함
   ```

5. **환경 변수 확인:**
   - `.env.local` 파일에 `NEXT_PUBLIC_GA4_MEASUREMENT_ID` 설정 확인
   - Next.js 재시작 필요 (환경 변수 변경 시)

### Debug Mode가 활성화되지 않는 경우

1. **hostname 확인:**
   ```javascript
   // 콘솔에서 확인
   console.log(window.location.hostname)
   // 'localhost' 또는 '127.0.0.1'이어야 함
   ```

2. **NODE_ENV 확인:**
   - 개발 서버 실행 시 자동으로 'development'
   - `npm run dev` 또는 `yarn dev`로 실행 중인지 확인

## 추가 확인 사항

### 중복 실행 방지
- `window.__GA4_INITIALIZED__` 플래그로 중복 초기화 방지
- 스크립트가 여러 번 로드되어도 config는 한 번만 실행

### 스크립트 로드 순서
- `ga4-measurement` 스크립트가 먼저 로드
- 그 다음 `ga4-config` 스크립트 실행
- `strategy="afterInteractive"`로 페이지 로드 후 실행

### 환경 변수 설정

`.env.local` 파일에 다음 추가:
```env
NEXT_PUBLIC_GA4_MEASUREMENT_ID=G-5RM3B0CKWJ
```

## 성공 확인 체크리스트

- [ ] Chrome 콘솔에 `[GA4] Script loaded successfully` 로그 표시
- [ ] Chrome 콘솔에 `[GA4] Initialized` 로그 표시
- [ ] Network 탭에서 `collect?v=2` 요청 확인
- [ ] `window.gtag` 함수가 정의되어 있음
- [ ] `window.dataLayer` 배열에 이벤트 데이터 확인
- [ ] GA4 DebugView에서 이벤트 실시간 확인

## 참고

- DebugView는 최대 30분간 이벤트를 표시합니다
- DebugView에 표시되려면 debug_mode가 true여야 합니다
- Production 환경에서는 debug_mode가 false로 설정됩니다 (hostname 기반)
