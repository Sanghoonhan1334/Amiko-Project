# Supabase Auth Redirect 설정 체크리스트

## 🎯 staging.helloamiko.com 도메인 추가 작업

### 1. Supabase Dashboard 설정

#### 📍 Authentication > URL Configuration
```
Site URL: https://helloamiko.com
Additional Redirect URLs:
- http://localhost:3000/auth/callback
- https://staging.helloamiko.com/auth/callback
- https://helloamiko.com/auth/callback
```

#### 📍 Authentication > Email Templates
```
Confirm signup redirect URL: https://staging.helloamiko.com/auth/callback
Reset password redirect URL: https://staging.helloamiko.com/auth/callback
```

### 2. OAuth Provider 설정

#### 🔵 Google OAuth Console
1. **Google Cloud Console** 접속
2. **APIs & Services > Credentials** 이동
3. **OAuth 2.0 Client IDs** 선택
4. **Authorized JavaScript origins** 추가:
   ```
   http://localhost:3000
   https://staging.helloamiko.com
   https://helloamiko.com
   ```
5. **Authorized redirect URIs** 추가:
   ```
   https://your-project.supabase.co/auth/v1/callback
   ```

#### 🟡 Kakao Developers
1. **Kakao Developers** 접속
2. **내 애플리케이션 > 플랫폼** 이동
3. **Web 플랫폼 등록** 추가:
   ```
   http://localhost:3000
   https://staging.helloamiko.com
   https://helloamiko.com
   ```
4. **제품 설정 > 카카오 로그인 > Redirect URI** 추가:
   ```
   https://your-project.supabase.co/auth/v1/callback
   ```

#### 🟢 Naver Developers
1. **Naver Developers** 접속
2. **Application > Web Service** 이동
3. **Service URL** 추가:
   ```
   http://localhost:3000
   https://staging.helloamiko.com
   https://helloamiko.com
   ```
4. **Callback URL** 추가:
   ```
   https://your-project.supabase.co/auth/v1/callback
   ```

### 3. 환경변수 업데이트

#### Vercel Preview 환경변수 설정
```bash
# Vercel Dashboard > Project > Settings > Environment Variables
# Preview 환경에 다음 추가:

NEXT_PUBLIC_APP_URL=https://staging.helloamiko.com
NODE_ENV=preview

# OAuth 클라이언트 ID (스테이징용)
GOOGLE_CLIENT_ID=your_staging_google_client_id
GOOGLE_CLIENT_SECRET=your_staging_google_client_secret
KAKAO_CLIENT_ID=your_staging_kakao_client_id
KAKAO_CLIENT_SECRET=your_staging_kakao_client_secret
NAVER_CLIENT_ID=your_staging_naver_client_id
NAVER_CLIENT_SECRET=your_staging_naver_client_secret
```

### 4. 코드 레벨 확인사항

#### Auth 콜백 처리 확인
```typescript
// src/app/auth/callback/route.ts 또는 유사한 파일
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/'

  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) {
      // 환경별 리다이렉트 URL 처리
      const redirectUrl = process.env.NEXT_PUBLIC_APP_URL || origin
      return NextResponse.redirect(`${redirectUrl}${next}`)
    }
  }

  // 에러 시 로그인 페이지로 리다이렉트
  return NextResponse.redirect(`${origin}/sign-in?error=auth_callback_error`)
}
```

### 5. 테스트 체크리스트

#### ✅ 기본 인증 플로우 테스트
- [ ] staging.helloamiko.com에서 회원가입
- [ ] staging.helloamiko.com에서 로그인
- [ ] staging.helloamiko.com에서 비밀번호 재설정
- [ ] staging.helloamiko.com에서 이메일 인증

#### ✅ OAuth 플로우 테스트
- [ ] Google 로그인 (staging 도메인)
- [ ] Kakao 로그인 (staging 도메인)
- [ ] Naver 로그인 (staging 도메인)
- [ ] OAuth 콜백 후 올바른 페이지로 리다이렉트

#### ✅ 보안 테스트
- [ ] 잘못된 도메인에서의 접근 차단
- [ ] CSRF 토큰 검증
- [ ] 세션 만료 처리

### 6. 문제 해결

#### 🚨 일반적인 문제들

**문제**: staging 도메인에서 로그인 요구
**원인**: 
- Supabase Site URL에 staging 도메인 미등록
- OAuth Provider에 staging 도메인 미등록
- 환경변수 NEXT_PUBLIC_APP_URL 미설정

**해결**:
1. Supabase Dashboard에서 Site URL 업데이트
2. OAuth Provider 설정 업데이트
3. Vercel 환경변수 설정 확인

**문제**: OAuth 콜백 실패
**원인**:
- Redirect URI 불일치
- 클라이언트 ID/Secret 불일치

**해결**:
1. OAuth Provider 콘솔에서 Redirect URI 확인
2. 환경변수 클라이언트 ID/Secret 확인

### 7. 모니터링

#### 로그 확인 포인트
- Supabase Auth 로그
- Vercel Function 로그
- 브라우저 콘솔 에러

#### 알림 설정
- 인증 실패율 모니터링
- OAuth 에러 알림
- 세션 만료 알림
