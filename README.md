# Amiko - 한국 문화 교류 플랫폼

Next.js, Tailwind CSS, Supabase, Toss Payments를 활용한 한국 문화 교류 플랫폼입니다.

## 🚀 시작하기

### 1. 의존성 설치
```bash
npm install
```

### 2. 환경 변수 설정
`.env.local` 파일을 프로젝트 루트에 생성하고 다음 내용을 추가하세요:

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_public_anon_key
SUPABASE_SERVICE_ROLE=your_service_role_key

# Toss Payments
NEXT_PUBLIC_TOSS_CLIENT_KEY=your_toss_client_key
TOSS_SECRET_KEY=your_toss_secret_key
TOSS_WEBHOOK_SECRET_KEY=your_webhook_secret_key

# 푸시 알림 (VAPID 키)
NEXT_PUBLIC_VAPID_PUBLIC_KEY=your_vapid_public_key_here
VAPID_PRIVATE_KEY=your_vapid_private_key_here

# App
APP_URL=http://localhost:3000
```

### 3. 개발 서버 실행
```bash
npm run dev
```

**중요**: 기본 포트는 3000입니다. 다른 포트를 사용하려면 `package.json`의 dev 스크립트를 수정하세요.

## 🔧 주요 기능

### ✅ 완료된 기능
- **UI/UX 시스템**: oz-react2의 완벽한 UI/UX 구조 이식 완료
- **결제 시스템**: Toss Payments 연동 (웹훅 기반 자동 처리)
- **사용자 인증**: Supabase Auth 기반 로그인/회원가입
- **관리자 대시보드**: 결제/예약 통계 조회
- **결제 테스트**: 100/500/1000원 테스트 환경
- **데이터 연동**: Supabase와 실시간 연결된 예약/결제 시스템

### 🚧 진행 중인 기능
- 예약 시스템
- 사용자 프로필 관리
- 결제 내역 조회

## 🎨 UI/UX 특징

### oz-react2 디자인 시스템
- **모던한 네비게이션**: 반응형 햄버거 메뉴와 사이드바
- **히어로 섹션**: YouTube 비디오 배경과 인터랙티브 카드
- **일관된 디자인**: Tailwind CSS 기반의 통일된 스타일링
- **모바일 최적화**: 모든 디바이스에서 완벽한 사용자 경험

### 주요 컴포넌트
- `Navbar`: 반응형 네비게이션 바
- `HeroSection`: 메인 히어로 섹션 (YouTube 비디오 포함)
- `Footer`: 다국어 지원 푸터
- `BookingsPage`: Supabase 연동 예약 목록
- `PaymentsPage`: Supabase 연동 결제 내역

## 💳 결제 시스템 상세

### PayPal 결제 플로우
1. **결제 요청**: 사용자가 결제 페이지에서 PayPal 버튼 클릭
2. **PayPal 리다이렉트**: PayPal 결제 페이지로 이동
3. **결제 처리**: PayPal에서 결제 처리
4. **결제 성공**: 사용자가 `/payments/success` 페이지로 리다이렉트
5. **서버 자동 처리**: PayPal API를 통해 결제 승인 및 DB 업데이트
6. **완료**: 사용자에게 결제 완료 및 예약 확정 메시지 표시

### 보안 특징
- **PayPal 보안**: PayPal의 검증된 결제 보안 시스템
- **서버 사이드 검증**: PayPal API를 통한 결제 검증
- **자동화**: 수동 개입 없이 실시간 자동 처리

## 📁 프로젝트 구조

```
src/
├── app/                    # Next.js App Router
│   ├── auth/              # 인증 관련 페이지
│   ├── payments/          # 결제 관련 페이지
│   │   ├── success/       # 결제 성공 페이지
│   │   └── ...
│   ├── bookings/          # 예약 관련 페이지
│   ├── admin/             # 관리자 페이지
│   └── api/               # API 라우트
│       └── paypal/        # PayPal 결제 API
│           ├── create-order/   # PayPal 주문 생성
│           ├── approve-order/  # PayPal 주문 승인
│           └── ...
├── components/             # 재사용 가능한 컴포넌트
│   ├── layout/            # 레이아웃 컴포넌트 (oz-react2 스타일)
│   │   ├── Navbar.tsx     # 네비게이션 바
│   │   └── Footer.tsx     # 푸터
│   ├── landing/           # 랜딩 페이지 컴포넌트
│   │   └── HeroSection.tsx # 히어로 섹션
│   ├── auth/              # 인증 관련 컴포넌트
│   └── ui/                # UI 컴포넌트
├── context/                # React Context
├── lib/                    # 유틸리티 및 설정
│   └── supabaseServer.ts  # Supabase 서버 클라이언트
├── types/                  # TypeScript 타입 정의
└── styles/                 # 전역 스타일
```

## 🗄️ 데이터베이스 설정

### 1. 환경변수 설정
`.env.local` 파일을 생성하고 다음 환경변수들을 설정하세요:

```bash
# Supabase 설정
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# 번역 서비스 설정 (하나 이상 선택)
OPENAI_API_KEY=your_openai_api_key
GOOGLE_TRANSLATE_API_KEY=your_google_translate_api_key

# Toss Payments 설정
TOSS_PAYMENTS_SECRET_KEY=your_toss_payments_secret_key
TOSS_PAYMENTS_CLIENT_KEY=your_toss_payments_client_key

# 푸시 알림 설정
VAPID_PUBLIC_KEY=your_vapid_public_key
VAPID_PRIVATE_KEY=your_vapid_private_key

# 기타 설정
NEXTAUTH_SECRET=your_nextauth_secret
NEXTAUTH_URL=http://localhost:3000
```

### 2. Supabase 테이블 생성
`supabase-schema.sql` 파일을 Supabase SQL 편집기에서 실행하세요:

## 🌐 번역 기능 설정

### 번역 서비스 선택
프로젝트는 여러 번역 서비스를 지원합니다:

1. **OpenAI GPT** (권장)
   - 자연스러운 번역 품질
   - 문화적 맥락 고려
   - `OPENAI_API_KEY` 환경변수 설정

2. **Google Translate API**
   - 빠른 번역 속도
   - 안정적인 서비스
   - `GOOGLE_TRANSLATE_API_KEY` 환경변수 설정

3. **Mock 번역** (개발용)
   - API 키 없이 테스트 가능
   - 미리 정의된 번역 데이터 사용

### 번역 기능 사용법
```typescript
import { translateText, setTranslationProvider } from '@/lib/translation'

// 번역 제공자 설정 (선택사항)
setTranslationProvider('openai') // 'openai', 'google', 'mock'

// 번역 실행
const translated = await translateText('안녕하세요', 'es', 'ko')
console.log(translated) // "Hola"
```

### 2. Supabase 테이블 생성
`supabase-schema.sql` 파일을 Supabase SQL 편집기에서 실행하세요:

## 🔔 푸시 알림 시스템 설정

### 1. VAPID 키 생성
```bash
node scripts/generate-vapid-keys.js
```

### 2. 환경변수 설정
생성된 VAPID 키를 `.env.local` 파일에 추가하세요.

### 3. 데이터베이스 테이블 생성
`database/push-notifications.sql` 파일을 Supabase SQL 편집기에서 실행하세요.

### 4. 테스트
- `/notifications/settings` 페이지에서 푸시 알림 권한 요청
- `/notifications/test-push` 페이지에서 테스트 알림 발송

### Supabase 테이블 생성
`supabase-schema.sql` 파일을 Supabase SQL 편집기에서 실행하세요:

```sql
-- 사용자 테이블
CREATE TABLE users (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 예약 테이블
CREATE TABLE bookings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  topic TEXT NOT NULL,
  start_at TIMESTAMP WITH TIME ZONE NOT NULL,
  end_at TIMESTAMP WITH TIME ZONE NOT NULL,
  price_cents INTEGER NOT NULL,
  order_id TEXT UNIQUE NOT NULL,
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 결제 테이블
CREATE TABLE payments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  payment_key TEXT UNIQUE NOT NULL,
  order_id TEXT REFERENCES bookings(order_id),
  amount INTEGER NOT NULL,
  status TEXT DEFAULT 'pending',
  method TEXT,
  receipt_url TEXT,
  approved_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

## 🔐 인증 시스템

### 보호된 라우트
- `/payments/test`: 결제 테스트 (로그인 필요)
- `/admin/*`: 관리자 페이지 (로그인 필요)

### 인증 상태
- 로그인하지 않은 사용자는 자동으로 `/auth/login`으로 리다이렉트
- 로그인 후 원래 페이지로 자동 이동

## 🚨 문제 해결

### GoTrueClient 중복 인스턴스 경고
- 개발 환경에서만 나타나는 경고
- Supabase 클라이언트가 싱글톤으로 관리됨
- 실제 기능에는 영향 없음

### 결제 중복 처리
- `paymentKey` 기반 중복 방지
- 이미 처리된 결제는 성공 응답 반환
- 클라이언트에서도 중복 요청 방지

### 포트 설정
- 기본 포트: 3000
- 다른 포트 사용 시 `package.json` 수정 필요

## 🚀 운영 전환 시 체크리스트

### 1. Toss Payments 설정
- [ ] `NEXT_PUBLIC_TOSS_CLIENT_KEY`를 `pk_live_...`로 변경
- [ ] `TOSS_SECRET_KEY`를 `sk_live_...`로 변경
- [ ] Toss 대시보드에 운영 도메인 등록
- [ ] 웹훅 URL 설정 (`/api/toss/webhook`)

### 2. Supabase 설정
- [ ] 프로덕션 프로젝트로 전환
- [ ] RLS 정책 검토 및 테스트
- [ ] 백업 설정 확인

### 3. 보안 설정
- [ ] 환경 변수 보안 확인
- [ ] HTTPS 설정
- [ ] CORS 설정 검토

### 4. 모니터링
- [ ] 에러 로깅 설정
- [ ] 성능 모니터링
- [ ] 결제 실패 알림 설정

## 📝 개발 가이드

### 컴포넌트 추가
```bash
# 새 컴포넌트 생성
mkdir src/components/feature-name
touch src/components/feature-name/ComponentName.tsx
```

### API 라우트 추가
```bash
# 새 API 엔드포인트 생성
mkdir src/app/api/feature-name
touch src/app/api/feature-name/route.ts
```

### 페이지 추가
```bash
# 새 페이지 생성
mkdir src/app/feature-name
touch src/app/feature-name/page.tsx
```

## 🤝 기여하기

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 라이선스

이 프로젝트는 MIT 라이선스 하에 배포됩니다. 자세한 내용은 `LICENSE` 파일을 참조하세요.

## 📞 지원

문제가 발생하거나 질문이 있으시면 이슈를 생성해 주세요.
# Force redeploy
# Force redeploy - Agora fix
# Thu Sep  4 16:23:12 KST 2025 - Force Vercel to use latest commit
