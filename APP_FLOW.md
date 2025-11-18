# 📱 Amiko 앱 플로우 다이어그램

## 🚀 메인 플로우

```
┌─────────────┐
│  랜딩 페이지 │ (/)
└──────┬──────┘
       │
       ├─→ 로그인 (/sign-in)
       │     │
       │     ├─→ 비밀번호 찾기 (/forgot-password)
       │     │
       │     └─→ 메인 앱 (/main)
       │
       └─→ 회원가입 (/sign-up)
             │
             ├─→ 휴대폰 인증 (/verification-center)
             │     │
             │     └─→ 메인 앱 (/main)
             │
             └─→ 약관 동의 (/terms, /privacy)
```

---

## 📍 메인 앱 구조 (/main)

```
┌─────────────────────────────────────────────────┐
│              메인 앱 (SPA)                       │
│  ┌──────────────────────────────────────────┐  │
│  │  상단 헤더 (Header)                       │  │
│  │  - 로고, 검색, 알림, 포인트              │  │
│  └──────────────────────────────────────────┘  │
│                                                 │
│  ┌──────────────────────────────────────────┐  │
│  │  메인 콘텐츠 영역 (탭별 콘텐츠)          │  │
│  │                                           │  │
│  │  🏠 HomeTab (홈)                          │  │
│  │     ├─ 대시보드                           │  │
│  │     ├─ 최근 활동                          │  │
│  │     └─ 추천 콘텐츠                        │  │
│  │                                           │  │
│  │  💬 MeetTab (만남)                        │  │
│  │     ├─ 대화 상대 목록                     │  │
│  │     ├─ 채팅                               │  │
│  │     └─ 영상 통화 (Coming Soon)            │  │
│  │                                           │  │
│  │  👥 CommunityTab (커뮤니티)               │  │
│  │     └─ [커뮤니티 플로우 참조]            │  │
│  │                                           │  │
│  │  ⚡ EventTab (이벤트)                     │  │
│  │     ├─ 진행 중인 이벤트                   │  │
│  │     └─ 출석 체크                          │  │
│  │                                           │  │
│  │  🔋 ChargingTab (충전)                    │  │
│  │     └─ 포인트 충전                        │  │
│  │                                           │  │
│  │  👤 MyTab (내 정보)                       │  │
│  │     ├─ 프로필 관리                        │  │
│  │     ├─ 포인트 내역                        │  │
│  │     ├─ 스토리 설정                        │  │
│  │     └─ 계정 삭제                          │  │
│  └──────────────────────────────────────────┘  │
│                                                 │
│  ┌──────────────────────────────────────────┐  │
│  │  하단 탭 네비게이션                        │  │
│  │  [홈] [만남] [커뮤니티] [이벤트] [내정보] │  │
│  └──────────────────────────────────────────┘  │
└─────────────────────────────────────────────────┘
```

---

## 👥 커뮤니티 플로우

```
메인 앱 → CommunityTab
   │
   ├─→ 홈 (/main?tab=community)
   │     ├─ 갤러리 목록 (galleries)
   │     │     │
   │     │     └─→ 갤러리별 게시물 (/community/gallery/[slug])
   │     │           │
   │     │           └─→ 게시물 상세 (/community/post/[id])
   │     │                 ├─ 댓글 작성
   │     │                 ├─ 좋아요/북마크
   │     │                 ├─ 신고하기
   │     │                 └─ 프로필 보기 (모달)
   │     │
   │     ├─ 자유게시판 (/community/freeboard)
   │     │     │
   │     │     └─→ 게시물 상세 (/community/post/[id])
   │     │
   │     ├─ 인기 게시물 (/community/popular)
   │     │
   │     ├─ 퀴즈/테스트 (/community/tests)
   │     │     │
   │     │     └─→ 운세 테스트 (/quiz/fortune)
   │     │           ├─ 시작 (/quiz/fortune/start)
   │     │           ├─ 질문 (/quiz/fortune/questions)
   │     │           ├─ 로딩 (/quiz/fortune/loading)
   │     │           └─ 결과 (/quiz/fortune/result)
   │     │
   │     ├─ 갤러리별 게시물 작성 (/community/create?gallery=[slug])
   │     │
   │     └─ 기타
   │           ├─ 팬아트 (/community/fanart)
   │           ├─ 아이돌 사진 (/community/idol-photos)
   │           ├─ K-Chat (/community/k-chat)
   │           └─ Q&A (/community/qa)
   │
   └─→ 갤러리/게시물 상세 직접 접근 (/community/*)
```

---

## 🎯 퀴즈 플로우

```
메인 앱 → CommunityTab → 테스트 목록 (/community/tests)
   │
   └─→ 운세 테스트 (/quiz/fortune)
         │
         ├─→ 시작 페이지 (/quiz/fortune/start)
         │     └─ 참여자 수 표시
         │
         ├─→ 질문 페이지 (/quiz/fortune/questions)
         │     ├─ 질문 1-10
         │     ├─ 답변 선택
         │     └─ 다음 버튼
         │
         ├─→ 로딩 페이지 (/quiz/fortune/loading)
         │
         └─→ 결과 페이지 (/quiz/fortune/result)
               ├─ 운세 결과 표시 (일일 고정)
               ├─ 결과 공유
               ├─ 다시 테스트
               └─ 다른 테스트 보기
```

**다른 퀴즈들:**
- MBTI K-POP (/quiz/mbti-kpop)
- MBTI 셀럽 (/quiz/mbti-celeb)
- 사랑 스타일 (/quiz/love-style)
- 한국어 레벨 (/quiz/korean-level)
- 아이돌 포지션 (/quiz/idol-position)
- 별자리 (/quiz/zodiac)

---

## 💼 예약 플로우

```
메인 앱 → MeetTab 또는 /consultants
   │
   ├─→ 상담사 목록 (/consultants)
   │     │
   │     └─→ 상담사 상세
   │           │
   │           └─→ 예약 생성 (/booking/create)
   │                 │
   │                 └─→ 예약 확인 (/bookings/[id])
   │                       │
   │                       └─→ 예약 완료 후 리뷰 (/bookings/[id]/review)
   │
   └─→ 내 예약 목록 (/bookings)
         │
         └─→ 예약 상세 (/bookings/[id])
               ├─ 예약 수정 (/bookings/[id]/edit)
               └─ 리뷰 작성 (/bookings/[id]/review)
```

---

## 👤 프로필/계정 플로우

```
메인 앱 → MyTab
   │
   ├─→ 프로필 보기
   │     └─→ 프로필 모달 (UserProfileModal)
   │           ├─ API 번역 (한국어 ↔ 스페인어)
   │           ├─ 관심사 표시
   │           ├─ 직업 정보
   │           └─ 신고하기
   │
   ├─→ 프로필 설정 (/profile/settings)
   │
   ├─→ 스토리 설정
   │
   ├─→ 포인트 내역
   │
   └─→ 계정 삭제
         ├─→ 삭제 확인 다이얼로그
         ├─→ "DELETE" 입력 확인
         ├─→ SQL 함수 실행 (delete_user_account)
         │     ├─ users 테이블 익명화
         │     ├─ 관련 테이블 데이터 삭제
         │     ├─ auth.users에서 계정 제거
         │     └─ 삭제 로그 기록
         ├─→ 삭제 완료 메시지 표시
         ├─→ localStorage/sessionStorage 정리
         └─→ 로그인 페이지로 리다이렉트 (/sign-in?accountDeleted=1)
```

**계정 삭제 특징:**
- ✅ **완전 삭제**: SQL 함수를 통한 모든 관련 데이터 삭제
- ✅ **재가입 가능**: 삭제된 계정의 이메일/전화번호로 재가입 가능
- ✅ **데이터 익명화**: 개인정보는 익명화 처리 후 삭제
- ✅ **삭제 로그**: 모든 삭제 작업은 `data_deletion_logs` 테이블에 기록

---

## 🔐 인증 플로우

### 📝 회원가입 플로우 (최신 변경사항 반영)

```
랜딩 페이지 → 회원가입 (/sign-up)
   │
   ├─→ Step 1: 기본 정보 입력
   │     ├─ 이름 (full_name)
   │     ├─ 닉네임 (3-20자, 알파벳/숫자/특수문자)
   │     ├─ 이메일 (로그인 ID로 사용, 오타 감지 기능)
   │     ├─ 비밀번호 (최소 8자, 숫자/특수문자 포함)
   │     ├─ 생년월일 (만 13세 이상)
   │     ├─ 전화번호 (로그인 ID로 사용, 국가별 형식)
   │     └─ 국적 선택
   │
   ├─→ Step 2: 이메일/전화번호 중복 확인
   │     ├─ 이메일 중복 체크 (삭제된 계정 제외)
   │     └─ 전화번호 중복 체크
   │
   ├─→ Step 3: SMS 인증 (이메일 인증 단계 제거됨)
   │     ├─ SMS 인증코드 발송
   │     ├─ 인증코드 입력 (6자리)
   │     ├─ 인증 성공 시 자동 회원가입 처리
   │     └─ SMS 실패 시 WhatsApp 자동 전환
   │
   └─→ 회원가입 완료
         ├─ Supabase Auth 사용자 생성
         ├─ users 테이블에 데이터 저장
         ├─ 추천인 코드 자동 생성
         └─ 로그인 페이지로 리다이렉트 (/sign-in)
```

**주요 변경사항:**
- ✅ **이메일 인증 단계 제거**: 회원가입 시 이메일 인증 없이 바로 SMS 인증 진행
- ✅ **이중 로그인 ID**: 이메일 또는 전화번호 둘 다 로그인 ID로 사용 가능
- ✅ **이메일 오타 감지**: "gamil.com" → "gmail.com" 자동 감지 및 안내
- ✅ **삭제된 계정 재가입**: `deleted_at`이 있는 계정은 재가입 가능
- ✅ **Basic Tier 인증**: SMS 1차 인증 완료 시 기본 기능 사용 가능 (게시글, 댓글, 좋아요 등)

---

### 🔑 로그인 플로우

```
랜딩 페이지 → 로그인 (/sign-in)
   │
   ├─→ 일반 로그인
   │     ├─ 이메일 또는 전화번호 입력 (identifier)
   │     ├─ 비밀번호 입력
   │     ├─ 로그인 버튼 클릭
   │     └─ 세션 생성 후 메인 앱으로 이동 (/main)
   │
   └─→ 비밀번호 찾기 (/forgot-password)
         └─ 이메일/전화번호로 비밀번호 재설정 링크 발송
```

**로그인 ID:**
- 이메일 주소 (예: `user@example.com`)
- 전화번호 (예: `+821012345678` 또는 `010-1234-5678`)

---

### 🎯 인증 티어 시스템

```
┌─────────────────────────────────────────────────┐
│  Basic Tier (1차 인증) - 회원가입 시 완료        │
├─────────────────────────────────────────────────┤
│  ✅ SMS 인증 완료                                 │
│  ✅ 게시글 작성/댓글 작성                         │
│  ✅ 좋아요/북마크                                 │
│  ✅ 커뮤니티 참여                                 │
│  ✅ 이벤트 참여                                   │
│  ✅ 퀴즈/테스트 참여                              │
└─────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────┐
│  Advanced Tier (2차 인증) - Verification Center   │
├─────────────────────────────────────────────────┤
│  ⚠️  프로필 완성 필요                             │
│  ⚠️  실명 인증 필요                               │
│  ✅ 영상 통화                                     │
│  ✅ 포인트 교환/결제                              │
│  ✅ 고위험 기능                                   │
└─────────────────────────────────────────────────┘
```

**Verification Center 접근:**
- MyTab > 프로필 보기 클릭 → 확인 다이얼로그 → Verification Center 이동
- MeetTab > 영상 통화 클릭 → 확인 다이얼로그 → Verification Center 이동
- `/verification-center` 직접 접근

**Verification Center 완료 시:**
- 프로필 정보 저장 (대학, 전공, 직업 등)
- `is_verified: true` 설정
- Advanced Tier 기능 사용 가능

---

## 🎁 포인트 시스템 플로우

```
활동 수행
   │
   ├─→ 게시글 작성 (+10 포인트)
   ├─→ 댓글 작성 (+1 포인트)
   ├─→ 좋아요/북마크 (+5 포인트)
   ├─→ 출석 체크 (+5 포인트)
   └─→ 일일 활동 제한 (150 포인트/일)
         │
         └─→ 포인트 내역 (MyTab)
               └─→ 충전 (ChargingTab)
```

---

## 🔔 알림 플로우

```
이벤트 발생
   │
   ├─→ 댓글 알림
   ├─→ 좋아요 알림
   ├─→ 메시지 알림
   └─→ 시스템 알림
         │
         └─→ 알림 목록 (/notifications)
               └─→ 알림 설정 (/notifications/settings)
```

---

## 🛒 결제 플로우

```
충전 탭 (ChargingTab) 또는 포인트 충전 버튼
   │
   └─→ 결제 페이지 (/payments)
         │
         ├─→ 체크아웃 (/payments/checkout)
         │     │
         │     └─→ 결제 성공 (/payments/success)
         │
         └─→ 결제 취소 (/payments/cancel)
```

---

## 👨‍💼 관리자 플로우

```
관리자 로그인 → /admin
   │
   ├─→ 대시보드 (/admin)
   │
   ├─→ 사용자 관리 (/admin/users)
   │
   ├─→ 신고 관리 (/admin/reports)
   │
   ├─→ 포인트 관리 (/admin/points)
   │
   ├─→ 예약 관리 (/admin/bookings)
   │
   ├─→ 이벤트 관리 (/admin/events)
   │
   ├─→ 뉴스 관리 (/admin/news)
   │
   ├─→ 상담사 관리 (/admin/consultants)
   │
   └─→ 결제 관리 (/admin/payments)
```

---

## 📱 주요 페이지 맵

```
/
├─ /sign-in (로그인)
├─ /sign-up (회원가입)
├─ /forgot-password (비밀번호 찾기)
├─ /verification-center (휴대폰 인증)
│
├─ /main (메인 앱 - SPA)
│   └─ ?tab=home|meet|community|event|charging|me
│
├─ /community
│   ├─ /freeboard (자유게시판)
│   ├─ /popular (인기 게시물)
│   ├─ /tests (테스트 목록)
│   ├─ /gallery/[slug] (갤러리별 게시물)
│   ├─ /post/[id] (게시물 상세)
│   ├─ /create (게시물 작성)
│   ├─ /fanart (팬아트)
│   ├─ /idol-photos (아이돌 사진)
│   └─ /k-chat (K-Chat)
│
├─ /quiz
│   ├─ /fortune (운세 테스트)
│   ├─ /mbti-kpop (MBTI K-POP)
│   └─ /[id] (기타 퀴즈)
│
├─ /bookings (예약 관리)
├─ /consultants (상담사 목록)
├─ /profile/settings (프로필 설정)
├─ /notifications (알림)
├─ /payments (결제)
│
└─ /admin (관리자)
```

---

## 🔄 주요 상태 관리

- **인증**: `AuthContext` (전역 인증 상태)
- **언어**: `LanguageContext` (한국어/스페인어)
- **포인트**: Header 컴포넌트 (상단 표시)
- **알림**: NotificationBell 컴포넌트
- **탭 상태**: URL 쿼리 파라미터 (`?tab=community`)

---

---

## 📋 최근 주요 변경사항 (2025-01-28 이후)

### 🔄 회원가입 플로우 개선
1. **이메일 인증 단계 제거**: 회원가입 시 이메일 인증 없이 SMS 인증만 진행
2. **이중 로그인 ID**: 이메일 또는 전화번호 둘 다 로그인 ID로 사용 가능
3. **이메일 오타 감지**: 일반적인 이메일 도메인 오타 자동 감지 및 안내
4. **삭제된 계정 재가입**: `deleted_at`이 있는 계정은 재가입 가능하도록 개선

### 🔐 인증 티어 시스템 도입
1. **Basic Tier (1차 인증)**: SMS 인증 완료 시 기본 기능 사용 가능
2. **Advanced Tier (2차 인증)**: Verification Center에서 프로필 완성 필요
3. **확인 다이얼로그**: 고위험 기능 접근 시 Verification Center 이동 확인

### 🗑️ 계정 삭제 개선
1. **SQL 함수 기반 삭제**: `delete_user_account` 함수로 안정적인 데이터 삭제
2. **완전 삭제 보장**: auth.users와 public 테이블 모두에서 완전 삭제
3. **재가입 지원**: 삭제된 계정의 이메일/전화번호로 재가입 가능

---

**마지막 업데이트**: 2025-01-29

