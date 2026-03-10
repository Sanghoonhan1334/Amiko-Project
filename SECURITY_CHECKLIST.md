# 🔒 AMIKO 프로젝트 보안 점검 체크리스트

**생성일**: 2025-01-XX  
**검토 버전**: Next.js 15.5.7, React 18.3.1

---

## ✅ 1. 환경변수 노출 여부

### 현재 상태
- ✅ **안전**: `NEXT_PUBLIC_*` 환경변수는 클라이언트에서 사용 가능하도록 설계됨
- ✅ **안전**: Service Role Key는 `NEXT_PUBLIC_` 접두사 없이 사용됨

### 확인된 환경변수 사용
```typescript
// 클라이언트에서 사용 가능 (의도된 설계)
NEXT_PUBLIC_SUPABASE_URL ✅
NEXT_PUBLIC_SUPABASE_ANON_KEY ✅
NEXT_PUBLIC_YOUTUBE_API_KEY ✅
NEXT_PUBLIC_VAPID_PUBLIC_KEY ✅

// 서버 전용 (안전)
SUPABASE_SERVICE_ROLE_KEY ✅
TWILIO_ACCOUNT_SID ✅
TWILIO_AUTH_TOKEN ✅
VAPID_PRIVATE_KEY ✅
```

### ⚠️ 주의사항
1. **`.env.local` 파일이 Git에 커밋되지 않았는지 확인**
   ```bash
   # .gitignore 확인
   cat .gitignore | grep .env
   ```

2. **Vercel 환경변수 설정 확인**
   - Production, Preview, Development 환경별로 올바르게 설정되었는지 확인
   - Service Role Key는 Production에서만 사용되도록 제한 권장

### 해결 방법
```bash
# .gitignore 확인
echo ".env.local" >> .gitignore
echo ".env*.local" >> .gitignore

# Git에서 실수로 커밋된 경우 제거
git rm --cached .env.local
```

---

## ✅ 2. .env와 서버 액션 관련 코드 보안 위협 요소

### 현재 상태
- ✅ **안전**: Server Actions는 발견되지 않음 (API Routes 사용)
- ✅ **안전**: 환경변수는 서버 사이드에서만 접근

### 확인 사항
- [x] `.env.local` 파일이 `.gitignore`에 포함되어 있는지
- [x] 환경변수가 클라이언트 번들에 포함되지 않는지
- [x] Service Role Key가 클라이언트 코드에 노출되지 않는지

### ⚠️ 발견된 잠재적 위험
1. **환경변수 검증 부족**
   - 일부 API 라우트에서 환경변수 존재 여부만 확인
   - 값의 유효성 검증 없음

### 해결 방법
```typescript
// src/lib/env-guard.ts 개선
export function validateEnv() {
  const required = {
    SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
    // ... 기타 필수 환경변수
  }
  
  const missing = Object.entries(required)
    .filter(([_, value]) => !value)
    .map(([key]) => key)
  
  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`)
  }
}
```

---

## ⚠️ 3. Supabase Service Role Key 사용 부분

### 현재 상태
- ⚠️ **주의 필요**: Service Role Key가 여러 API 라우트에서 사용됨

### 발견된 사용 위치 (21개 파일)
```
src/lib/supabaseServer.ts
src/lib/supabase/admin.ts
src/app/api/quiz/[id]/feedback/route.ts
src/app/api/paypal/approve-order/route.ts
src/app/api/galleries/reorder/route.ts
src/app/api/chat/rooms/route.ts
src/app/api/chat/rooms/create-amiko/route.ts
src/app/api/auth/reset-password/confirm/route.ts
src/app/api/auth/biometric/session/route.ts
src/app/api/test-users/route.ts ⚠️ (제거 필요)
src/app/api/test-env/route.ts ⚠️ (제거 필요)
src/app/api/auth/reset-password/route.ts
src/app/api/auth/check-nickname/route.ts
src/app/api/admin/add-operator/route.ts
src/app/api/admin/check-operator/route.ts
src/app/api/notifications/settings/route.ts
src/app/api/news/[id]/route.ts
... 기타
```

### ⚠️ 위험 요소
1. **인증 없이 Service Role Key 사용**
   - 일부 API에서 사용자 인증 없이 Service Role Key 사용
   - 예: `src/app/api/test-users/route.ts` - 인증 없이 모든 사용자 조회 가능

2. **권한 검증 부족**
   - 관리자 권한 확인 없이 Service Role Key 사용

### 해결 방법

#### 방법 1: 인증 미들웨어 추가
```typescript
// src/lib/middleware/auth.ts
export async function requireAuth(request: NextRequest) {
  const authHeader = request.headers.get('authorization')
  if (!authHeader?.startsWith('Bearer ')) {
    throw new Error('Unauthorized')
  }
  
  const token = authHeader.replace('Bearer ', '')
  const supabase = createClient()
  const { data: { user }, error } = await supabase.auth.getUser(token)
  
  if (error || !user) {
    throw new Error('Invalid token')
  }
  
  return user
}

// 사용 예시
export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth(request)
    // Service Role Key 사용
  } catch (error) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
}
```

#### 방법 2: 관리자 권한 확인
```typescript
// src/lib/middleware/admin.ts
export async function requireAdmin(request: NextRequest) {
  const user = await requireAuth(request)
  
  const adminSupabase = createAdminClient()
  const { data: adminUser } = await adminSupabase
    .from('admin_users')
    .select('*')
    .eq('user_id', user.id)
    .eq('is_active', true)
    .single()
  
  if (!adminUser) {
    throw new Error('Admin access required')
  }
  
  return { user, adminUser }
}
```

---

## 🚨 4. 미사용 API 라우트 제거 여부

### 발견된 테스트/디버그 API 라우트

#### 🔴 즉시 제거 필요 (프로덕션 위험)

**총 28개 테스트 API 라우트 발견**

**심각한 보안 위험 (즉시 제거)**
```
src/app/api/test-users/route.ts
  - Service Role Key로 모든 사용자 정보 노출
  - 인증 없이 접근 가능
  
src/app/api/test-env/route.ts
  - 환경변수 존재 여부 노출 (정보 유출)
  
src/app/api/test-supabase/route.ts
  - Supabase 연결 테스트 (불필요)
  
src/app/api/test-storage/route.ts
  - Storage 테스트 (불필요)
  
src/app/api/test-db/route.ts
  - DB 연결 테스트 (불필요)
  
src/app/api/test-twilio/route.ts
  - Twilio 테스트 (불필요)
  
src/app/api/test-verification/route.ts
  - 인증 테스트 (불필요)
  
src/app/api/test-comments/route.ts
  - 댓글 테스트 (불필요)
```

**추가 테스트 라우트 (제거 권장)**
```
src/app/api/test-email/route.ts
src/app/api/test-sms/route.ts
src/app/api/test-smtp/route.ts
src/app/api/test-hiworks-smtp/route.ts
src/app/api/test-hiworks-advanced/route.ts
src/app/api/simple-email-test/route.ts
src/app/api/notifications/test/route.ts
src/app/api/notifications/test-supabase/route.ts
src/app/api/notifications/test-webpush/route.ts
src/app/api/notifications/test-logs-table/route.ts
src/app/api/points/test/route.ts
src/app/api/admin/points/test/route.ts
src/app/api/admin/points/test-users/route.ts
src/app/api/admin/create-sample-test/route.ts
src/app/api/admin/create-sample-test-simple/route.ts
src/app/api/admin/create-fortune-test/route.ts
src/app/api/seed-tests/route.ts
src/app/api/cron/test-reminder/route.ts
```

#### 🟡 검토 필요 (조건부 제거)
```
src/app/api/admin/points/test/route.ts
src/app/api/admin/points/test-users/route.ts
src/app/api/admin/create-sample-test/route.ts
```

### 해결 방법

#### Step 1: 테스트 API 라우트 제거
```bash
# 제거할 파일 목록
rm src/app/api/test-users/route.ts
rm src/app/api/test-env/route.ts
rm src/app/api/test-supabase/route.ts
rm src/app/api/test-storage/route.ts
rm src/app/api/test-db/route.ts
rm src/app/api/test-twilio/route.ts
rm src/app/api/test-verification/route.ts
rm src/app/api/test-comments/route.ts
```

#### Step 2: 환경별 라우트 보호 (선택사항)
```typescript
// src/app/api/test-*/route.ts
export async function GET() {
  // 프로덕션에서 차단
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }
  
  // 개발 환경에서만 허용
  // ... 테스트 코드
}
```

#### Step 3: Git에서 제거
```bash
git rm src/app/api/test-*/route.ts
git commit -m "security: Remove test API routes from production"
```

---

## ✅ 5. 프론트엔드에서 직접 DB 쓰는 부분

### 현재 상태
- ✅ **안전**: 대부분의 DB 접근은 API Routes를 통해 이루어짐
- ⚠️ **주의**: 일부 클라이언트 컴포넌트에서 Supabase 클라이언트 직접 사용

### 발견된 직접 사용 위치
```typescript
// src/components/main/app/community/ChatRoomClient.tsx
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)
```

### 분석
- ✅ **안전**: ANON_KEY 사용 (Service Role Key 아님)
- ✅ **안전**: Supabase RLS (Row Level Security) 정책에 의해 보호됨
- ✅ **안전**: 읽기 전용 작업 또는 사용자 자신의 데이터만 접근

### 권장사항
1. **RLS 정책 확인**
   - 모든 테이블에 적절한 RLS 정책이 설정되어 있는지 확인
   - 사용자가 자신의 데이터만 접근할 수 있도록 제한

2. **민감한 작업은 API Routes로 이동**
   ```typescript
   // ❌ 클라이언트에서 직접
   await supabase.from('users').update({ ... })
   
   // ✅ API Route 사용
   await fetch('/api/users/update', { method: 'POST', ... })
   ```

### 해결 방법
```typescript
// src/lib/supabase-client.ts 개선
export function createSupabaseBrowserClient() {
  // RLS가 활성화된 ANON_KEY만 사용
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}

// 민감한 작업은 API Routes로 제한
// - 사용자 정보 수정
// - 결제 처리
// - 관리자 작업
```

---

## ✅ 6. 이전 배포 버전 접근 가능 여부

### 현재 상태
- ⚠️ **주의**: Vercel에서 React2Shell 취약점 경고 표시됨
- ✅ **해결 중**: 배포 보호 활성화 권장됨

### 확인 사항
- [x] Vercel 배포 보호 활성화 여부
- [ ] 이전 배포 버전 자동 삭제 설정
- [ ] Preview 배포 접근 제한

### 해결 방법

#### 방법 1: Vercel 배포 보호 활성화 (권장)
1. Vercel 대시보드 → Project Settings → Deployment Protection
2. "Enable Deployment Protection" 활성화
3. 이전 취약한 배포 버전 자동 차단

#### 방법 2: 이전 배포 자동 삭제
```json
// vercel.json
{
  "git": {
    "deploymentEnabled": {
      "main": true,
      "preview": true
    }
  },
  "cleanUrls": true
}
```

#### 방법 3: Preview 배포 제한
```typescript
// middleware.ts 개선
export function middleware(request: NextRequest) {
  // Preview 배포는 인증 필요
  if (process.env.VERCEL_ENV === 'preview') {
    const authHeader = request.headers.get('authorization')
    if (!authHeader) {
      return new NextResponse('Unauthorized', { status: 401 })
    }
  }
  
  // ... 기타 미들웨어 로직
}
```

---

## 📋 종합 보안 체크리스트

### 즉시 조치 필요 (High Priority)
- [ ] **테스트 API 라우트 제거** (8개 파일)
  - `test-users`, `test-env`, `test-supabase`, `test-storage`, `test-db`, `test-twilio`, `test-verification`, `test-comments`
- [ ] **Vercel 배포 보호 활성화**
- [ ] **Service Role Key 사용 시 인증 추가**
  - `test-users/route.ts` 제거 또는 인증 추가
  - `test-env/route.ts` 제거

### 중기 조치 (Medium Priority)
- [ ] **환경변수 검증 강화**
  - `env-guard.ts` 개선
  - 필수 환경변수 누락 시 빌드 실패
- [ ] **관리자 권한 미들웨어 추가**
  - Service Role Key 사용 시 관리자 권한 확인
- [ ] **RLS 정책 재검토**
  - 모든 테이블에 적절한 RLS 정책 설정 확인

### 장기 조치 (Low Priority)
- [ ] **API 라우트 인증 표준화**
  - 공통 인증 미들웨어 생성
  - 모든 API 라우트에 적용
- [ ] **보안 로깅 추가**
  - 인증 실패, 권한 위반 시도 로깅
- [ ] **정기 보안 감사**
  - 분기별 보안 점검
  - 의존성 취약점 스캔 (`npm audit`)

---

## 🔧 실행 가능한 명령어

### 1. 테스트 API 라우트 제거
```bash
cd "/Users/admin/Desktop/사업 관련 파일/AMIKO-Project-main"

# 모든 테스트 API 라우트 제거
rm -f src/app/api/test-*/route.ts
rm -f src/app/api/*test*/route.ts
rm -f src/app/api/notifications/test*/route.ts
rm -f src/app/api/admin/*test*/route.ts
rm -f src/app/api/admin/points/test*/route.ts
rm -f src/app/api/points/test/route.ts
rm -f src/app/api/simple-email-test/route.ts
rm -f src/app/api/seed-tests/route.ts
rm -f src/app/api/cron/test-reminder/route.ts

# Git에서 제거
git rm src/app/api/test-*/route.ts 2>/dev/null || true
git rm src/app/api/*test*/route.ts 2>/dev/null || true
git rm src/app/api/notifications/test*/route.ts 2>/dev/null || true
git rm src/app/api/admin/*test*/route.ts 2>/dev/null || true
git rm src/app/api/admin/points/test*/route.ts 2>/dev/null || true
git rm src/app/api/points/test/route.ts 2>/dev/null || true
git rm src/app/api/simple-email-test/route.ts 2>/dev/null || true
git rm src/app/api/seed-tests/route.ts 2>/dev/null || true
git rm src/app/api/cron/test-reminder/route.ts 2>/dev/null || true

git commit -m "security: Remove test API routes from production"
```

### 2. 의존성 취약점 스캔
```bash
npm audit
npm audit fix
```

### 3. 환경변수 검증
```bash
# .env.local.example과 실제 .env.local 비교
diff <(grep -v '^#' .env.local.example | sort) <(grep -v '^#' .env.local | sort)
```

---

## 📚 참고 자료

- [Next.js Security Best Practices](https://nextjs.org/docs/app/building-your-application/configuring/environment-variables)
- [Supabase RLS Guide](https://supabase.com/docs/guides/auth/row-level-security)
- [Vercel Deployment Protection](https://vercel.com/docs/security/deployment-protection)
- [OWASP Top 10](https://owasp.org/www-project-top-ten/)

---

**검토 완료일**: 2025-01-XX  
**다음 검토 예정일**: 2025-04-XX (분기별)
