# GA4 커뮤니티 참여 퍼널 테스트 가이드

## 목표 퍼널
게시글 조회 → 댓글 입력 시작 → 댓글 작성 완료 → 로그인 유도 노출

## 구현된 GA4 이벤트

### 1. `community_comment_input_start`
- **트리거**: 댓글 입력창에 포커스되거나 최초 입력 시
- **중복 방지**: `sessionStorage` 사용 (postId별로 구분)
- **위치**: `src/components/main/app/community/CommentSection.tsx`

### 2. `community_comment_submit`
- **트리거**: 댓글 작성 완료 및 제출 성공 시
- **중복 방지**: `sessionStorage` 사용 (postId별로 구분)
- **위치**: `src/components/main/app/community/CommentSection.tsx`

### 3. `login_prompt_impression`
- **트리거**: 비로그인 상태에서 로그인 유도 UI가 viewport에 노출될 때
- **중복 방지**: `sessionStorage` 사용 (promptType별로 구분)
- **위치**: `src/components/main/app/community/CommentSection.tsx`

## 테스트 시나리오

### 시나리오 1: 로그인 상태에서 댓글 작성

1. **게시글 조회**
   - `/community/freeboard` 또는 `/community/post/[id]` 접속
   - 게시글 클릭하여 상세 페이지 진입
   - ✅ GA4 이벤트: `page_view` (기존)

2. **댓글 영역 노출**
   - 게시글 상세 페이지에서 댓글 섹션까지 스크롤
   - ✅ GA4 이벤트: `community_comment_section_view` (이미 구현됨)

3. **댓글 입력 시작**
   - 댓글 입력창(textarea)에 포커스 또는 최초 입력
   - ✅ GA4 이벤트: `community_comment_input_start`
   - **확인 방법**: 브라우저 콘솔에서 `[GA4] Event tracked: community_comment_input_start` 로그 확인

4. **댓글 작성 완료**
   - 댓글 내용 입력 후 제출 버튼 클릭
   - 댓글 작성 성공 시
   - ✅ GA4 이벤트: `community_comment_submit`
   - **확인 방법**: 브라우저 콘솔에서 `[GA4] Event tracked: community_comment_submit` 로그 확인

### 시나리오 2: 비로그인 상태에서 로그인 유도 노출

1. **로그아웃 상태 확인**
   - 로그아웃 또는 비로그인 상태로 게시글 상세 페이지 접속

2. **로그인 유도 UI 노출**
   - 게시글 상세 페이지에서 댓글 섹션까지 스크롤
   - "로그인이 필요합니다" 메시지가 viewport에 노출될 때
   - ✅ GA4 이벤트: `login_prompt_impression`
   - **확인 방법**: 브라우저 콘솔에서 `[GA4] Event tracked: login_prompt_impression` 로그 확인

## GA4 DebugView 확인 방법

### 1. Google Analytics 4 접속
- https://analytics.google.com/ 접속
- Admin → DebugView 메뉴 선택

### 2. 이벤트 발생 순서 확인
다음 순서로 이벤트가 표시되어야 합니다:

```
1. page_view (게시글 상세 페이지 진입)
2. community_comment_section_view (댓글 영역 노출)
3. community_comment_input_start (댓글 입력 시작) - 로그인 상태에서만
4. community_comment_submit (댓글 작성 완료) - 로그인 상태에서만
5. login_prompt_impression (로그인 유도 UI 노출) - 비로그인 상태에서만
```

### 3. 이벤트 파라미터 확인
각 이벤트의 파라미터를 확인:

- `community_comment_input_start`:
  - `post_id`: 게시글 ID
  - `page_location`: 현재 페이지 URL
  - `timestamp`: 이벤트 발생 시간

- `community_comment_submit`:
  - `post_id`: 게시글 ID
  - `comment_id`: 작성된 댓글 ID
  - `page_location`: 현재 페이지 URL
  - `timestamp`: 이벤트 발생 시간

- `login_prompt_impression`:
  - `prompt_type`: "comment_section"
  - `page_location`: 현재 페이지 URL
  - `timestamp`: 이벤트 발생 시간

## 브라우저 콘솔 확인

### 개발자 도구 열기
1. F12 또는 우클릭 → 검사
2. Console 탭 선택

### 예상 로그 메시지
```
[GA4] Event tracked: community_comment_input_start { post_id: "...", page_location: "...", timestamp: "..." }
[GA4] Event tracked: community_comment_submit { post_id: "...", comment_id: "...", page_location: "...", timestamp: "..." }
[GA4] Event tracked: login_prompt_impression { prompt_type: "comment_section", page_location: "...", timestamp: "..." }
```

## Network 탭 확인

### 1. Network 탭 열기
- 개발자 도구 → Network 탭

### 2. 필터 설정
- 필터에 `google-analytics.com` 또는 `collect` 입력

### 3. 요청 확인
- `google-analytics.com/g/collect` 요청 확인
- 각 요청의 `en` 파라미터에서 이벤트 이름 확인:
  - `en=community_comment_input_start`
  - `en=community_comment_submit`
  - `en=login_prompt_impression`

## 중복 호출 방지 확인

### sessionStorage 확인
브라우저 콘솔에서 다음 명령어로 확인:

```javascript
// 댓글 입력 시작 이벤트 추적 여부 확인
sessionStorage.getItem('ga4_comment_input_start_[postId]')

// 댓글 제출 이벤트 추적 여부 확인
sessionStorage.getItem('ga4_comment_submit_[postId]')

// 로그인 유도 UI 노출 이벤트 추적 여부 확인
sessionStorage.getItem('ga4_login_prompt_impression_comment_section')
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
- 같은 postId로 여러 번 테스트할 때는 브라우저를 새로고침하거나 시크릿 모드 사용

## 참고 사항

- 이벤트는 `CommentSection` 컴포넌트를 사용하는 페이지에서만 작동합니다
- 주요 적용 페이지: `/community/post/[id]`, `/community/freeboard` 등
- 다른 게시글 상세 페이지(fanart, idol-photos 등)는 자체 댓글 섹션을 사용하므로 별도 구현이 필요할 수 있습니다

