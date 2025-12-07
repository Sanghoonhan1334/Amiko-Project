# 코드 개선 가이드 (협업 준비)

중남미 개발자와의 협업을 위해 개선이 필요한 코드 영역을 정리한 문서입니다.

## 🔍 발견된 주요 이슈

### 1. 한국어 하드코딩 및 에러 메시지

**문제점:**
- API 에러 메시지가 한국어로 하드코딩되어 있음
- 코드 주석이 한국어로 작성됨
- 일부 UI 텍스트가 코드에 직접 포함됨

**영향받는 파일 예시:**
- `src/lib/paypal.ts` - 에러 메시지가 한국어
- `src/app/api/paypal/create-order/route.ts` - 에러 메시지가 한국어
- `src/app/api/auth/verification/route.ts` - 에러 메시지가 한국어
- `src/app/verification/page.tsx` - 한국어 하드코딩

**개선 방안:**
```typescript
// ❌ 나쁜 예
throw new Error('PayPal 주문 생성 실패');

// ✅ 좋은 예
throw new Error('PayPal order creation failed');
// 또는
const errorMessages = {
  en: 'PayPal order creation failed',
  es: 'Error al crear la orden de PayPal',
  ko: 'PayPal 주문 생성 실패'
};
```

**우선순위:** 🔴 높음

---

### 2. 과도한 console.log 사용

**문제점:**
- 프로덕션 코드에 `console.log`가 3,786개 발견됨
- 디버깅용 로그가 그대로 남아있음
- 프로덕션 성능에 영향 가능

**개선 방안:**
```typescript
// ❌ 나쁜 예
console.log('[VERIFICATION] 인증코드 생성:', code);

// ✅ 좋은 예
// 개발 환경에서만 로깅
if (process.env.NODE_ENV === 'development') {
  console.log('[VERIFICATION] Code generated:', code);
}

// 또는 로깅 라이브러리 사용 (예: winston, pino)
import logger from '@/lib/logger';
logger.debug('[VERIFICATION] Code generated', { code });
```

**우선순위:** 🟡 중간

---

### 3. 타입 안전성 부족

**문제점:**
- `any` 타입이 466개 발견됨
- 타입 정의가 불완전함

**개선 방안:**
```typescript
// ❌ 나쁜 예
function processData(data: any) {
  return data.value;
}

// ✅ 좋은 예
interface ProcessDataInput {
  value: string;
  id: number;
}

function processData(data: ProcessDataInput): string {
  return data.value;
}
```

**우선순위:** 🟡 중간

---

### 4. 코드 주석이 한국어

**문제점:**
- 코드 주석이 한국어로 작성되어 협업자가 이해하기 어려움

**개선 방안:**
```typescript
// ❌ 나쁜 예
// 센트를 달러로 변환
const dollarAmount = amount / 100;

// ✅ 좋은 예
// Convert cents to dollars
const dollarAmount = amount / 100;
```

**우선순위:** 🟢 낮음 (점진적 개선)

---

### 5. 테스트 코드 부족

**문제점:**
- 테스트 파일이 거의 없음 (1개만 발견)
- 코드 변경 시 리그레션 위험

**개선 방안:**
- 단위 테스트 추가 (Jest, Vitest)
- API 엔드포인트 테스트 추가
- 통합 테스트 추가

**우선순위:** 🟡 중간

---

### 6. TODO/FIXME 주석

**문제점:**
- 44개의 TODO/FIXME 주석 발견
- 미완성 작업이나 수정 필요 사항이 코드에 남아있음

**개선 방안:**
- 이슈 트래커에 등록
- 우선순위에 따라 처리
- 완료된 항목은 주석 제거

**우선순위:** 🟢 낮음

---

## 📋 즉시 개선 권장 사항

### 1. 에러 메시지 국제화 (우선순위: 높음)

**대상 파일:**
- `src/lib/paypal.ts`
- `src/app/api/paypal/*/route.ts`
- `src/app/api/auth/verification/route.ts`
- 기타 API 라우트

**작업 내용:**
1. 에러 메시지를 영어로 변경
2. 필요시 다국어 지원 추가
3. 에러 코드 체계 도입

### 2. 코드 주석 영어화 (우선순위: 중간)

**대상:**
- 새로운 코드 작성 시 영어 주석 사용
- 기존 코드는 점진적으로 개선

### 3. 로깅 시스템 개선 (우선순위: 중간)

**작업 내용:**
1. 로깅 라이브러리 도입 (예: winston, pino)
2. 환경별 로그 레벨 설정
3. 프로덕션에서는 불필요한 로그 제거

### 4. 타입 정의 강화 (우선순위: 중간)

**작업 내용:**
1. `any` 타입 제거
2. 인터페이스/타입 정의 추가
3. 타입 가드 함수 추가

---

## 🛠️ 구체적인 개선 작업 예시

### 예시 1: PayPal 에러 메시지 개선

**현재 코드 (`src/lib/paypal.ts`):**
```typescript
throw new Error('PayPal 주문 생성 실패');
```

**개선된 코드:**
```typescript
// 에러 코드 정의
export enum PayPalErrorCode {
  ORDER_CREATION_FAILED = 'PAYPAL_ORDER_CREATION_FAILED',
  ORDER_APPROVAL_FAILED = 'PAYPAL_ORDER_APPROVAL_FAILED',
  INVALID_CREDENTIALS = 'PAYPAL_INVALID_CREDENTIALS',
}

// 에러 클래스
export class PayPalError extends Error {
  constructor(
    public code: PayPalErrorCode,
    message: string,
    public details?: unknown
  ) {
    super(message);
    this.name = 'PayPalError';
  }
}

// 사용 예시
throw new PayPalError(
  PayPalErrorCode.ORDER_CREATION_FAILED,
  'Failed to create PayPal order',
  { orderId, amount }
);
```

### 예시 2: 로깅 시스템 도입

**새 파일: `src/lib/logger.ts`**
```typescript
type LogLevel = 'debug' | 'info' | 'warn' | 'error';

class Logger {
  private isDevelopment = process.env.NODE_ENV === 'development';

  debug(message: string, data?: unknown) {
    if (this.isDevelopment) {
      console.debug(`[DEBUG] ${message}`, data);
    }
  }

  info(message: string, data?: unknown) {
    console.info(`[INFO] ${message}`, data);
  }

  warn(message: string, data?: unknown) {
    console.warn(`[WARN] ${message}`, data);
  }

  error(message: string, error?: Error | unknown) {
    console.error(`[ERROR] ${message}`, error);
  }
}

export const logger = new Logger();
```

### 예시 3: 타입 안전성 개선

**현재 코드:**
```typescript
function processPayment(data: any) {
  return data.amount * 100;
}
```

**개선된 코드:**
```typescript
interface PaymentData {
  amount: number;
  currency: string;
  orderId: string;
}

function processPayment(data: PaymentData): number {
  if (data.amount <= 0) {
    throw new Error('Invalid payment amount');
  }
  return data.amount * 100;
}
```

---

## 📝 체크리스트

협업 시작 전에 다음 항목들을 점검하세요:

### 필수 (Must Have) ✅ 완료
- [x] 주요 API 에러 메시지를 영어로 변경
- [x] PayPal 관련 코드 주석 영어화
- [x] 환경 변수 문서화 완료 (`.env.local.example`)
- [x] 결제/인증/보안 관련 console.log 정리

### 권장 (Should Have)
- [ ] 로깅 시스템 개선
- [ ] 타입 정의 강화 (특히 `any` 타입 제거)
- [ ] 코드 주석 영어화 (새 코드부터)

### 선택 (Nice to Have)
- [ ] 테스트 코드 추가
- [ ] TODO/FIXME 정리
- [ ] 코드 리팩토링

---

## 🎯 우선순위별 개선 영역 추천

### 1단계: 타입 안전성 개선 (우선순위: 높음)

**추천 영역:**
- `src/app/api/paypal/**` - PayPal 관련 API (마리아가 작업할 예정)
- `src/app/api/auth/**` - 인증 관련 API (보안 중요)
- `src/lib/paypal.ts` - PayPal 유틸리티 함수

**작업 내용:**
- `any` 타입을 구체적인 인터페이스로 교체
- 함수 파라미터와 반환 타입 명시
- 에러 타입 정의

**예시:**
```typescript
// 현재
async function handlePayment(supabase: any, purchase: any, resource: any) { ... }

// 개선
interface SupabaseClient { ... }
interface Purchase { ... }
interface PayPalResource { ... }

async function handlePayment(
  supabase: SupabaseClient, 
  purchase: Purchase, 
  resource: PayPalResource
): Promise<void> { ... }
```

---

### 2단계: 테스트 코드 추가 (우선순위: 중간)

**추천 영역:**
1. **PayPal 결제 플로우** (가장 중요)
   - `src/app/api/paypal/create-order/route.ts`
   - `src/app/api/paypal/approve-order/route.ts`
   - `src/app/api/paypal/webhook/route.ts`
   - `src/lib/paypal.ts`

2. **인증 시스템**
   - `src/app/api/auth/verification/route.ts`
   - `src/app/api/auth/signup/route.ts`
   - `src/app/api/auth/signin/route.ts`

3. **결제 관련 유틸리티**
   - `src/lib/paypal.ts`
   - `src/components/payments/PayPalPaymentButton.tsx`

**작업 내용:**
- 단위 테스트 작성 (Jest 또는 Vitest)
- API 엔드포인트 통합 테스트
- Mock 데이터 활용

**예시 테스트 구조:**
```
src/
├── app/
│   └── api/
│       └── paypal/
│           └── create-order/
│               └── route.test.ts
└── lib/
    └── paypal.test.ts
```

---

### 3단계: 코드 주석 영어화 (우선순위: 낮음, 점진적)

**추천 영역 (우선순위 순):**
1. **PayPal 관련 코드** (마리아가 작업할 예정)
   - `src/lib/paypal.ts`
   - `src/app/api/paypal/**`
   - `src/components/payments/PayPalPaymentButton.tsx`

2. **인증 관련 코드**
   - `src/app/api/auth/verification/route.ts`
   - `src/lib/smsService.ts`
   - `src/lib/twilioService.ts`

3. **공통 유틸리티**
   - `src/lib/supabase.ts`
   - `src/lib/translation.ts`

**작업 방법:**
- 새로운 코드 작성 시 영어 주석 사용
- 기존 코드는 리팩토링 시 함께 개선
- 중요한 비즈니스 로직부터 우선 개선

---

### 4단계: TODO/FIXME 정리 (우선순위: 낮음)

**추천 작업 순서:**
1. 이슈 트래커에 등록
2. 우선순위에 따라 처리
3. 완료된 항목은 주석 제거

**발견된 주요 TODO/FIXME:**
- PayPal webhook 검증 로직 추가 필요
- 에러 처리 개선 필요
- 타입 정의 보완 필요

---

## 🔗 관련 문서

- `CONTRIBUTING.md` - 협업 가이드
- `PROJECT_OVERVIEW.md` - 프로젝트 개요
- `docs/PAYMENTS/PAYPAL_PLAN.md` - PayPal 구현 계획

---

## 📞 문의

개선 작업 중 문제가 발생하거나 질문이 있으면 이슈를 생성하거나 팀에 문의하세요.
