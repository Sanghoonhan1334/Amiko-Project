# 🚀 Staging 환경 설정 완료 가이드

## 📋 작업 완료 목록

### ✅ 1. 환경변수 설정 파일 생성
- `.env.example`: 모든 필요한 환경변수 키 명시
- `VERCEL_ENV_SETUP.md`: Vercel용 환경변수 목록 (Development/Preview/Production별)

### ✅ 2. Supabase 설정 가이드
- `SUPABASE_REDIRECT_SETUP.md`: Auth redirect와 OAuth redirect 설정 체크리스트

### ✅ 3. 보안 미들웨어 구현
- `middleware.ts`: 공개/보호 경로 분리 로직 적용
  - 공개 경로: `/`, `/about`, `/sign-in`, `/sign-up` 등
  - 보호 경로: `/main`, `/profile`, `/bookings` 등
  - 관리자 경로: `/admin`

### ✅ 4. 빌드 시 환경변수 검증
- `src/lib/env-guard.ts`: 필수 환경변수 누락 시 에러 발생
- `next.config.js`: 빌드 시 자동 검증 실행

## 🔧 즉시 해야 할 작업

### 1. Vercel 환경변수 설정
```bash
# Vercel Dashboard > Project > Settings > Environment Variables
# Preview 환경에 다음 추가:

NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
NEXT_PUBLIC_APP_URL=https://staging.helloamiko.com
JWT_SECRET=your_jwt_secret
SESSION_SECRET=your_session_secret
```

### 2. Supabase Dashboard 설정
```
Authentication > URL Configuration:
- Site URL: https://helloamiko.com
- Additional Redirect URLs:
  - https://staging.helloamiko.com/auth/callback
  - https://helloamiko.com/auth/callback
```

### 3. OAuth Provider 설정
각 OAuth Provider (Google, Kakao, Naver)에서 다음 URL 추가:
- **Authorized JavaScript origins**: `https://staging.helloamiko.com`
- **Authorized redirect URIs**: `https://your-project.supabase.co/auth/v1/callback`

## 🚨 문제 해결 체크리스트

### staging.helloamiko.com에서 로그인 요구 문제
- [ ] Vercel Preview 환경변수 설정 완료
- [ ] Supabase Site URL에 staging 도메인 추가
- [ ] OAuth Provider에 staging 도메인 추가
- [ ] `NEXT_PUBLIC_APP_URL` 환경변수 설정

### 빌드 에러 발생 시
- [ ] 필수 환경변수 누락 확인
- [ ] 환경변수 형식 검증
- [ ] 기본값(`your_`, `example`) 제거

### 인증 관련 에러
- [ ] Supabase 프로젝트 URL 확인
- [ ] Anon Key와 Service Role Key 구분
- [ ] JWT Secret과 Session Secret 설정

## 📁 생성된 파일들

1. **`.env.example`** - 환경변수 템플릿
2. **`VERCEL_ENV_SETUP.md`** - Vercel 환경변수 설정 가이드
3. **`SUPABASE_REDIRECT_SETUP.md`** - Supabase 설정 체크리스트
4. **`middleware.ts`** - 경로 보호 미들웨어
5. **`src/lib/env-guard.ts`** - 환경변수 검증 가드
6. **`STAGING_SETUP_GUIDE.md`** - 이 파일 (종합 가이드)

## 🔄 다음 단계

1. **Vercel 환경변수 설정** (가장 중요!)
2. **Supabase Dashboard 설정**
3. **OAuth Provider 설정**
4. **테스트 배포**
5. **인증 플로우 테스트**

## 📞 문제 발생 시

1. Vercel Function 로그 확인
2. Supabase Auth 로그 확인
3. 브라우저 콘솔 에러 확인
4. 환경변수 설정 재확인

---

**🎯 목표**: staging.helloamiko.com에서 비로그인 페이지도 정상 접근 가능하도록 설정 완료
