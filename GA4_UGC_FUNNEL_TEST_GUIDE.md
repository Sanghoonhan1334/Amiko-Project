# GA4 UGC 생성 퍼널 테스트 가이드

## 목표 퍼널
글쓰기 버튼 클릭 → 에디터 진입 → 내용 입력 시작 → 게시 시도 → 게시 성공

## 구현된 GA4 이벤트

### 1. `ugc_write_click`
- **트리거**: 사용자가 "글쓰기" 버튼을 클릭했을 때
- **중복 방지**: 없음 (클릭당 1회)
- **위치**: 
  - `src/components/main/app/community/CommunityMain.tsx` - `handleCreatePost`
  - `src/app/community/gallery/[slug]/page.tsx` - `handleCreatePost`

### 2. `ugc_editor_enter`
- **트리거**: 글쓰기 에디터 페이지가 최초 렌더링될 때
- **중복 방지**: `sessionStorage` 사용 (gallerySlug별로 구분)
- **위치**: `src/components/main/app/community/PostCreate.tsx` - `useEffect`

### 3. `ugc_content_input_start`
- **트리거**: 사용자가 처음으로 글자를 입력했을 때
- **중복 방지**: `useRef`와 `sessionStorage` 사용 (gallerySlug별로 구분)
- **위치**: `src/components/main/app/community/PostCreate.tsx` - textarea `onChange`

### 4. `ugc_submit_attempt`
- **트리거**: 게시 API 호출 직전
- **중복 방지**: 없음 (클릭당 1회)
- **위치**: `src/components/main/app/community/PostCreate.tsx` - `handleSubmit`

### 5. `ugc_submit_success`
- **트리거**: 서버에서 게시 성공 응답을 받은 경우
- **중복 방지**: 없음 (성공 시 1회만)
- **위치**: `src/components/main/app/community/PostCreate.tsx` - `handleSubmit` 성공 응답 후

## 테스트 시나리오

### 시나리오 1: 정상적인 글쓰기 플로우

1. **글쓰기 버튼 클릭**
   - 갤러리 목록 또는 게시글 목록에서 "글쓰기" 버튼 클릭
   - ✅ GA4 이벤트: `ugc_write_click`
   - **확인 방법**: 브라우저 콘솔에서 `[GA4] Event tracked: ugc_write_click` 로그 확인

2. **에디터 진입**
   - 글쓰기 에디터 페이지가 렌더링됨
   - ✅ GA4 이벤트: `ugc_editor_enter`
   - **확인 방법**: 브라우저 콘솔에서 `[GA4] Event tracked: ugc_editor_enter` 로그 확인

3. **내용 입력 시작**
   - 제목 또는 내용 입력창에 최초로 글자 입력
   - ✅ GA4 이벤트: `ugc_content_input_start`
   - **확인 방법**: 브라우저 콘솔에서 `[GA4] Event tracked: ugc_content_input_start` 로그 확인

4. **게시 시도**
   - 제목과 내용을 입력한 후 "글 작성" 버튼 클릭
   - ✅ GA4 이벤트: `ugc_submit_attempt`
   - **확인 방법**: 브라우저 콘솔에서 `[GA4] Event tracked: ugc_submit_attempt` 로그 확인

5. **게시 성공**
   - 서버에서 게시 성공 응답을 받음
   - ✅ GA4 이벤트: `ugc_submit_success`
   - **확인 방법**: 브라우저 콘솔에서 `[GA4] Event tracked: ugc_submit_success` 로그 확인

### 시나리오 2: 게시 실패

1. **글쓰기 버튼 클릭** → `ugc_write_click`
2. **에디터 진입** → `ugc_editor_enter`
3. **내용 입력 시작** → `ugc_content_input_start`
4. **게시 시도** → `ugc_submit_attempt`
5. **게시 실패** → `ugc_submit_success` **전송되지 않음** ✅

## GA4 DebugView 확인 방법

### 1. Google Analytics 4 접속
- https://analytics.google.com/ 접속
- Admin → DebugView 메뉴 선택

### 2. 이벤트 발생 순서 확인
다음 순서로 이벤트가 표시되어야 합니다:

```
1. ugc_write_click (글쓰기 버튼 클릭)
2. ugc_editor_enter (에디터 진입)
3. ugc_content_input_start (내용 입력 시작)
4. ugc_submit_attempt (게시 시도)
5. ugc_submit_success (게시 성공)
```

### 3. 이벤트 파라미터 확인
각 이벤트의 파라미터를 확인:

- `ugc_write_click`:
  - `gallery_slug`: 갤러리 슬러그 (예: "kpop", "free")
  - `page_location`: 현재 페이지 URL
  - `timestamp`: 이벤트 발생 시간

- `ugc_editor_enter`:
  - `gallery_slug`: 갤러리 슬러그
  - `page_location`: 현재 페이지 URL
  - `timestamp`: 이벤트 발생 시간

- `ugc_content_input_start`:
  - `gallery_slug`: 갤러리 슬러그
  - `page_location`: 현재 페이지 URL
  - `timestamp`: 이벤트 발생 시간

- `ugc_submit_attempt`:
  - `gallery_slug`: 갤러리 슬러그
  - `page_location`: 현재 페이지 URL
  - `timestamp`: 이벤트 발생 시간

- `ugc_submit_success`:
  - `post_id`: 작성된 게시글 ID
  - `gallery_slug`: 갤러리 슬러그
  - `page_location`: 현재 페이지 URL
  - `timestamp`: 이벤트 발생 시간

## 브라우저 콘솔 확인

### 개발자 도구 열기
1. F12 또는 우클릭 → 검사
2. Console 탭 선택

### 예상 로그 메시지
```
[GA4] Event tracked: ugc_write_click { gallery_slug: "...", page_location: "...", timestamp: "..." }
[GA4] Event tracked: ugc_editor_enter { gallery_slug: "...", page_location: "...", timestamp: "..." }
[GA4] Event tracked: ugc_content_input_start { gallery_slug: "...", page_location: "...", timestamp: "..." }
[GA4] Event tracked: ugc_submit_attempt { gallery_slug: "...", page_location: "...", timestamp: "..." }
[GA4] Event tracked: ugc_submit_success { post_id: "...", gallery_slug: "...", page_location: "...", timestamp: "..." }
```

## Network 탭 확인

### 1. Network 탭 열기
- 개발자 도구 → Network 탭

### 2. 필터 설정
- 필터에 `google-analytics.com` 또는 `collect` 입력

### 3. 요청 확인
- `google-analytics.com/g/collect` 요청 확인
- 각 요청의 `en` 파라미터에서 이벤트 이름 확인:
  - `en=ugc_write_click`
  - `en=ugc_editor_enter`
  - `en=ugc_content_input_start`
  - `en=ugc_submit_attempt`
  - `en=ugc_submit_success`

## 중복 호출 방지 확인

### sessionStorage 확인
브라우저 콘솔에서 다음 명령어로 확인:

```javascript
// 에디터 진입 이벤트 추적 여부 확인
sessionStorage.getItem('ga4_ugc_editor_enter_[gallerySlug]')

// 내용 입력 시작 이벤트 추적 여부 확인
sessionStorage.getItem('ga4_ugc_content_input_start_[gallerySlug]')
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
- 같은 gallerySlug로 여러 번 테스트할 때는 브라우저를 새로고침하거나 시크릿 모드 사용

## 참고 사항

- 이벤트는 `PostCreate` 컴포넌트를 사용하는 페이지에서만 작동합니다
- 주요 적용 페이지: `/community/create`, `/community/gallery/[slug]` (글쓰기 모드)
- 자유게시판(`FreeBoard.tsx`)은 모달 형태로 글쓰기를 하므로 별도 구현이 필요할 수 있습니다

