# Vercel 환경변수 설정 가이드

## 📋 환경별 환경변수 목록

### 🔧 Development (로컬 개발)
```bash
# 필수 환경변수
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# 애플리케이션 설정
NODE_ENV=development
NEXT_PUBLIC_APP_URL=http://localhost:3000
JWT_SECRET=your_jwt_secret
SESSION_SECRET=your_session_secret

# OAuth (개발용)
GOOGLE_CLIENT_ID=your_dev_google_client_id
GOOGLE_CLIENT_SECRET=your_dev_google_client_secret
KAKAO_CLIENT_ID=your_dev_kakao_client_id
KAKAO_CLIENT_SECRET=your_dev_kakao_client_secret

# 결제 (개발용)
PAYPAL_CLIENT_ID=your_dev_paypal_client_id
PAYPAL_CLIENT_SECRET=your_dev_paypal_client_secret
PAYPAL_MODE=sandbox

# 기타 서비스
AGORA_APP_ID=your_agora_app_id
NEWS_API_KEY=your_news_api_key
VAPID_PUBLIC_KEY=your_vapid_public_key
VAPID_PRIVATE_KEY=your_vapid_private_key
```

### 🚀 Preview (staging.helloamiko.com)
```bash
# 필수 환경변수
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# 애플리케이션 설정
NODE_ENV=preview
NEXT_PUBLIC_APP_URL=https://staging.helloamiko.com
JWT_SECRET=your_jwt_secret
SESSION_SECRET=your_session_secret

# OAuth (스테이징용)
GOOGLE_CLIENT_ID=your_staging_google_client_id
GOOGLE_CLIENT_SECRET=your_staging_google_client_secret
KAKAO_CLIENT_ID=your_staging_kakao_client_id
KAKAO_CLIENT_SECRET=your_staging_kakao_client_secret

# 결제 (스테이징용)
PAYPAL_CLIENT_ID=your_staging_paypal_client_id
PAYPAL_CLIENT_SECRET=your_staging_paypal_client_secret
PAYPAL_MODE=sandbox

# 기타 서비스
AGORA_APP_ID=your_agora_app_id
NEWS_API_KEY=your_news_api_key
VAPID_PUBLIC_KEY=your_vapid_public_key
VAPID_PRIVATE_KEY=your_vapid_private_key
```

### 🌟 Production (helloamiko.com)
```bash
# 필수 환경변수
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# 애플리케이션 설정
NODE_ENV=production
NEXT_PUBLIC_APP_URL=https://helloamiko.com
JWT_SECRET=your_production_jwt_secret
SESSION_SECRET=your_production_session_secret

# OAuth (프로덕션용)
GOOGLE_CLIENT_ID=your_prod_google_client_id
GOOGLE_CLIENT_SECRET=your_prod_google_client_secret
KAKAO_CLIENT_ID=your_prod_kakao_client_id
KAKAO_CLIENT_SECRET=your_prod_kakao_client_secret

# 결제 (프로덕션용)
PAYPAL_CLIENT_ID=your_prod_paypal_client_id
PAYPAL_CLIENT_SECRET=your_prod_paypal_client_secret
PAYPAL_MODE=live

# 기타 서비스
AGORA_APP_ID=your_agora_app_id
NEWS_API_KEY=your_news_api_key
VAPID_PUBLIC_KEY=your_vapid_public_key
VAPID_PRIVATE_KEY=your_vapid_private_key

# 모니터링
SENTRY_DSN=your_sentry_dsn
NEXT_PUBLIC_GA_ID=your_google_analytics_id
```

## 🔑 중요 환경변수별 설명

### 필수 (Required)
- `NEXT_PUBLIC_SUPABASE_URL`: Supabase 프로젝트 URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`: 클라이언트에서 사용하는 공개 키
- `SUPABASE_SERVICE_ROLE_KEY`: 서버에서 사용하는 비밀 키
- `NEXT_PUBLIC_APP_URL`: 애플리케이션 기본 URL (리다이렉트용)

### OAuth 관련
- 각 환경별로 다른 OAuth 앱 설정 필요
- 개발/스테이징/프로덕션용으로 별도 OAuth 앱 생성 권장

### 결제 관련
- 개발/스테이징: `PAYPAL_MODE=sandbox`
- 프로덕션: `PAYPAL_MODE=live`

## 🚨 주의사항

1. **공개 키 vs 비밀 키**
   - `NEXT_PUBLIC_*`: 클라이언트에서 접근 가능 (브라우저에서 보임)
   - 나머지: 서버에서만 접근 가능

2. **환경별 분리**
   - 각 환경마다 다른 키 사용 권장
   - 프로덕션 키는 절대 개발/스테이징에서 사용 금지

3. **보안**
   - 비밀 키는 절대 코드에 하드코딩하지 말 것
   - Vercel 대시보드에서만 설정할 것
