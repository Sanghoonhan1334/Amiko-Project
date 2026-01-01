# GA4 재방문 퍼널 테스트 가이드

## 목표 퍼널
재방문 → 커뮤니티 진입 → 이전 행동 재실행

## 구현된 GA4 이벤트

### 1. `revisit`
- **트리거**: 기존 사용자(과거 방문 이력 있음)가 다시 사이트에 방문했을 때
- **중복 방지**: `sessionStorage` 사용 (세션당 1회)
- **위치**: `src/components/analytics/Analytics.tsx` - 세션 시작 시
- **판별 로직**: `localStorage.getItem('amiko_is_returning_user') === 'true'` 확인

### 2. `revisit_community_enter`
- **트리거**: 재방문 세션에서 `/community` 진입 시
- **중복 방지**: `sessionStorage` 사용 (세션당 1회)
- **위치**: `src/app/community/page.tsx` - 페이지 진입 시
- **조건**: 해당 세션에서 `revisit` 이벤트가 이미 발생한 경우에만 전송

### 3. `revisit_intended_action`
- **트리거**: 재방문 후 이전에 했던 주요 행동(글쓰기, 댓글, 테스트 등)을 다시 실행했을 때
- **중복 방지**: 없음 (행동 1회당 1회)
- **위치**: 
  - `src/components/main/app/community/PostCreate.tsx` - 글쓰기 성공 시
  - `src/components/main/app/community/CommentSection.tsx` - 댓글 작성 시
- **조건**: 해당 세션에서 `revisit` 이벤트가 이미 발생한 경우에만 전송
- **actionType**: `'write_post'`, `'comment'`, `'quiz_retry'` 등

## 재방문 판별 기준

### 최초 방문
1. 사용자가 처음 사이트에 방문
2. `localStorage.getItem('amiko_is_returning_user')`가 `null` 또는 존재하지 않음
3. `localStorage.setItem('amiko_is_returning_user', 'true')` 설정
4. `revisit` 이벤트 **전송하지 않음**

### 재방문
1. 사용자가 두 번째 방문부터
2. `localStorage.getItem('amiko_is_returning_user') === 'true'` 확인
3. `revisit` 이벤트 **전송**

## 테스트 시나리오

### 시나리오 1: 정상적인 재방문 플로우

1. **최초 방문 (재방문 아님)**
   - 브라우저를 새로 열고 사이트 접속
   - ✅ `revisit` 이벤트 **전송되지 않음**
   - **확인**: `localStorage.getItem('amiko_is_returning_user')`가 `'true'`로 설정됨

2. **재방문 (두 번째 방문)**
   - 브라우저를 닫고 다시 열어 사이트 접속
   - ✅ GA4 이벤트: `revisit`
   - **확인 방법**: 브라우저 콘솔에서 `[GA4] Event tracked: revisit` 로그 확인

3. **커뮤니티 진입**
   - 재방문 세션에서 `/community` 또는 `/main?tab=community` 접속
   - ✅ GA4 이벤트: `revisit_community_enter`
   - **확인 방법**: 브라우저 콘솔에서 `[GA4] Event tracked: revisit_community_enter` 로그 확인

4. **이전 행동 재실행**
   - 글쓰기 또는 댓글 작성
   - ✅ GA4 이벤트: `revisit_intended_action`
   - **확인 방법**: 브라우저 콘솔에서 `[GA4] Event tracked: revisit_intended_action` 로그 확인

### 시나리오 2: 재방문하지 않은 세션

1. **최초 방문**
   - ✅ `revisit` 이벤트 **전송되지 않음**

2. **커뮤니티 진입**
   - ✅ `revisit_community_enter` 이벤트 **전송되지 않음** (revisit가 발생하지 않았으므로)

3. **행동 실행**
   - ✅ `revisit_intended_action` 이벤트 **전송되지 않음** (revisit가 발생하지 않았으므로)

### 시나리오 3: 재방문했지만 커뮤니티 미진입

1. **재방문** → `revisit`
2. **다른 페이지만 방문** → `revisit_community_enter` **전송되지 않음** ✅
3. **행동 실행** → `revisit_intended_action` (revisit가 발생했으므로 전송됨)

## GA4 DebugView 확인 방법

### 1. Google Analytics 4 접속
- https://analytics.google.com/ 접속
- Admin → DebugView 메뉴 선택

### 2. 이벤트 발생 순서 확인
다음 순서로 이벤트가 표시되어야 합니다:

```
1. revisit (재방문)
2. revisit_community_enter (커뮤니티 진입) - 선택적
3. revisit_intended_action (이전 행동 재실행) - 선택적
```

### 3. 이벤트 파라미터 확인
각 이벤트의 파라미터를 확인:

- `revisit`:
  - `page_location`: 현재 페이지 URL
  - `timestamp`: 이벤트 발생 시간

- `revisit_community_enter`:
  - `page_location`: 현재 페이지 URL
  - `timestamp`: 이벤트 발생 시간

- `revisit_intended_action`:
  - `action_type`: 행동 타입 ("write_post", "comment", "quiz_retry" 등)
  - `page_location`: 현재 페이지 URL
  - `timestamp`: 이벤트 발생 시간

## 브라우저 콘솔 확인

### 개발자 도구 열기
1. F12 또는 우클릭 → 검사
2. Console 탭 선택

### 예상 로그 메시지
```
[GA4] Event tracked: revisit { page_location: "...", timestamp: "..." }
[GA4] Event tracked: revisit_community_enter { page_location: "...", timestamp: "..." }
[GA4] Event tracked: revisit_intended_action { action_type: "write_post", page_location: "...", timestamp: "..." }
```

## localStorage / sessionStorage 확인

### localStorage 확인
브라우저 콘솔에서 다음 명령어로 확인:

```javascript
// 재방문 사용자 플래그 확인
localStorage.getItem('amiko_is_returning_user')
// 최초 방문 후: 'true'
// 재방문 시: 'true'

// 재방문 플래그 초기화 (테스트용)
localStorage.removeItem('amiko_is_returning_user')
```

### sessionStorage 확인
브라우저 콘솔에서 다음 명령어로 확인:

```javascript
// revisit 이벤트 추적 여부 확인
sessionStorage.getItem('ga4_revisit_tracked')
// revisit 발생 후: 'true'

// revisit_community_enter 이벤트 추적 여부 확인
sessionStorage.getItem('ga4_revisit_community_enter_tracked')
// 커뮤니티 진입 후: 'true'

// 세션 스토리지 초기화 (테스트용)
sessionStorage.clear()
```

## Network 탭 확인

### 1. Network 탭 열기
- 개발자 도구 → Network 탭

### 2. 필터 설정
- 필터에 `google-analytics.com` 또는 `collect` 입력

### 3. 요청 확인
- `google-analytics.com/g/collect` 요청 확인
- 각 요청의 `en` 파라미터에서 이벤트 이름 확인:
  - `en=revisit`
  - `en=revisit_community_enter`
  - `en=revisit_intended_action`

## 문제 해결

### revisit 이벤트가 전송되지 않는 경우

1. **최초 방문인지 확인**
   ```javascript
   localStorage.getItem('amiko_is_returning_user')
   // null이면 최초 방문이므로 revisit 전송되지 않음 (정상)
   ```

2. **localStorage 확인**
   - 브라우저 개발자 도구 → Application → Local Storage에서 확인
   - `amiko_is_returning_user` 키가 존재하는지 확인

3. **세션 확인**
   ```javascript
   sessionStorage.getItem('ga4_revisit_tracked')
   // 'true'이면 이미 이 세션에서 추적됨
   ```

### revisit_community_enter가 전송되지 않는 경우

1. **revisit 발생 여부 확인**
   ```javascript
   sessionStorage.getItem('ga4_revisit_tracked')
   // 'true'여야 함
   ```

2. **커뮤니티 진입 확인**
   - `/community` 또는 `/main?tab=community` 경로로 진입했는지 확인

3. **중복 방지 확인**
   ```javascript
   sessionStorage.getItem('ga4_revisit_community_enter_tracked')
   // 'true'이면 이미 추적됨
   ```

### revisit_intended_action이 전송되지 않는 경우

1. **revisit 발생 여부 확인**
   ```javascript
   sessionStorage.getItem('ga4_revisit_tracked')
   // 'true'여야 함
   ```

2. **행동 실행 확인**
   - 글쓰기 또는 댓글 작성이 성공적으로 완료되었는지 확인

## 테스트 절차

### 1단계: 최초 방문 시뮬레이션

```javascript
// 브라우저 콘솔에서 실행
localStorage.removeItem('amiko_is_returning_user')
sessionStorage.clear()
location.reload()
```

**예상 결과**: `revisit` 이벤트 전송되지 않음

### 2단계: 재방문 시뮬레이션

```javascript
// 브라우저 콘솔에서 실행 (1단계 후)
sessionStorage.clear() // 세션만 초기화
location.reload()
```

**예상 결과**: `revisit` 이벤트 전송됨

### 3단계: 커뮤니티 진입

```javascript
// 재방문 세션에서
location.href = '/community'
```

**예상 결과**: `revisit_community_enter` 이벤트 전송됨

### 4단계: 이전 행동 재실행

```javascript
// 재방문 세션에서 글쓰기 또는 댓글 작성
```

**예상 결과**: `revisit_intended_action` 이벤트 전송됨

## 참고 사항

- 재방문 판별은 `localStorage` 기반으로 작동합니다
- 세션당 1회만 전송되므로, 같은 세션에서 여러 번 방문해도 1회만 전송됩니다
- `revisit_community_enter`와 `revisit_intended_action`은 `revisit` 이벤트가 발생한 세션에서만 전송됩니다
- `actionType` 값:
  - `'write_post'`: 글쓰기
  - `'comment'`: 댓글 작성
  - `'quiz_retry'`: 퀴즈 재시작 (향후 추가 가능)

