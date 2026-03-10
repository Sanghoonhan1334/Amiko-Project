# 🏗️ AMIKO 프로젝트 구조도

## 📁 전체 디렉토리 구조

```
AMIKO-Project-main/
├── 📄 설정 파일들
│   ├── package.json
│   ├── next.config.js
│   ├── tailwind.config.js
│   ├── tsconfig.json
│   └── eslint.config.mjs
│
├── 📁 public/                    # 정적 자산
│   ├── 🖼️ 이미지 파일들
│   ├── amiko-foto.png
│   ├── amiko-foto(night).png
│   └── celebs/, icons/
│
├── 📁 src/
│   ├── 📁 app/                   # Next.js App Router
│   │   ├── layout.tsx           # 루트 레이아웃
│   │   ├── page.tsx             # 랜딩 페이지
│   │   ├── globals.css          # 글로벌 스타일
│   │   │
│   │   ├── 📁 api/              # API 라우트 (147개 파일)
│   │   │   ├── auth/
│   │   │   ├── admin/
│   │   │   ├── points/
│   │   │   ├── notifications/
│   │   │   └── ...
│   │   │
│   │   ├── 📁 main/             # 메인 앱 페이지
│   │   │   └── page.tsx
│   │   │
│   │   ├── 📁 auth/             # 인증 관련 페이지
│   │   │   ├── sign-in/page.tsx
│   │   │   ├── sign-up/page.tsx
│   │   │   └── verification/
│   │   │
│   │   ├── 📁 legal/            # 법적 페이지
│   │   │   ├── terms/page.tsx
│   │   │   ├── privacy/page.tsx
│   │   │   ├── cookies/page.tsx
│   │   │   └── contact/page.tsx
│   │   │
│   │   ├── 📁 admin/            # 관리자 페이지
│   │   ├── 📁 community/        # 커뮤니티 페이지
│   │   ├── 📁 bookings/         # 예약 페이지
│   │   └── 📁 quiz/             # 퀴즈 페이지
│   │
│   ├── 📁 components/           # React 컴포넌트
│   │   ├── 📁 ui/               # UI 컴포넌트 (20개)
│   │   ├── 📁 layout/           # 레이아웃 컴포넌트 (5개)
│   │   ├── 📁 main/             # 메인 앱 컴포넌트 (27개)
│   │   ├── 📁 auth/             # 인증 컴포넌트 (7개)
│   │   ├── 📁 common/           # 공통 컴포넌트 (9개)
│   │   ├── 📁 landing/          # 랜딩 페이지 컴포넌트 (4개)
│   │   ├── 📁 notifications/    # 알림 컴포넌트 (2개)
│   │   ├── 📁 admin/            # 관리자 컴포넌트 (3개)
│   │   ├── 📁 chat/             # 채팅 컴포넌트 (2개)
│   │   └── 📁 providers/        # 프로바이더 컴포넌트
│   │
│   ├── 📁 context/              # React Context
│   │   ├── AuthContext.tsx
│   │   ├── LanguageContext.tsx
│   │   └── UserContext.tsx
│   │
│   ├── 📁 hooks/                # 커스텀 훅
│   │   ├── useUserProfile.ts
│   │   ├── useEventPoints.ts
│   │   ├── useMainPageData.ts
│   │   └── useNotifications.ts
│   │
│   ├── 📁 lib/                  # 유틸리티 라이브러리 (24개)
│   │   ├── translations.ts
│   │   ├── supabaseClient.ts
│   │   ├── supabaseServer.ts
│   │   └── ...
│   │
│   ├── 📁 providers/            # 프로바이더
│   │   └── QueryProvider.tsx
│   │
│   └── 📁 types/                # TypeScript 타입 정의
│       ├── user.ts
│       ├── story.ts
│       └── supabase.ts
│
├── 📁 database/                 # 데이터베이스 스키마 (109개 SQL 파일)
├── 📁 docs/                     # 문서
├── 📁 scripts/                  # 스크립트
└── 📄 가이드 문서들
    ├── README.md
    ├── SUPABASE_SETUP_GUIDE.md
    ├── EMAIL_DELIVERY_GUIDE.md
    └── ...
```

## 🔄 주요 데이터 플로우

```
사용자 요청 → Next.js App Router → API Route → Supabase → 데이터베이스
     ↓
React 컴포넌트 ← Context/Hooks ← React Query ← API 응답
```

## 🎯 주요 기능별 구조

### 1. 인증 시스템
```
src/app/sign-in/     → 로그인 페이지
src/app/sign-up/     → 회원가입 페이지
src/components/auth/ → 인증 컴포넌트들
src/context/AuthContext.tsx → 인증 상태 관리
```

### 2. 메인 앱
```
src/app/main/page.tsx → 메인 앱 진입점
src/components/main/  → 탭별 컴포넌트들
  ├── app/home/       → 홈 탭
  ├── app/meet/       → 만남 탭
  ├── app/community/  → 커뮤니티 탭
  ├── app/me/         → 내 정보 탭
  ├── app/charging/   → 충전 탭
  └── app/event/      → 이벤트 탭
```

### 3. 관리자 시스템
```
src/app/admin/        → 관리자 페이지들
src/components/admin/ → 관리자 컴포넌트들
src/app/api/admin/    → 관리자 API
```

### 4. 커뮤니티 시스템
```
src/app/community/     → 커뮤니티 페이지들
src/components/main/app/community/ → 커뮤니티 컴포넌트들
src/app/api/posts/     → 게시글 API
src/app/api/comments/  → 댓글 API
```

## 📊 파일 통계

- **총 파일 수**: 약 400개 이상
- **TypeScript 파일**: 약 200개
- **SQL 파일**: 109개 (데이터베이스)
- **API 라우트**: 147개
- **React 컴포넌트**: 약 100개
- **커스텀 훅**: 4개
- **Context**: 3개
