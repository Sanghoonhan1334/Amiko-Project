# 변경사항 요약 (PR: feature/payments-paypal-maria → develop)

## 주요 기능 추가

### 1. 프로필 공개 설정 기능
- **학업/직업 정보 공개/비공개 선택 기능 추가**
  - 사용자가 자신의 학업 정보(대학교, 전공, 학년) 또는 직업 정보(직업, 회사, 경력)를 다른 사용자에게 공개할지 선택 가능
  - 프로필 편집 페이지에서 토글 스위치로 간편하게 설정
  - 공개 설정에 따라 다른 사용자의 프로필에서 정보 표시 여부 결정
  - 관련 파일:
    - `src/components/main/app/me/MyTab.tsx` - 공개 설정 토글 UI 추가
    - `src/components/common/UserProfileModal.tsx` - 공개 설정에 따른 정보 표시 로직
    - `src/app/api/profile/route.ts` - 공개 설정 필드 저장/조회
    - `src/app/api/user/[id]/route.ts` - 공개 설정 정보 반환
    - `database/add-community-notification-settings.sql` - 데이터베이스 스키마 추가

### 2. 푸시 알림 시스템
- **좋아요 알림 (즉시 발송)**
  - 게시글에 좋아요가 달리면 작성자에게 즉시 푸시 알림 발송
  - 알림 설정에서 활성화/비활성화 가능
  - 관련 파일:
    - `src/app/api/posts/[id]/reactions/route.ts` - 좋아요 API에 알림 발송 로직 추가

- **하루 요약 알림 (매일 오전 8:30 멕시코 시간)**
  - 매일 멕시코 시간 오전 8:30에 전날의 새로운 좋아요와 게시물을 요약하여 발송
  - 사용자별로 알림 설정에 따라 발송 여부 결정
  - 관련 파일:
    - `src/app/api/notifications/daily-digest/route.ts` - 하루 요약 알림 API
    - `vercel.json` - 크론 작업 설정 (UTC 14:30 = 멕시코 시간 08:30 CST)
    - `database/add-community-notification-settings.sql` - 알림 설정 필드 추가

### 3. 알림 설정 UI 개선
- 좋아요 알림, 게시물 알림, 하루 요약 알림 토글 추가
- 데이터베이스와 실시간 동기화
- 관련 파일:
  - `src/components/main/app/me/MyTab.tsx` - 알림 설정 UI 추가
  - `src/app/api/notifications/settings/route.ts` - 알림 설정 API 업데이트

## 버그 수정 및 개선사항

### 1. 인증 관련 수정
- 비밀번호 재설정 시 "현재 비밀번호" 입력 요구 제거
- 이메일 인증 코드 방식으로 비밀번호 재설정 변경
- 계정 삭제 후 재가입 시 비밀번호 작동 문제 해결
- 관련 파일:
  - `src/app/reset-password/page.tsx`
  - `src/app/api/auth/reset-password/confirm/route.ts`
  - `src/app/forgot-password/page.tsx`
  - `src/app/api/auth/signup/route.ts`

### 2. 인증센터 개선
- 프로필 사진 등록 필수화 및 검증 강화
- 자기소개 최소 20자 검증 추가
- 필수 필드 미입력 시 진행 방지 및 에러 표시
- 국가번호 선택기 추가 (현지인 인증센터)
- 관련 파일:
  - `src/app/verification/page.tsx`
  - `src/app/verification-center/page.tsx`

### 3. UI 개선
- 스토리 관련 UI 숨김 처리 (미래 사용을 위해 주석 처리)
- 인증센터 페이지에서 플로팅 버튼 제거
- 프로필 페이지 레이아웃 간격 조정
- 관련 파일:
  - `src/components/main/app/me/MyTab.tsx`
  - `src/components/common/ScrollToTop.tsx`
  - `src/components/common/GlobalChatButton.tsx`
  - `src/components/common/DarkModeToggle.tsx`
  - `src/components/common/PaletteSwitcher.tsx`

### 4. 에러 메시지 개선
- 계정 삭제 시 "일부 데이터 정리 실패" 오류 메시지 수정
- Orphaned 세션 정리 시 "User not found" 오류 처리 개선
- 관련 파일:
  - `src/app/api/account/route.ts`
  - `src/app/api/auth/cleanup-orphaned-session/route.ts`

### 5. 이메일 서비스 개선
- 비밀번호 재설정 이메일 제목 수정
- 이메일 템플릿 분리 (가입 인증 / 비밀번호 재설정)
- 관련 파일:
  - `src/lib/emailService.ts`
  - `src/app/api/verify/start/route.ts`

### 6. WhatsApp 인증 개선
- WhatsApp 메시지 템플릿 사용 활성화
- 국가번호 정규화 및 검증 강화
- 관련 파일:
  - `src/lib/smsService.ts`
  - `src/lib/twilioService.ts`
  - `src/app/api/verify/start/route.ts`
  - `database/fix-verification-codes-type-constraint.sql`

## 데이터베이스 변경

### 1. 알림 설정 테이블 확장
- `notification_settings` 테이블에 다음 필드 추가:
  - `like_notifications_enabled` (BOOLEAN, 기본값: TRUE)
  - `post_notifications_enabled` (BOOLEAN, 기본값: TRUE)
  - `daily_digest_enabled` (BOOLEAN, 기본값: TRUE)
  - `daily_digest_time` (TIME, 기본값: '08:30:00')
- 관련 파일:
  - `database/add-community-notification-settings.sql`

### 2. 프로필 공개 설정 필드 추가
- `users` 테이블에 다음 필드 추가:
  - `academic_info_public` (BOOLEAN, 기본값: FALSE)
  - `job_info_public` (BOOLEAN, 기본값: FALSE)
- 관련 파일:
  - `database/add-community-notification-settings.sql` (참고: 실제 스키마는 별도로 추가됨)

### 3. 인증 코드 타입 확장
- `verification_codes` 테이블의 `type` 컬럼에 'wa' (WhatsApp) 추가
- 관련 파일:
  - `database/fix-verification-codes-type-constraint.sql`

## API 변경사항

### 1. 프로필 API
- `GET /api/profile` - 공개 설정 정보 반환 추가
- `POST /api/profile` - 공개 설정 필드 저장 지원
- `GET /api/user/[id]` - 공개 설정 정보 반환 추가

### 2. 알림 API
- `POST /api/notifications/send-push` - 기존 API 활용
- `GET /api/notifications/daily-digest` - 새로운 하루 요약 알림 API 추가
- `PUT /api/notifications/settings` - 커뮤니티 알림 설정 필드 지원 추가

### 3. 좋아요 API
- `POST /api/posts/[id]/reactions` - 좋아요 추가 시 알림 발송 로직 추가

## 환경 설정

### 1. Vercel 크론 작업
- 매일 UTC 14:30 (멕시코 시간 08:30 CST)에 하루 요약 알림 발송
- 관련 파일:
  - `vercel.json`

### 2. 환경 변수 (선택사항)
- `CRON_SECRET` - 크론 작업 보안을 위한 시크릿 키

## 마이그레이션 필요 사항

다음 SQL 스크립트를 Supabase에서 실행해야 합니다:

1. `database/add-community-notification-settings.sql` - 알림 설정 필드 추가
2. `database/fix-verification-codes-type-constraint.sql` - WhatsApp 타입 추가 (이미 실행됨 가능)

## 테스트 권장 사항

1. 프로필 공개 설정 토글 동작 확인
2. 좋아요 알림 즉시 발송 확인
3. 하루 요약 알림 크론 작업 동작 확인 (테스트용 수동 호출 가능)
4. 알림 설정 저장/로드 동작 확인
5. 비밀번호 재설정 플로우 확인

