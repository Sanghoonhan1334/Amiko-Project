# GA4 이벤트 구현 감사 보고서

## 📋 개요
이 문서는 GA4 이벤트 체크리스트에 대한 구현 상태를 정리한 보고서입니다.

---

## ✅ 이미 존재했던 이벤트 (기존 코드에서 발견)

### 퍼널 1: 랜딩 → 관심 행동 퍼널
- ✅ `page_view` - GA4 config에서 자동 처리 (Analytics.tsx)
- ✅ `view_home_tab` - `appEngagementEvents.visitHomeTab()` (main/page.tsx) [이벤트명 변경: visit_home_tab → view_home_tab]
- ✅ `view_community_tab` - `appEngagementEvents.visitCommunityTab()` (main/page.tsx) [이벤트명 변경: visit_community_tab → view_community_tab]
- ✅ `view_post` - `communityEvents.viewPost()` (PostDetail.tsx, CommunityMain.tsx)

### 퍼널 2: 커뮤니티 활동 퍼널
- ✅ `view_home_tab` - 기존 구현 [이벤트명 변경: visit_home_tab → view_home_tab]
- ✅ `view_community_tab` - 기존 구현 [이벤트명 변경: visit_community_tab → view_community_tab]
- ✅ `view_post` - 기존 구현

### 퍼널 3: 재방문 퍼널
- ✅ `view_home_tab` - 기존 구현 [이벤트명 변경: visit_home_tab → view_home_tab]
- ✅ `view_community_tab` - 기존 구현 [이벤트명 변경: visit_community_tab → view_community_tab]
- ✅ `view_post` - 기존 구현

### 퍼널 4: 글쓰기 퍼널
- ❌ 없음 (모두 새로 추가됨)

### 퍼널 5: 회원가입 상세 퍼널
- ✅ `start_sign_up` - `signUpEvents.startSignUp()` (sign-up/page.tsx)
- ✅ `enter_phone` - `signUpEvents.enterPhone()` (sign-up/page.tsx)
- ✅ `verify_phone` - `signUpEvents.verifyPhone()` (sign-up/page.tsx)
- ✅ `complete_sign_up` - `signUpEvents.completeSignUp()` (sign-up/page.tsx)

### 퍼널 6: 로그인 흐름 퍼널
- ✅ `start_sign_in` - `signInEvents.startSignIn()` (sign-in/page.tsx)
- ✅ `enter_email` - `signInEvents.enterEmail()` (sign-in/page.tsx)
- ✅ `enter_password` - `signInEvents.enterPassword()` (sign-in/page.tsx)
- ✅ `sign_in_success` - `signInEvents.signInSuccess()` (sign-in/page.tsx)

### 퍼널 7: 커뮤니티 내 깊이 퍼널
- ✅ `view_home_tab` - 기존 구현 [이벤트명 변경: visit_home_tab → view_home_tab]
- ✅ `view_community_tab` - 기존 구현 [이벤트명 변경: visit_community_tab → view_community_tab]
- ✅ `view_post` - 기존 구현

---

## 🆕 새로 추가된 이벤트

### 퍼널 1: 랜딩 → 관심 행동 퍼널
1. **`scroll`** - 스크롤 이벤트
   - 위치: `src/lib/analytics.ts` (marketingEvents.scroll)
   - 통합: `src/components/main/app/community/PostDetail.tsx` (스크롤 핸들러)

2. **`user_engagement`** - 사용자 참여도
   - 위치: `src/lib/analytics.ts` (marketingEvents.userEngagement)
   - 통합: (향후 구현 가능)

3. **`returning_users`** - 재방문 사용자
   - 위치: `src/lib/analytics.ts` (marketingEvents.returningUsers)
   - 통합: `src/app/main/page.tsx` (localStorage 기반 감지)

### 퍼널 2: 커뮤니티 활동 퍼널
4. **`view_category`** - 카테고리 방문 [이벤트명 변경: visit_category → view_category]
   - 위치: `src/lib/analytics.ts` (communityEvents.visitCategory)
   - 통합: 
     - `src/components/main/app/community/CommunityMain.tsx` (handleGallerySelect)
     - `src/app/community/gallery/[slug]/page.tsx` (fetchGallery)

5. **`click_write_post`** - 게시물 작성 버튼 클릭
   - 위치: `src/lib/analytics.ts` (communityEvents.clickWritePost)
   - 통합: `src/components/main/app/community/PostCreate.tsx` (useEffect)

6. **`start_post`** - 게시물 작성 시작
   - 위치: `src/lib/analytics.ts` (communityEvents.startPost)
   - 통합: `src/components/main/app/community/PostCreate.tsx` (useEffect)

7. **`write_title`** - 제목 작성
   - 위치: `src/lib/analytics.ts` (communityEvents.writeTitle)
   - 통합: `src/components/main/app/community/PostCreate.tsx` (title input onChange)

8. **`write_content`** - 내용 작성
   - 위치: `src/lib/analytics.ts` (communityEvents.writeContent)
   - 통합: `src/components/main/app/community/PostCreate.tsx` (content textarea onChange)

9. **`submit_post`** - 게시물 제출
   - 위치: `src/lib/analytics.ts` (communityEvents.submitPost)
   - 통합: `src/components/main/app/community/PostCreate.tsx` (handleSubmit)

10. **`post_success`** - 게시물 작성 성공
    - 위치: `src/lib/analytics.ts` (communityEvents.postSuccess)
    - 통합: `src/components/main/app/community/PostCreate.tsx` (handleSubmit 성공 시)

### 퍼널 3: 재방문 퍼널
11. **`returning_users`** - 재방문 사용자
    - 위치: `src/lib/analytics.ts` (marketingEvents.returningUsers)
    - 통합: `src/app/main/page.tsx` (localStorage 기반 감지)

### 퍼널 4: 글쓰기 퍼널
12. **`click_write_post`** - 기존 추가됨
13. **`start_post`** - 기존 추가됨
14. **`write_title`** - 기존 추가됨
15. **`write_content`** - 기존 추가됨
16. **`submit_post`** - 기존 추가됨
17. **`post_success`** - 기존 추가됨

### 퍼널 5: 회원가입 상세 퍼널
18. **`form_start`** - 폼 시작
    - 위치: `src/lib/analytics.ts` (signUpEvents.formStart)
    - 통합: `src/app/sign-up/page.tsx` (useEffect)

19. **`enter_email`** - 이메일 입력 (회원가입)
    - 위치: `src/lib/analytics.ts` (signUpEvents.enterEmail)
    - 통합: `src/app/sign-up/page.tsx` (handleInputChange)

20. **`enter_password`** - 비밀번호 입력 (회원가입)
    - 위치: `src/lib/analytics.ts` (signUpEvents.enterPassword)
    - 통합: `src/app/sign-up/page.tsx` (handleInputChange)

21. **`enter_birthday`** - 생년월일 입력
    - 위치: `src/lib/analytics.ts` (signUpEvents.enterBirthday)
    - 통합: `src/app/sign-up/page.tsx` (handleInputChange)

22. **`enter_nickname`** - 닉네임 입력
    - 위치: `src/lib/analytics.ts` (signUpEvents.enterNickname)
    - 통합: `src/app/sign-up/page.tsx` (handleInputChange)

23. **`verify_email`** - 이메일 인증 완료
    - 위치: `src/lib/analytics.ts` (signUpEvents.verifyEmail)
    - 통합: (향후 이메일 인증 기능 추가 시)

24. **`password_ok`** - 비밀번호 검증 통과
    - 위치: `src/lib/analytics.ts` (signUpEvents.passwordOk)
    - 통합: `src/app/sign-up/page.tsx` (validatePassword)

25. **`birthday_ok`** - 생년월일 검증 통과
    - 위치: `src/lib/analytics.ts` (signUpEvents.birthdayOk)
    - 통합: `src/app/sign-up/page.tsx` (handleInputChange)

26. **`nickname_ok`** - 닉네임 검증 통과
    - 위치: `src/lib/analytics.ts` (signUpEvents.nicknameOk)
    - 통합: `src/app/sign-up/page.tsx` (validateNickname)

27. **`submit_register`** - 회원가입 제출
    - 위치: `src/lib/analytics.ts` (signUpEvents.submitRegister)
    - 통합: `src/app/sign-up/page.tsx` (handleFormSubmit)

28. **`register_click`** - 회원가입 버튼 클릭
    - 위치: `src/lib/analytics.ts` (signUpEvents.registerClick)
    - 통합: `src/app/sign-up/page.tsx` (handleFormSubmit)

29. **`create_user`** - 사용자 생성
    - 위치: `src/lib/analytics.ts` (signUpEvents.createUser)
    - 통합: `src/app/sign-up/page.tsx` (handleSignUp 성공 시)

30. **`sign_up_success`** - 회원가입 성공
    - 위치: `src/lib/analytics.ts` (signUpEvents.signUpSuccess)
    - 통합: `src/app/sign-up/page.tsx` (handleSignUp 성공 시)

### 퍼널 6: 로그인 흐름 퍼널
31. **`visit_login`** - 로그인 페이지 방문
    - 위치: `src/lib/analytics.ts` (signInEvents.visitLogin)
    - 통합: `src/app/sign-in/page.tsx` (useEffect)

32. **`enter_login_email`** - 로그인 이메일 입력
    - 위치: `src/lib/analytics.ts` (signInEvents.enterLoginEmail)
    - 통합: `src/app/sign-in/page.tsx` (handleInputChange)

33. **`enter_login_password`** - 로그인 비밀번호 입력
    - 위치: `src/lib/analytics.ts` (signInEvents.enterLoginPassword)
    - 통합: `src/app/sign-in/page.tsx` (handleInputChange)

34. **`login_attempt`** - 로그인 시도
    - 위치: `src/lib/analytics.ts` (signInEvents.loginAttempt)
    - 통합: `src/app/sign-in/page.tsx` (handleSignIn)

35. **`login_success`** - 로그인 성공
    - 위치: `src/lib/analytics.ts` (signInEvents.loginSuccess)
    - 통합: `src/app/sign-in/page.tsx` (handleSignIn 성공 시)

### 퍼널 7: 커뮤니티 내 깊이 퍼널
36. **`view_category`** - 기존 추가됨 [이벤트명 변경: visit_category → view_category]
37. **`read_time`** - 읽기 시간
    - 위치: `src/lib/analytics.ts` (communityEvents.readTime)
    - 통합: `src/components/main/app/community/PostDetail.tsx` (useEffect, 30초마다)

38. **`scroll_depth`** - 스크롤 깊이
    - 위치: `src/lib/analytics.ts` (communityEvents.scrollDepth)
    - 통합: `src/components/main/app/community/PostDetail.tsx` (스크롤 핸들러)

---

## 📝 코드 패치 요약

### 1. `src/lib/analytics.ts`
**추가된 함수들:**
- `marketingEvents.scroll()` - 스크롤 이벤트
- `marketingEvents.userEngagement()` - 사용자 참여도
- `marketingEvents.returningUsers()` - 재방문 사용자
- `signUpEvents.formStart()` - 폼 시작
- `signUpEvents.enterEmail()` - 이메일 입력
- `signUpEvents.enterPassword()` - 비밀번호 입력
- `signUpEvents.enterBirthday()` - 생년월일 입력
- `signUpEvents.enterNickname()` - 닉네임 입력
- `signUpEvents.verifyEmail()` - 이메일 인증
- `signUpEvents.passwordOk()` - 비밀번호 검증 통과
- `signUpEvents.birthdayOk()` - 생년월일 검증 통과
- `signUpEvents.nicknameOk()` - 닉네임 검증 통과
- `signUpEvents.submitRegister()` - 회원가입 제출
- `signUpEvents.registerClick()` - 회원가입 버튼 클릭
- `signUpEvents.createUser()` - 사용자 생성
- `signUpEvents.signUpSuccess()` - 회원가입 성공
- `signInEvents.visitLogin()` - 로그인 페이지 방문
- `signInEvents.enterLoginEmail()` - 로그인 이메일 입력
- `signInEvents.enterLoginPassword()` - 로그인 비밀번호 입력
- `signInEvents.loginAttempt()` - 로그인 시도
- `signInEvents.loginSuccess()` - 로그인 성공
- `communityEvents.visitCategory()` - 카테고리 방문 [이벤트명: view_category]
- `communityEvents.clickWritePost()` - 게시물 작성 버튼 클릭
- `communityEvents.startPost()` - 게시물 작성 시작
- `communityEvents.writeTitle()` - 제목 작성
- `communityEvents.writeContent()` - 내용 작성
- `communityEvents.submitPost()` - 게시물 제출
- `communityEvents.postSuccess()` - 게시물 작성 성공
- `communityEvents.readTime()` - 읽기 시간
- `communityEvents.scrollDepth()` - 스크롤 깊이

### 2. `src/app/sign-up/page.tsx`
**추가된 이벤트 호출:**
- `formStart()` - 컴포넌트 마운트 시
- `enterEmail()` - 이메일 입력 시
- `enterPassword()` - 비밀번호 입력 시
- `enterNickname()` - 닉네임 입력 시
- `enterBirthday()` - 생년월일 입력 시
- `passwordOk()` - 비밀번호 검증 통과 시
- `birthdayOk()` - 생년월일 검증 통과 시
- `nicknameOk()` - 닉네임 검증 통과 시
- `registerClick()` - 회원가입 버튼 클릭 시
- `submitRegister()` - 폼 제출 시
- `createUser()` - 사용자 생성 성공 시
- `signUpSuccess()` - 회원가입 성공 시

### 3. `src/app/sign-in/page.tsx`
**추가된 이벤트 호출:**
- `visitLogin()` - 컴포넌트 마운트 시
- `enterLoginEmail()` - 이메일 입력 시
- `enterLoginPassword()` - 비밀번호 입력 시
- `loginAttempt()` - 로그인 시도 시
- `loginSuccess()` - 로그인 성공 시

### 4. `src/components/main/app/community/PostCreate.tsx`
**추가된 이벤트 호출:**
- `clickWritePost()` - 컴포넌트 마운트 시
- `startPost()` - 컴포넌트 마운트 시
- `writeTitle()` - 제목 입력 시
- `writeContent()` - 내용 입력 시
- `submitPost()` - 게시물 제출 시
- `postSuccess()` - 게시물 작성 성공 시

### 5. `src/components/main/app/community/PostDetail.tsx`
**추가된 이벤트 호출:**
- `readTime()` - 30초마다 및 컴포넌트 언마운트 시
- `scrollDepth()` - 스크롤 깊이 변경 시
- `scroll()` - 스크롤 마일스톤 (25%, 50%, 75%, 100%) 도달 시

### 6. `src/components/main/app/community/CommunityMain.tsx`
**추가된 이벤트 호출:**
- `visitCategory()` - 갤러리 선택 시

### 7. `src/app/community/gallery/[slug]/page.tsx`
**추가된 이벤트 호출:**
- `visitCategory()` - 갤러리 로드 시

### 8. `src/app/main/page.tsx`
**추가된 이벤트 호출:**
- `returningUsers()` - 24시간 이상 경과 후 재방문 시

---

## 📊 통계

### 총 이벤트 수: 38개
- ✅ 기존 이벤트: 10개
- 🆕 새로 추가된 이벤트: 28개

### 퍼널별 분류
- **퍼널 1 (랜딩 → 관심 행동)**: 3개 추가
- **퍼널 2 (커뮤니티 활동)**: 7개 추가
- **퍼널 3 (재방문)**: 1개 추가 (중복)
- **퍼널 4 (글쓰기)**: 6개 추가
- **퍼널 5 (회원가입 상세)**: 13개 추가
- **퍼널 6 (로그인 흐름)**: 5개 추가
- **퍼널 7 (커뮤니티 내 깊이)**: 3개 추가

---

## ✅ 구현 완료 상태

모든 필수 이벤트가 구현되었습니다. 다음 이벤트들은 향후 기능 추가 시 구현 가능합니다:

- `user_engagement` - 사용자 참여도 (세션 시간 기반, 향후 구현 가능)
- `verify_email` - 이메일 인증 (현재 이메일 인증 단계가 제거되어 있음)

---

## 🔍 검증 방법

1. 브라우저 개발자 도구 콘솔에서 `[GA4] Event tracked:` 로그 확인
2. GA4 실시간 보고서에서 이벤트 수신 확인
3. 각 UI 액션 수행 시 해당 이벤트가 전송되는지 확인

---

**마지막 업데이트**: 2025-01-29

