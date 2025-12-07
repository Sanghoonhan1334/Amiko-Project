# 컴포넌트 역할 정리 문서

## 📁 디렉토리 구조별 컴포넌트 역할

---

## 🛠️ Admin 컴포넌트 (`src/components/admin/`)

### AnalyticsDashboard.tsx
**역할**: 관리자용 통계 대시보드
- 사용자 통계 (한국인/라틴계, 활성 사용자)
- 뉴스 통계 (한국/스페인 뉴스, 조회수)
- 퀴즈 통계 (참여자 수, 카테고리별)
- 포인트 통계 (총 포인트, 월별 포인트)
- 결제 통계
- 기타 플랫폼 통계 (스토리, 파트너십 등)

### ConsultantScheduleEditor.tsx
**역할**: 컨설턴트 스케줄 편집기
- 주간 스케줄 관리 (월~일)
- 시간대별 근무 시간 설정
- 타임존 설정
- 근무일/비근무일 설정

### ConversationPartnerManagement.tsx
**역할**: 대화 파트너 관리
- 파트너 추가/수정/삭제
- 파트너 정보 관리 (이름, 언어 레벨, 국가, 관심사, 소개)
- Google Meet 링크 관리
- 파트너 상태 관리 (온라인/오프라인)

### EventManagement.tsx
**역할**: 이벤트 관리
- 추천인 이벤트 참여자 관리
- 월별 포인트 이벤트 참여자 관리
- 당첨자 선정 및 상품 관리
- 기간별 이벤트 조회

### MentorStatusManager.tsx
**역할**: 멘토 상태 관리
- 멘토 목록 조회
- 멘토 상태 변경 (온라인/바쁨/오프라인)
- 멘토 활성화/비활성화
- 멘토 세션 관리

### PointsRanking.tsx
**역할**: 포인트 랭킹 표시
- 전체 포인트 랭킹
- 월별 포인트 랭킹
- 사용자별 포인트 통계

---

## 📊 Analytics 컴포넌트 (`src/components/analytics/`)

### Analytics.tsx
**역할**: 분석 도구 통합
- Google Analytics 통합
- 사용자 행동 추적
- 이벤트 로깅

### GoogleAnalytics.tsx
**역할**: Google Analytics 전용 컴포넌트
- GA4 설정 및 초기화
- 페이지뷰 추적
- 커스텀 이벤트 추적

---

## 🔐 Auth 컴포넌트 (`src/components/auth/`)

### AuthenticationOptions.tsx
**역할**: 인증 옵션 선택 UI
- 이메일/전화번호 인증 선택
- 소셜 로그인 옵션 표시

### BiometricAuth.tsx
**역할**: 생체 인증 컴포넌트
- WebAuthn 기반 생체 인증
- 지문/Face ID 지원

### BiometricLogin.tsx
**역할**: 생체 인증 로그인
- 등록된 생체 인증으로 로그인
- 생체 인증 실패 시 대체 인증 제공

### EmailVerification.tsx
**역할**: 이메일 인증
- 이메일 인증 코드 입력
- 인증 코드 재전송
- 인증 완료 처리

### PhoneVerification.tsx
**역할**: 전화번호 인증
- SMS 인증 코드 입력
- WhatsApp 인증 옵션
- 국가별 전화번호 형식 처리
- 스팸 폴더 안내

### ProtectedRoute.tsx
**역할**: 보호된 라우트
- 인증 필요 페이지 보호
- 미인증 시 리다이렉트

### VerificationExplanation.tsx
**역할**: 인증 설명 컴포넌트
- 인증 절차 안내
- 인증 방법 설명

---

## 💬 Chat 컴포넌트 (`src/components/chat/`)

### ChatRoom.tsx
**역할**: 채팅방 컴포넌트
- 실시간 채팅 기능
- 메시지 전송/수신
- 사용자 목록 표시

### ChatRulesModal.tsx
**역할**: 채팅 규칙 모달
- 채팅 이용 규칙 표시
- 규칙 동의 처리

---

## 🔧 Common 컴포넌트 (`src/components/common/`)

### AuthConfirmDialog.tsx
**역할**: 인증 확인 다이얼로그
- 인증 필요 작업 시 확인 다이얼로그
- 로그인 유도

### AuthGuard.tsx
**역할**: 인증 가드
- 컴포넌트 레벨 인증 체크
- 미인증 시 로그인 페이지로 리다이렉트

### AuthorName.tsx
**역할**: 작성자 이름 표시 컴포넌트
- 게시글/댓글 작성자 이름 표시
- 프로필 링크 제공
- UserBadge 통합

### CommunityTutorial.tsx
**역할**: 커뮤니티 튜토리얼
- 커뮤니티 사용법 안내
- 첫 방문자 가이드

### DarkModeToggle.tsx
**역할**: 다크모드 토글
- 라이트/다크 모드 전환
- 사용자 설정 저장

### InquiryModal.tsx
**역할**: 문의하기 모달
- 사용자 문의 폼
- 문의 제출 처리

### LoadingOverlay.tsx
**역할**: 로딩 오버레이
- 전체 화면 로딩 표시
- 작업 진행 중 표시

### Logo.tsx
**역할**: 로고 컴포넌트
- AMIKO 로고 표시
- 다크모드 대응
- 클릭 시 홈으로 이동

### OnboardingTutorial.tsx
**역할**: 온보딩 튜토리얼
- 신규 사용자 온보딩
- 앱 사용법 안내

### PartnershipModal.tsx
**역할**: 파트너십 문의 모달
- 파트너십 문의 폼
- 문의 제출 처리

### ScrollToTop.tsx
**역할**: 스크롤 투 탑
- 페이지 상단으로 스크롤
- 스크롤 위치에 따라 표시/숨김

### ScrollToTopButton.tsx
**역할**: 스크롤 투 탑 버튼
- 상단 이동 버튼 UI
- 스크롤 위치 감지

### TranslatedInterests.tsx
**역할**: 관심사 번역 컴포넌트
- 관심사 다국어 표시
- 번역된 관심사 배지 표시
- 관심사 개수 표시

### UserBadge.tsx
**역할**: 사용자 배지
- 포인트 기반 레벨 표시 (🌱 Sprout, 🌿 Leaf, 🌹 Rose)
- VIP 배지 표시 (👑)
- 레벨별 툴팁 제공

### UserProfileModal.tsx
**역할**: 사용자 프로필 모달
- 사용자 프로필 상세 정보 표시
- 프로필 정보 번역 기능 (한국어 ↔ 스페인어)
- 신고 기능
- 관심사 표시
- 직업 정보 표시
- 원본 보기 기능

### UserTimeDisplay.tsx
**역할**: 사용자 시간 표시
- 사용자 타임존 기반 시간 표시
- 현재 시간 표시

### VerificationGuard.tsx
**역할**: 인증 가드
- 이메일/SMS 인증 확인
- 미인증 시 인증 페이지로 리다이렉트

### VideoCallTutorial.tsx
**역할**: 비디오 콜 튜토리얼
- 비디오 콜 사용법 안내
- 첫 사용자 가이드

---

## 🏠 Landing 컴포넌트 (`src/components/landing/`)

### FAQ.tsx
**역할**: 자주 묻는 질문
- FAQ 목록 표시
- 아코디언 형태로 질문/답변 표시

### FeatureCards.tsx
**역할**: 기능 소개 카드
- 주요 기능 소개
- 기능별 카드 레이아웃

### Hero.tsx
**역할**: 히어로 섹션
- 메인 타이틀 및 서브타이틀
- CTA 버튼
- 랜딩 페이지 메인 섹션

### LoungeMini.tsx
**역할**: 라운지 미리보기
- 라운지 기능 소개
- 라운지로 이동 버튼

---

## 📐 Layout 컴포넌트 (`src/components/layout/`)

### BottomTabNavigation.tsx
**역할**: 하단 탭 네비게이션
- 메인 네비게이션 탭 (홈, 커뮤니티, 비디오, 이벤트, 내정보)
- 모바일 하단 네비게이션

### CustomBanner.tsx
**역할**: 커스텀 배너
- 커스텀 배너 표시
- 배너 관리

### Footer.tsx
**역할**: 푸터
- 사이트 하단 정보
- 링크 및 저작권 정보

### Header.tsx
**역할**: 헤더
- 상단 네비게이션
- 로고, 알림, 프로필, 포인트 표시
- 언어 전환
- 다크모드 토글

### HeaderWrapper.tsx
**역할**: 헤더 래퍼
- 헤더 레이아웃 관리
- 헤더 위치 고정

### Navbar.tsx
**역할**: 네비게이션 바
- 데스크톱 네비게이션
- 메뉴 항목 표시

---

## ⚖️ Legal 컴포넌트 (`src/components/legal/`)

### LegalReviewManager.tsx
**역할**: 법적 검토 관리자
- 법적 문서 검토 관리
- 승인/거부 처리

---

## 🎉 Lounge 컴포넌트 (`src/components/lounge/`)

### LoungeRewardModal.tsx
**역할**: 라운지 리워드 모달
- 라운지 참여 리워드 표시
- 리워드 수령 처리

### ParticipantAvatars.tsx
**역할**: 참여자 아바타
- 라운지 참여자 아바타 표시
- 참여자 수 표시

---

## 📱 Main 컴포넌트 (`src/components/main/`)

### app/charging/
#### ChargingStation.tsx
**역할**: 포인트 충전소
- 포인트 충전 옵션 표시
- 결제 방법 선택
- 충전 내역 표시

#### ChargingTab.tsx
**역할**: 충전 탭
- 포인트 충전 메인 화면
- 충전 옵션 슬라이드

### app/community/
#### ChatRoomClient.tsx
**역할**: 채팅방 클라이언트
- 실시간 채팅 기능
- 메시지 전송/수신
- 참여자 관리
- 파일 업로드

#### CommentSection.tsx
**역할**: 댓글 섹션
- 댓글 목록 표시
- 댓글 작성/수정/삭제
- 댓글 좋아요
- 댓글 답글

#### CommunityCard.tsx
**역할**: 커뮤니티 카드
- 커뮤니티 항목 카드 UI
- 카테고리별 카드 표시

#### CommunityMain.tsx
**역할**: 커뮤니티 메인
- 커뮤니티 메인 화면
- 갤러리/게시글 뷰 전환
- 게시글 상세 보기

#### CommunityTab.tsx
**역할**: 커뮤니티 탭
- 커뮤니티 메인 탭
- 카테고리별 게시글 표시
- 퀴즈 목록 표시
- 게시글 작성

#### CommunityTabNew.tsx
**역할**: 커뮤니티 탭 (신규 버전)
- 커뮤니티 탭의 새 버전
- 최근 스토리, 인기 게시글, 인기 테스트 표시
- 온라인 사용자 표시

#### FanartBoard.tsx
**역할**: 팬아트 게시판
- 팬아트 게시글 목록
- 팬아트 업로드
- 팬아트 상세 보기

#### FanartUploadModal.tsx
**역할**: 팬아트 업로드 모달
- 팬아트 이미지 업로드
- 팬아트 정보 입력

#### FanzoneHome.tsx
**역할**: 팬존 홈
- 팬존 메인 화면
- 팬존 기능 소개

#### FreeBoard.tsx
**역할**: 자유게시판
- 자유게시판 메인 화면
- 게시글 목록 표시
- 게시글 작성/수정/삭제
- 공지사항 표시

#### FreeBoardList.tsx
**역할**: 자유게시판 목록
- 게시글 목록 표시
- 정렬/필터링
- 검색 기능
- 공지사항 작성 (운영자)

#### GalleryList.tsx
**역할**: 갤러리 목록
- 갤러리 목록 표시
- 갤러리 선택

#### GalleryNavigation.tsx
**역할**: 갤러리 네비게이션
- 갤러리 간 이동
- 갤러리 메뉴

#### GalleryPostList.tsx
**역할**: 갤러리 게시글 목록
- 특정 갤러리의 게시글 목록
- 갤러리별 게시글 표시

#### IdolMemesBoard.tsx
**역할**: 아이돌 밈 게시판
- 아이돌 밈 게시글 목록
- 밈 업로드

#### IdolMemesPost.tsx
**역할**: 아이돌 밈 게시글
- 밈 게시글 상세 보기
- 밈 좋아요/댓글

#### IdolMemesUploadModal.tsx
**역할**: 아이돌 밈 업로드 모달
- 밈 이미지 업로드
- 밈 정보 입력

#### KChatBoard.tsx
**역할**: K-채팅 게시판
- K-채팅 게시글 목록
- 채팅방 목록

#### NewsDetail.tsx
**역할**: 뉴스 상세
- 뉴스 기사 상세 보기
- 뉴스 내용 표시

#### PollBoard.tsx
**역할**: 투표 게시판
- 투표 게시글 목록
- 투표 참여
- 투표 결과 표시

#### PopularPosts.tsx
**역할**: 인기 게시글
- 인기 게시글 목록
- 좋아요/조회수 기반 정렬

#### PostCreate.tsx
**역할**: 게시글 작성
- 게시글 작성 폼
- 이미지 업로드
- 카테고리 선택

#### PostDetail.tsx
**역할**: 게시글 상세
- 게시글 상세 정보 표시
- 댓글 섹션
- 좋아요/조회수 표시
- 게시글 수정/삭제

#### PostEditModal.tsx
**역할**: 게시글 수정 모달
- 게시글 수정 폼
- 이미지 수정
- 카테고리 변경

#### PostFilters.tsx
**역할**: 게시글 필터
- 게시글 필터링 옵션
- 정렬 옵션
- 검색 필터

#### StoryCarousel.tsx
**역할**: 스토리 캐러셀
- 최근 스토리 슬라이드
- 스토리 미리보기

### app/event/
#### EventTab.tsx
**역할**: 이벤트 탭
- 진행 중인 이벤트 표시
- 이벤트 참여
- 이벤트 상세 정보

#### ZepEventCard.tsx
**역할**: Zep 이벤트 카드
- Zep 이벤트 카드 UI
- 이벤트 정보 표시

### app/home/
#### HomeTab.tsx
**역할**: 홈 탭
- 메인 홈 화면
- 공지사항 표시
- 인기 게시글 표시
- 인기 테스트 표시
- 온라인 사용자 표시
- 최근 스토리 표시
- 현재 진행 이벤트 표시
- 갤러리 포스트 표시
- YouTube 비디오 표시

### app/me/
#### ChargingHeader.tsx
**역할**: 충전 헤더
- 포인트 충전 헤더
- 포인트 잔액 표시

#### MyTab.tsx
**역할**: 내 정보 탭
- 사용자 프로필 관리
- 포인트 내역
- 설정 관리
- 계정 삭제
- 생체 인증 설정
- 스토리 설정
- 관리자 대시보드 (운영자)

#### PointsCard.tsx
**역할**: 포인트 카드
- 포인트 잔액 표시
- 포인트 내역 링크
- 포인트 충전 링크

#### StorySettings.tsx
**역할**: 스토리 설정
- 스토리 공개/비공개 설정
- 스토리 알림 설정
- 스토리 관련 설정

### app/meet/
#### MeetTab.tsx
**역할**: 만남 탭
- 비디오 콜 시작 화면
- VideoCallStarter 래퍼

### shared/
#### Faq.tsx
**역할**: FAQ
- 자주 묻는 질문 표시
- FAQ 아코디언

#### Features.tsx
**역할**: 기능 소개
- 주요 기능 소개
- 기능 카드 그리드

#### Hero.tsx
**역할**: 히어로 섹션
- 메인 타이틀
- CTA 버튼

---

## 🧭 Nav 컴포넌트 (`src/components/nav/`)

### MainNav.tsx
**역할**: 메인 네비게이션
- 메인 네비게이션 메뉴
- 메뉴 항목 표시

---

## 🔔 Notifications 컴포넌트 (`src/components/notifications/`)

### NotificationBell.tsx
**역할**: 알림 벨
- 알림 아이콘
- 알림 개수 표시
- 알림 목록 표시

### PushNotificationToggle.tsx
**역할**: 푸시 알림 토글
- 푸시 알림 설정
- 알림 허용/거부 토글

---

## 💳 Payments 컴포넌트 (`src/components/payments/`)

### PayPalPaymentButton.tsx
**역할**: PayPal 결제 버튼
- PayPal 결제 통합
- 결제 처리

---

## 🔒 Privacy 컴포넌트 (`src/components/privacy/`)

### DataDeletionRequest.tsx
**역할**: 데이터 삭제 요청
- 데이터 삭제 요청 폼
- GDPR 대응

---

## 👤 Profile 컴포넌트 (`src/components/profile/`)

### ProfileImageUpload.tsx
**역할**: 프로필 이미지 업로드
- 프로필 사진 업로드
- 이미지 크롭/편집

---

## 🎨 Providers 컴포넌트 (`src/components/providers/`)

### ThemeProvider.tsx
**역할**: 테마 프로바이더
- 다크모드 테마 관리
- 테마 컨텍스트 제공

---

## 🧩 Quiz 컴포넌트 (`src/components/quiz/`)

### ShareBar.tsx
**역할**: 공유 바
- 퀴즈 결과 공유
- SNS 공유 기능

### TestComments.tsx
**역할**: 테스트 댓글
- 퀴즈 댓글 표시
- 댓글 작성/수정/삭제

---

## 🔐 Security 컴포넌트 (`src/components/security/`)

### SecurityDashboard.tsx
**역할**: 보안 대시보드
- 보안 설정 관리
- 보안 이벤트 로그

---

## 🎬 Splash 컴포넌트 (`src/components/splash/`)

### SplashSequence.tsx
**역할**: 스플래시 시퀀스
- 앱 시작 스플래시 화면
- 로딩 애니메이션

---

## 🔌 Third-party 컴포넌트 (`src/components/third-party/`)

### ThirdPartyServiceManager.tsx
**역할**: 서드파티 서비스 관리자
- 외부 서비스 통합 관리
- API 키 관리

---

## 🎨 UI 컴포넌트 (`src/components/ui/`)

모든 UI 컴포넌트는 shadcn/ui 기반의 재사용 가능한 UI 컴포넌트입니다.

### accordion.tsx
**역할**: 아코디언 컴포넌트
- 접기/펼치기 기능

### alert.tsx
**역할**: 알림 컴포넌트
- 알림 메시지 표시

### avatar.tsx
**역할**: 아바타 컴포넌트
- 사용자 프로필 이미지 표시

### badge.tsx
**역할**: 배지 컴포넌트
- 상태/카테고리 배지 표시

### button.tsx
**역할**: 버튼 컴포넌트
- 다양한 스타일의 버튼

### card.tsx
**역할**: 카드 컴포넌트
- 카드 레이아웃

### checkbox.tsx
**역할**: 체크박스 컴포넌트
- 체크박스 입력

### collapsible.tsx
**역할**: 접을 수 있는 컴포넌트
- 접기/펼치기 기능

### dialog.tsx
**역할**: 다이얼로그 컴포넌트
- 모달 다이얼로그

### drawer.tsx
**역할**: 드로어 컴포넌트
- 사이드 드로어

### input.tsx
**역할**: 입력 필드 컴포넌트
- 텍스트 입력

### label.tsx
**역할**: 라벨 컴포넌트
- 폼 라벨

### progress.tsx
**역할**: 진행률 컴포넌트
- 진행률 표시

### radio-group.tsx
**역할**: 라디오 그룹 컴포넌트
- 라디오 버튼 그룹

### select.tsx
**역할**: 셀렉트 컴포넌트
- 드롭다운 선택

### separator.tsx
**역할**: 구분선 컴포넌트
- 구분선 표시

### skeleton.tsx
**역할**: 스켈레톤 컴포넌트
- 로딩 스켈레톤 UI

### sonner.tsx
**역할**: 토스트 컴포넌트
- 토스트 알림

### switch.tsx
**역할**: 스위치 컴포넌트
- 토글 스위치

### tabs.tsx
**역할**: 탭 컴포넌트
- 탭 네비게이션

### textarea.tsx
**역할**: 텍스트 영역 컴포넌트
- 다중 줄 텍스트 입력

### tooltip.tsx
**역할**: 툴팁 컴포넌트
- 툴팁 표시

---

## 📹 Video 컴포넌트 (`src/components/video/`)

### KoreanPartnerDashboard.tsx
**역할**: 한국인 파트너 대시보드
- 예약 관리
- 스케줄 관리
- 파트너 전용 기능

### VideoCall.tsx
**역할**: 비디오 콜
- Agora 기반 화상 통화
- 비디오/오디오 제어
- 통화 종료

### VideoCallStarter.tsx
**역할**: 비디오 콜 시작 화면
- 비디오 콜 시작 UI
- 대화 파트너 목록 (현지인)
- 예약 관리 대시보드 (한국인)
- 파트너 프로필 보기
- Coming Soon 오버레이

---

## 📝 요약

### 주요 카테고리별 컴포넌트 수
- **Admin**: 6개 (관리자 기능)
- **Analytics**: 2개 (분석 도구)
- **Auth**: 7개 (인증 관련)
- **Chat**: 2개 (채팅 기능)
- **Common**: 17개 (공통 컴포넌트)
- **Landing**: 4개 (랜딩 페이지)
- **Layout**: 6개 (레이아웃)
- **Legal**: 1개 (법적 관리)
- **Lounge**: 2개 (라운지 기능)
- **Main**: 약 40개 (메인 앱 기능)
- **Nav**: 1개 (네비게이션)
- **Notifications**: 2개 (알림)
- **Payments**: 1개 (결제)
- **Privacy**: 1개 (개인정보)
- **Profile**: 1개 (프로필)
- **Providers**: 1개 (프로바이더)
- **Quiz**: 2개 (퀴즈)
- **Security**: 1개 (보안)
- **Splash**: 1개 (스플래시)
- **Third-party**: 1개 (서드파티)
- **UI**: 23개 (기본 UI 컴포넌트)
- **Video**: 3개 (비디오 콜)

**총 약 125개의 컴포넌트**

