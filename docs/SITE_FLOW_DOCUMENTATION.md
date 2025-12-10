# 🌐 Amiko 사이트 플로우 문서

## 📋 목차
1. [전체 플로우 개요](#전체-플로우-개요)
2. [랜딩 페이지 플로우](#랜딩-페이지-플로우)
3. [인증 플로우](#인증-플로우)
4. [메인 앱 플로우](#메인-앱-플로우)
5. [예약/결제 플로우](#예약결제-플로우)
6. [커뮤니티 플로우](#커뮤니티-플로우)
7. [관리자 플로우](#관리자-플로우)
8. [퀴즈 플로우](#퀴즈-플로우)

---

## 전체 플로우 개요

```
랜딩 페이지 (/) 
    ↓
[로그인/회원가입]
    ↓
메인 앱 (/main)
    ├─ 홈 탭
    ├─ 만남 탭 (영상통화 예약)
    ├─ 커뮤니티 탭
    ├─ 이벤트 탭
    └─ 내 정보 탭
```

---

## 랜딩 페이지 플로우

### 경로: `/` (홈페이지)

**주요 진입점:**
1. **Hero 섹션**
   - "상담 예약하기" 버튼 → `/booking/create`
   - "소개 영상 보기" 버튼 → 페이지 내 `#video` 섹션으로 스크롤

2. **Navbar (상단 네비게이션)**
   - 로그인/회원가입 → `/sign-in`
   - 소통멘토가입 → (준비 중)
   - 모바일 메뉴:
     - 상담 예약 → `/booking/create`
     - 소개 영상 → `#video` 섹션
     - 서비스 특징 → `#features` 섹션

3. **하단 CTA 섹션**
   - "시작하기" 버튼 → `/main`

**보호된 경로 접근 시:**
- 인증되지 않은 사용자가 보호된 경로 접근 → `/sign-in?redirectTo={원래경로}`로 리다이렉트

---

## 인증 플로우

### 1. 회원가입 플로우

**경로:** `/sign-up`

```
회원가입 페이지
    ↓
[이름, 이메일, 비밀번호, 전화번호, 생년월일, 국가 입력]
    ↓
전화번호 인증 (/verification)
    ├─ SMS 인증
    └─ WhatsApp 인증
    ↓
인증 완료 → 회원가입 완료
    ↓
자동 로그인 → /main
```

**주요 단계:**
1. 기본 정보 입력 (이름, 이메일, 비밀번호, 전화번호, 생년월일, 국가)
2. 전화번호 인증 (`/verification` 페이지)
   - SMS 또는 WhatsApp 선택
   - 인증코드 입력
3. 회원가입 완료 → 자동 로그인 → 메인 앱 이동

**네비게이션:**
- "이미 계정이 있으신가요?" → `/sign-in`

### 2. 로그인 플로우

**경로:** `/sign-in`

```
로그인 페이지
    ↓
[이메일/전화번호 + 비밀번호 입력]
    ↓
로그인 성공
    ↓
/main 또는 redirectTo 파라미터로 이동
```

**주요 기능:**
- 이메일 또는 전화번호로 로그인 가능
- 생체인증 (지문/Face ID) - 이전에 등록한 경우
- "계정이 없으신가요?" → `/sign-up`

**로그인 후 이동:**
- `redirectTo` 파라미터가 있으면 해당 경로로 이동
- 없으면 `/main`으로 이동

### 3. 전화번호 인증 플로우

**경로:** `/verification`

```
인증 페이지
    ↓
[SMS 또는 WhatsApp 선택]
    ↓
인증코드 발송
    ↓
인증코드 입력
    ↓
인증 완료
```

**사용 시나리오:**
- 회원가입 시 전화번호 인증
- 로그인 시 전화번호 인증 (선택적)

---

## 메인 앱 플로우

### 경로: `/main`

**탭 구조 (하단 네비게이션):**
1. **만남 탭** (`/main?tab=meet`)
   - 영상통화 예약
   - 상담사 목록
   - 예약 내역

2. **커뮤니티 탭** (`/main?tab=community`)
   - 게시글 목록
   - 카테고리별 게시판
   - 글쓰기

3. **홈 탭** (`/main?tab=home`)
   - 포인트 현황
   - 쿠폰 현황
   - 최근 활동
   - 출석 체크

4. **이벤트 탭** (`/main?tab=event`)
   - 진행 중인 이벤트
   - 이벤트 참여

5. **내 정보 탭** (`/main?tab=me`)
   - 프로필 정보
   - 예약 내역
   - 포인트 내역
   - 설정

**탭 이동:**
- 하단 네비게이션 바에서 탭 클릭
- URL 파라미터로 탭 전환: `/main?tab={tabName}`
- 로그인하지 않은 상태에서 "내 정보" 탭 클릭 → `/sign-in`으로 이동

**헤더 네비게이션:**
- 언어 변경 (한국어/스페인어)
- 알림
- 프로필 메뉴

---

## 예약/결제 플로우

### 1. 예약 생성 플로우

**경로:** `/booking/create`

```
예약 생성 페이지
    ↓
[상담사 선택]
    ↓
[예약 정보 입력]
    - 날짜/시간
    - 상담 주제
    - 설명
    ↓
예약 요청 생성
    ↓
예약 상세 페이지 (/bookings/{id})
```

**접근 경로:**
- 랜딩 페이지 Hero 섹션 "상담 예약하기" 버튼
- Navbar "상담 예약" 메뉴
- 메인 앱 만남 탭

### 2. 예약 상세 및 결제 플로우

**경로:** `/bookings/{id}`

```
예약 상세 페이지
    ↓
[예약 상태 확인]
    ├─ pending (대기 중)
    │   ├─ "결제하기" 버튼 → /payments/checkout?bookingId={id}
    │   ├─ "예약 변경" 버튼 → /bookings/{id}/edit
    │   └─ "예약 취소" 버튼
    │
    └─ confirmed (확정됨)
        ├─ "Google Meet 참여하기" → /call/{meetingId}
        └─ 결제 완료 메시지
```

### 3. 결제 플로우

**경로:** `/payments/checkout`

```
결제 페이지
    ↓
[예약 정보 확인]
    - 상담사 정보
    - 예약 시간
    - 금액
    ↓
PayPal 결제 버튼 클릭
    ↓
PayPal 결제 창
    ↓
결제 완료
    ↓
/payments/success?paypalOrderId={id}&orderId={id}&amount={amount}
    ↓
예약 상태 업데이트 (confirmed)
```

**결제 성공 후:**
- `/payments/success` 페이지에서 결제 완료 확인
- 예약 상태가 `confirmed`로 변경
- Google Meet 링크 생성 (있는 경우)

### 4. 영상통화 참여 플로우

**경로:** `/call/{meetingId}`

```
영상통화 페이지
    ↓
[Google Meet 링크 표시]
    ↓
"참여하기" 버튼 클릭
    ↓
새 탭에서 Google Meet 열기
```

**접근 조건:**
- 예약 상태가 `confirmed`
- 결제 완료
- 예약 시간 전후

---

## 커뮤니티 플로우

### 1. 커뮤니티 메인

**경로:** `/main?tab=community` 또는 `/community`

**카테고리:**
- 공지사항
- 자유게시판
- K-POP
- K-Drama
- 팬아트
- 아이돌짤
- 뷰티
- 한국어공부
- 스페인어공부
- 투표게시판

### 2. 게시글 작성 플로우

```
커뮤니티 탭
    ↓
"글쓰기" 버튼 클릭
    ↓
글쓰기 모달/페이지
    ↓
[제목, 내용, 카테고리 입력]
    ↓
게시글 작성 완료
    ↓
게시글 목록에 표시
```

### 3. 게시글 상세 플로우

**경로:** `/community/post/{id}` 또는 `/main?tab=community` (모달)

```
게시글 목록
    ↓
게시글 클릭
    ↓
게시글 상세 페이지
    ├─ 게시글 내용
    ├─ 댓글 목록
    ├─ 댓글 작성
    └─ 좋아요
```

### 4. 커뮤니티 서브페이지

**주요 경로:**
- `/community/fanart` - 팬아트 갤러리
- `/community/idol-photos` - 아이돌 사진
- `/community/k-chat` - K-채팅존
- `/community/news` - K-매거진
- `/community/polls` - 투표 게시판
- `/community/stories` - 스토리

---

## 관리자 플로우

### 경로: `/admin`

**접근 조건:**
- 로그인 필수
- 관리자 권한 필요 (`is_admin = true` 또는 `ADMIN_EMAIL` 환경변수와 일치)

**주요 페이지:**
- `/admin` - 대시보드
- `/admin/users` - 사용자 관리
- `/admin/bookings` - 예약 관리
- `/admin/consultants` - 상담사 관리
- `/admin/payments` - 결제 관리
- `/admin/notifications` - 알림 관리
- `/admin/points` - 포인트 관리
- `/admin/events` - 이벤트 관리
- `/admin/quiz-creator` - 퀴즈 생성

**접근 시도:**
- 비관리자가 접근 시 → `/main`으로 리다이렉트

---

## 퀴즈 플로우

### 1. 퀴즈 목록

**경로:** `/quiz` 또는 메인 앱 내 퀴즈 섹션

**주요 퀴즈:**
- 한국어 레벨 테스트 (`/quiz/korean-level`)
- 아이돌 포지션 퀴즈 (`/quiz/idol-position`)
- MBTI 퀴즈 (`/quiz/mbti-kpop`, `/quiz/mbti-celeb`)
- 운세 퀴즈 (`/quiz/fortune`)
- 별자리 퀴즈 (`/quiz/zodiac`)
- 사랑 스타일 (`/quiz/love-style`)

### 2. 퀴즈 진행 플로우

```
퀴즈 시작 페이지
    ↓
"시작하기" 버튼
    ↓
질문 페이지 (/quiz/{id}/questions)
    ↓
[질문에 답변]
    ↓
결과 페이지 (/quiz/{id}/result)
    ↓
결과 공유 또는 다시하기
```

**예시: 한국어 레벨 테스트**
1. `/quiz/korean-level` - 소개 페이지
2. `/quiz/korean-level/start` - 시작 페이지
3. `/quiz/korean-level/questions` - 질문 페이지
4. `/quiz/korean-level/result/{resultId}` - 결과 페이지

---

## 보호된 경로 (인증 필요)

**middleware.ts에서 보호하는 경로:**

```typescript
const protectedPaths = [
  '/profile',
  '/bookings',
  '/payments',
  '/notifications',
  '/community',
  '/lounge',
  '/consultants',
  '/checkout',
  '/chat-test'
]
```

**접근 시:**
- 인증되지 않은 사용자 → `/sign-in?redirectTo={원래경로}`로 리다이렉트

---

## 공개 경로 (인증 불필요)

```typescript
const publicPaths = [
  '/',
  '/about',
  '/faq',
  '/privacy',
  '/terms',
  '/inquiry',
  '/partnership',
  '/sign-in',
  '/sign-up',
  '/forgot-password',
  '/reset-password',
  '/verify',
  '/verification',
  '/auth/callback',
  '/main'  // 메인 앱은 공개이지만 일부 기능은 인증 필요
]
```

---

## 주요 네비게이션 컴포넌트

### 1. Navbar (상단)
- **위치:** 랜딩 페이지 상단
- **기능:**
  - 로그인/회원가입
  - 소통멘토가입
  - 모바일 메뉴

### 2. BottomTabNavigation (하단)
- **위치:** 메인 앱 하단 (모바일만)
- **탭:**
  - 만남 (Video)
  - 커뮤니티 (MessageSquare)
  - 홈 (Home)
  - 이벤트 (Calendar)
  - 내 정보 (User)

### 3. Header (메인 앱 상단)
- **위치:** 메인 앱 상단
- **기능:**
  - 언어 변경
  - 알림
  - 프로필 메뉴
  - 탭 전환 (데스크톱)

---

## 플로우 다이어그램

### 전체 사용자 여정

```
랜딩 페이지 (/)
    │
    ├─→ 로그인/회원가입 (/sign-in, /sign-up)
    │       │
    │       └─→ 전화번호 인증 (/verification)
    │               │
    │               └─→ 메인 앱 (/main)
    │
    ├─→ 상담 예약 (/booking/create)
    │       │
    │       └─→ 예약 상세 (/bookings/{id})
    │               │
    │               └─→ 결제 (/payments/checkout)
    │                       │
    │                       └─→ 결제 성공 (/payments/success)
    │                               │
    │                               └─→ 영상통화 (/call/{meetingId})
    │
    └─→ 메인 앱 (/main)
            │
            ├─→ 홈 탭
            ├─→ 만남 탭
            ├─→ 커뮤니티 탭
            │       │
            │       ├─→ 게시글 작성
            │       ├─→ 게시글 상세
            │       └─→ 댓글 작성
            │
            ├─→ 이벤트 탭
            └─→ 내 정보 탭
                    │
                    ├─→ 프로필 설정
                    ├─→ 예약 내역
                    └─→ 포인트 내역
```

---

## 주요 리다이렉트 규칙

1. **로그인 후:**
   - `redirectTo` 파라미터가 있으면 해당 경로로 이동
   - 없으면 `/main`으로 이동

2. **로그아웃 후:**
   - `/` (랜딩 페이지)로 이동

3. **보호된 경로 접근 시:**
   - `/sign-in?redirectTo={원래경로}`로 리다이렉트

4. **관리자 권한 없이 `/admin` 접근 시:**
   - `/main`으로 리다이렉트

---

## 모바일 vs 데스크톱 차이

### 모바일
- 하단 탭 네비게이션 표시
- 햄버거 메뉴 (랜딩 페이지)
- 터치 최적화 UI

### 데스크톱
- 상단 헤더 네비게이션
- 하단 탭 네비게이션 숨김
- 마우스 호버 효과

---

**작성일:** 2025-12-09
**최종 업데이트:** 2025-12-09
