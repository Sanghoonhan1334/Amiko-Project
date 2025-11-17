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
│  │     ├─ 지문 인증 설정                     │  │
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
   ├─→ 지문 인증 설정
   │     ├─ 등록
   │     ├─ 로그인
   │     └─ 삭제
   │
   ├─→ 포인트 내역
   │
   └─→ 계정 삭제
         └─→ 데이터 익명화/삭제
```

---

## 🔐 인증 플로우

```
랜딩 페이지
   │
   ├─→ 로그인 (/sign-in)
   │     ├─ 이메일/비밀번호
   │     ├─ 지문 인증 (빠른 로그인)
   │     └─ 비밀번호 찾기 (/forgot-password)
   │
   └─→ 회원가입 (/sign-up)
         │
         ├─→ 이메일/비밀번호 입력
         ├─→ 생년월일 입력 (13세 이상)
         ├─→ 약관 동의
         │
         └─→ 휴대폰 인증 (/verification-center)
               │
               ├─→ SMS 인증
               │     └─→ 인증 코드 입력
               │
               └─→ WhatsApp 인증 (SMS 실패 시)
                     └─→ 인증 코드 입력
```

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

**마지막 업데이트**: 2025-01-28

