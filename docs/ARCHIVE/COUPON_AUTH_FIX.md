# 쿠폰 인증 오류 수정 (Coupon Authentication Error Fix)

## 문제 분석 (Problem Analysis)

### 증상 (Symptoms)
- 브라우저 콘솔에 `401 Unauthorized` 오류 발생
- `/api/coupons/check` API 호출 실패
- 오류 메시지: `쿠폰 조회 실패: 401`

### 원인 (Root Cause)
1. **토큰 만료**: `localStorage`에 저장된 `amiko_token`이 만료되었지만 자동 갱신되지 않음
2. **토큰 우선순위 문제**: 만료된 localStorage 토큰을 AuthContext의 최신 토큰보다 우선 사용
3. **재시도 로직 부재**: 401 오류 발생 시 토큰을 갱신하고 재시도하는 로직이 없음

## 수정 사항 (Changes Made)

### 1. `/src/hooks/useMainPageData.ts` 개선

#### 변경 전 (Before)
```typescript
// localStorage 토큰을 우선적으로 사용
let token = authToken || localStorage.getItem('amiko_token')

// 토큰이 없을 때만 갱신
if (!token) {
  // 갱신 로직
}
```

#### 변경 후 (After)
```typescript
// 1. AuthContext 토큰을 우선적으로 사용 (항상 최신)
let token = authToken

// 2. AuthContext에 토큰이 없으면 Supabase 세션에서 가져오기
if (!token) {
  const { data: { session } } = await supabase.auth.getSession()
  if (session) {
    token = session.access_token
    localStorage.setItem('amiko_token', token)
  }
}

// 3. 마지막 수단으로 localStorage 토큰 사용
if (!token) {
  token = localStorage.getItem('amiko_token')
}
```

#### 추가된 401 오류 자동 재시도 로직
```typescript
if (couponsResponse.status === 401) {
  // 1. 토큰 갱신
  const { data: { session } } = await supabase.auth.refreshSession()
  
  // 2. 새 토큰으로 재시도
  const retryResponse = await fetch('/api/coupons/check', {
    headers: { 'Authorization': `Bearer ${newToken}` }
  })
  
  // 3. 성공 시 결과 반환
  if (retryResponse.ok) {
    const data = await retryResponse.json()
    availableAKO = data.availableCoupons || 0
  }
}
```

### 2. `/src/app/api/coupons/check/route.ts` 로깅 개선

#### 추가된 상세 로그
```typescript
if (authError || !user) {
  console.log('[COUPONS_CHECK] 사용자 인증 실패')
  console.log('[COUPONS_CHECK] 오류 상세:', authError)
  console.log('[COUPONS_CHECK] 오류 메시지:', authError?.message)
  console.log('[COUPONS_CHECK] 오류 코드:', authError?.status)
  console.log('[COUPONS_CHECK] 사용자 데이터:', user ? 'exists' : 'null')
  
  return NextResponse.json({
    error: '인증이 필요합니다.',
    details: authError?.message || 'User not found',
    hint: '토큰이 만료되었거나 유효하지 않습니다. 다시 로그인해주세요.'
  }, { status: 401 })
}
```

## 해결된 문제 (Issues Resolved)

✅ **토큰 우선순위 수정**
- AuthContext의 최신 토큰을 우선 사용
- 만료된 localStorage 토큰 문제 해결

✅ **자동 토큰 갱신 및 재시도**
- 401 오류 시 자동으로 토큰 갱신
- 새 토큰으로 자동 재시도
- 사용자 경험 개선 (오류 화면 대신 자동 복구)

✅ **향상된 오류 진단**
- 상세한 서버 로그 추가
- 클라이언트에 명확한 오류 메시지 제공

## 테스트 방법 (Testing Instructions)

### 1. 개발 서버 재시작
```bash
# 터미널에서 실행
npm run dev
```

### 2. 브라우저에서 테스트
1. 브라우저를 열고 애플리케이션 접속
2. 로그인 (한국 사용자: `han133334@naver.com`)
3. 브라우저 개발자 도구 열기 (F12)
4. Console 탭에서 로그 확인

### 3. 예상되는 로그 출력

#### 정상 작동 시
```
[MAIN_DATA] AuthContext 토큰 확인: 있음
[COUPONS_CHECK] API 호출 시작
[COUPONS_CHECK] 사용자 인증 성공: <user_id>
[COUPONS_CHECK] 한국 사용자는 쿠폰 없이도 채팅가 가능합니다.
```

#### 토큰 갱신이 필요한 경우
```
[MAIN_DATA] AuthContext 토큰 확인: 없음
[MAIN_DATA] Supabase 세션에서 토큰 갱신 성공
[COUPONS_CHECK] API 호출 시작
[COUPONS_CHECK] 사용자 인증 성공: <user_id>
```

#### 401 오류 후 자동 복구
```
[MAIN_DATA] 쿠폰 조회 401 오류 - 토큰 갱신 후 재시도
[MAIN_DATA] 토큰 갱신 성공, 쿠폰 조회 재시도
[MAIN_DATA] 쿠폰 조회 재시도 성공: 0
```

### 4. 토큰 만료 시뮬레이션 테스트
브라우저 개발자 도구 Console에서:
```javascript
// 1. 현재 토큰 확인
console.log(localStorage.getItem('amiko_token'))

// 2. 만료된 토큰으로 변경 (테스트용)
localStorage.setItem('amiko_token', 'expired_token')

// 3. 페이지 새로고침
location.reload()

// 4. 자동 복구 확인 (새 토큰으로 갱신되어야 함)
```

## 추가 개선 사항 (Future Improvements)

1. **토큰 만료 시간 체크**: 토큰을 사용하기 전에 만료 시간을 확인하여 불필요한 API 호출 감소
2. **전역 인증 에러 핸들러**: 모든 API 호출에 대해 401 오류 자동 처리
3. **토큰 갱신 중복 방지**: 여러 API 호출이 동시에 401을 받았을 때 토큰 갱신을 한 번만 수행

## 관련 파일 (Related Files)

- `/src/hooks/useMainPageData.ts` - 메인 페이지 데이터 훅 (쿠폰, 포인트)
- `/src/app/api/coupons/check/route.ts` - 쿠폰 확인 API 엔드포인트
- `/src/context/AuthContext.tsx` - 인증 컨텍스트 (토큰 제공)

## 버전 정보 (Version Info)

- 수정일: 2025-10-12
- 수정자: AI Assistant
- 영향 범위: 쿠폰 조회 및 인증 토큰 관리

---

## English Summary

### Problem
- 401 Unauthorized error when fetching coupons
- Expired token in localStorage not being refreshed

### Solution
1. **Token Priority**: Use AuthContext token (always fresh) before localStorage token
2. **Auto-Retry**: Automatically refresh token and retry on 401 errors
3. **Better Logging**: Added detailed server-side logging for debugging

### Testing
1. Restart dev server: `npm run dev`
2. Log in and check browser console
3. Should see successful authentication logs without 401 errors

