# GA4 로그인 유도 → 전환 퍼널 테스트 가이드

## 목표 퍼널
로그인 유도 UI 노출 → 로그인 버튼 클릭 → 로그인 성공 → 원래 하려던 행동 재시도

## 구현된 GA4 이벤트

### 1. `login_prompt_impression`
- **트리거**: 비로그인 상태에서 로그인 유도 UI가 viewport에 노출될 때
- **중복 방지**: `sessionStorage` 사용 (promptType별로 구분)
- **위치**: `src/components/main/app/community/CommentSection.tsx` - `IntersectionObserver`
- **이미 구현됨**: ✅

### 2. `login_click`
- **트리거**: 로그인 유도 UI 내 로그인 버튼 클릭 시
- **중복 방지**: 없음 (클릭당 1회)
- **위치**: `src/components/main/app/community/CommentSection.tsx` - 로그인 버튼 `onClick`
- **intent 저장**: `sessionStorage`에 intent 정보 저장

### 3. `login_success`
- **트리거**: 로그인 API 성공 시
- **중복 방지**: 없음 (성공 시 1회만)
- **위치**: `src/app/sign-in/page.tsx` - 로그인 성공 응답 후
- **기존 이벤트 활용**: ✅

### 4. `intended_action_resume`
- **트리거**: 로그인 성공 후 사용자가 원래 하려던 행동을 다시 시도했을 때
- **중복 방지**: 없음 (재시도 시 1회만)
- **위치**: `src/components/main/app/community/CommentSection.tsx` - 댓글 작성 시도 시
- **조건**: 저장된 intent가 존재할 때만 전송

## 테스트 시나리오

### 시나리오 1: 정상적인 로그인 유도 → 전환 플로우

1. **로그인 유도 UI 노출**
   - 비로그인 상태로 게시글 상세 페이지 접속
   - 댓글 섹션까지 스크롤하여 로그인 유도 UI가 viewport에 노출
   - ✅ GA4 이벤트: `login_prompt_impression`
   - **확인 방법**: 브라우저 콘솔에서 `[GA4] Event tracked: login_prompt_impression` 로그 확인

2. **로그인 버튼 클릭**
   - 로그인 유도 UI 내 "로그인하기" 버튼 클릭
   - ✅ GA4 이벤트: `login_click`
   - **확인 방법**: 브라우저 콘솔에서 `[GA4] Event tracked: login_click` 로그 확인
   - **intent 저장 확인**: `sessionStorage.getItem('amiko_login_intent')`로 확인

3. **로그인 성공**
   - 로그인 페이지에서 이메일/비밀번호 입력 후 로그인
   - 로그인 성공 시
   - ✅ GA4 이벤트: `login_success`
   - **확인 방법**: 브라우저 콘솔에서 `[GA4] Event tracked: login_success` 로그 확인
   - **redirect 확인**: 원래 페이지로 돌아가는지 확인

4. **원래 하려던 행동 재시도**
   - 로그인 후 원래 페이지로 돌아옴
   - 댓글 작성 시도 (댓글 입력 후 제출)
   - ✅ GA4 이벤트: `intended_action_resume`
   - **확인 방법**: 브라우저 콘솔에서 `[GA4] Event tracked: intended_action_resume` 로그 확인

### 시나리오 2: 로그인 실패

1. **로그인 유도 UI 노출** → `login_prompt_impression`
2. **로그인 버튼 클릭** → `login_click`
3. **로그인 실패** → `login_success` **전송되지 않음** ✅
4. **재시도 없음** → `intended_action_resume` **전송되지 않음** ✅

### 시나리오 3: 로그인 후 다른 행동

1. **로그인 유도 UI 노출** → `login_prompt_impression`
2. **로그인 버튼 클릭** → `login_click`
3. **로그인 성공** → `login_success`
4. **다른 행동 수행** (댓글 작성 외) → `intended_action_resume` **전송되지 않음** ✅

## GA4 DebugView 확인 방법

### 1. Google Analytics 4 접속
- https://analytics.google.com/ 접속
- Admin → DebugView 메뉴 선택

### 2. 이벤트 발생 순서 확인
다음 순서로 이벤트가 표시되어야 합니다:

```
1. login_prompt_impression (로그인 유도 UI 노출)
2. login_click (로그인 버튼 클릭)
3. login_success (로그인 성공)
4. intended_action_resume (원래 하려던 행동 재시도)
```

### 3. 이벤트 파라미터 확인
각 이벤트의 파라미터를 확인:

- `login_prompt_impression`:
  - `prompt_type`: "comment_section"
  - `page_location`: 현재 페이지 URL
  - `timestamp`: 이벤트 발생 시간

- `login_click`:
  - `prompt_type`: "comment_section"
  - `intent`: "comment_write"
  - `page_location`: 현재 페이지 URL
  - `timestamp`: 이벤트 발생 시간

- `login_success`:
  - `user_id`: 로그인한 사용자 ID
  - `login_method`: "email"
  - `timestamp`: 이벤트 발생 시간

- `intended_action_resume`:
  - `intent`: "comment_write"
  - `prompt_type`: "comment_section"
  - `page_location`: 현재 페이지 URL
  - `timestamp`: 이벤트 발생 시간

## 브라우저 콘솔 확인

### 개발자 도구 열기
1. F12 또는 우클릭 → 검사
2. Console 탭 선택

### 예상 로그 메시지
```
[GA4] Event tracked: login_prompt_impression { prompt_type: "comment_section", page_location: "...", timestamp: "..." }
[GA4] Event tracked: login_click { prompt_type: "comment_section", intent: "comment_write", page_location: "...", timestamp: "..." }
[GA4] Event tracked: login_success { user_id: "...", login_method: "email", timestamp: "..." }
[GA4] Event tracked: intended_action_resume { intent: "comment_write", prompt_type: "comment_section", page_location: "...", timestamp: "..." }
```

## sessionStorage 확인

### intent 저장 확인
브라우저 콘솔에서 다음 명령어로 확인:

```javascript
// 로그인 버튼 클릭 후 intent 저장 확인
sessionStorage.getItem('amiko_login_intent')
// 예상 결과: {"intent":"comment_write","promptType":"comment_section","pageLocation":"...","timestamp":"..."}

// 댓글 작성 후 intent 삭제 확인
sessionStorage.getItem('amiko_login_intent')
// 예상 결과: null (삭제됨)
```

## Network 탭 확인

### 1. Network 탭 열기
- 개발자 도구 → Network 탭

### 2. 필터 설정
- 필터에 `google-analytics.com` 또는 `collect` 입력

### 3. 요청 확인
- `google-analytics.com/g/collect` 요청 확인
- 각 요청의 `en` 파라미터에서 이벤트 이름 확인:
  - `en=login_prompt_impression`
  - `en=login_click`
  - `en=login_success`
  - `en=intended_action_resume`

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

### intent가 저장되지 않는 경우

- `sessionStorage`가 제대로 작동하는지 확인
- 로그인 버튼 클릭 시 `trackLoginClick` 함수가 호출되는지 확인

### intended_action_resume이 전송되지 않는 경우

- `sessionStorage`에 `amiko_login_intent`가 저장되어 있는지 확인
- 댓글 작성 시도 시 `intent`가 `'comment_write'`인지 확인
- 로그인 성공 후 원래 페이지로 돌아왔는지 확인

## 참고 사항

- 이벤트는 `CommentSection` 컴포넌트를 사용하는 페이지에서만 작동합니다
- 주요 적용 페이지: `/community/post/[id]`, `/community/freeboard` 등
- 다른 로그인 유도 UI에도 동일한 패턴으로 이벤트를 추가할 수 있습니다
- `intent` 값은 행동에 따라 다를 수 있습니다:
  - `comment_write`: 댓글 작성
  - `post_write`: 글쓰기
  - `like_post`: 좋아요
  - 등등

