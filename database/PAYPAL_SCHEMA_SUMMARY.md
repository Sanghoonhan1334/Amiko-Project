# PayPal 결제 시스템 스키마 요약

## 📌 생성된 파일

1. **`paypal-payment-schema.sql`** - 전체 스키마 생성 스크립트
2. **`paypal-test-data.sql`** - 테스트 데이터 삽입 스크립트
3. **`PAYPAL_SCHEMA_GUIDE.md`** - 상세 가이드 문서

---

## ✅ 1. Supabase에서 생성해야 할 테이블 목록

### 필수 테이블 (5개)

| 테이블명 | 상태 | 설명 |
|---------|------|------|
| `users` | 기존 또는 생성 | 사용자 정보 (Supabase Auth 연동) |
| `consultants` | 기존 또는 생성 | 상담사 정보 |
| `bookings` | **업데이트 필요** | 예약 정보 (payment_status, payment_method, payment_id 필드 추가) |
| `payments` | **새로 생성** | PayPal 결제 기록 |
| `purchases` | **새로 생성** | 구매 기록 (쿠폰, VIP 구독 등) |

---

## 📋 2. 각 테이블의 필드명, 타입, 관계

### 2.1. `bookings` 테이블 (업데이트)

**추가 필요한 필드:**

```sql
payment_status TEXT DEFAULT 'pending' 
    CHECK (payment_status IN ('pending', 'paid', 'failed', 'refunded'))
    
payment_method TEXT DEFAULT 'paypal'

payment_id TEXT  -- PayPal Order ID
```

**외래키:**
- `user_id` → `users(id)` (CASCADE)
- `consultant_id` → `consultants(id)` (SET NULL)

### 2.2. `payments` 테이블 (새로 생성)

**주요 필드:**

| 필드명 | 타입 | 설명 | 관계 |
|--------|------|------|------|
| `id` | UUID | 기본키 | PRIMARY KEY |
| `order_id` | TEXT | 내부 주문 번호 | → bookings.order_id |
| `payment_id` | TEXT | PayPal Order ID | UNIQUE |
| `user_id` | UUID | 사용자 ID | → users(id) CASCADE |
| `booking_id` | UUID | 예약 ID | → bookings(id) SET NULL |
| `amount` | INTEGER | 결제 금액 (센트) | |
| `currency` | TEXT | 통화 | DEFAULT 'USD' |
| `status` | TEXT | 결제 상태 | CHECK |
| `payment_method` | TEXT | 결제 방법 | DEFAULT 'paypal' |
| `paypal_data` | JSONB | PayPal 응답 전체 | |

**외래키:**
- `user_id` → `users(id)` (CASCADE)
- `booking_id` → `bookings(id)` (SET NULL)

### 2.3. `purchases` 테이블 (새로 생성)

**주요 필드:**

| 필드명 | 타입 | 설명 | 관계 |
|--------|------|------|------|
| `id` | UUID | 기본키 | PRIMARY KEY |
| `user_id` | UUID | 사용자 ID | → users(id) CASCADE |
| `provider` | TEXT | 결제 제공업체 | CHECK ('paypal', 'toss', 'stripe') |
| `payment_id` | TEXT | PayPal Order ID | UNIQUE |
| `order_id` | TEXT | 내부 주문 번호 | |
| `amount` | DECIMAL(10,2) | 결제 금액 (USD) | |
| `currency` | TEXT | 통화 | DEFAULT 'USD' |
| `country` | TEXT | 결제 국가 | |
| `status` | TEXT | 구매 상태 | DEFAULT 'pending', CHECK |
| `product_type` | TEXT | 상품 타입 | CHECK ('coupon', 'vip_subscription', 'booking') |
| `product_data` | JSONB | 상품 상세 정보 | DEFAULT '{}' |
| `paypal_data` | JSONB | PayPal 응답 전체 | |

**외래키:**
- `user_id` → `users(id)` (CASCADE)

---

## 🗄️ 3. SQL 스크립트

### 3.1. 전체 스키마 생성

**파일:** `database/paypal-payment-schema.sql`

**포함 내용:**
- ✅ 테이블 생성 (IF NOT EXISTS)
- ✅ 인덱스 생성
- ✅ 외래키 제약조건
- ✅ RLS (Row Level Security) 정책
- ✅ 트리거 (updated_at 자동 갱신)
- ✅ 업데이트 시간 자동 갱신 함수

### 3.2. 테스트 데이터

**파일:** `database/paypal-test-data.sql`

**포함 내용:**
- ✅ 테스트 상담사 1명
- ✅ 테스트 예약 1건
- ✅ 테스트 결제 기록 1건
- ✅ 테스트 구매 기록 1건 (쿠폰)

---

## 🧪 4. 테스트용 유저 1명과 결제 데이터 1건 INSERT SQL

### 4.1. 테스트 사용자 생성 (Supabase Auth에서 먼저 생성 필요)

```sql
-- 1. Supabase Auth에서 사용자 생성 (Dashboard > Authentication > Users)
-- Email: test@amiko.com

-- 2. public.users에 프로필 추가
INSERT INTO public.users (id, email, full_name)
SELECT id, email, '테스트 사용자'
FROM auth.users
WHERE email = 'test@amiko.com'
ON CONFLICT (id) DO NOTHING;
```

### 4.2. 테스트 결제 데이터 삽입

**파일:** `database/paypal-test-data.sql` 실행

**또는 직접 실행:**

```sql
-- 테스트 예약 생성
INSERT INTO public.bookings (
    user_id, consultant_id, order_id, topic, 
    start_at, end_at, duration, price, currency,
    status, payment_status, payment_method
)
SELECT 
    (SELECT id FROM public.users LIMIT 1),
    (SELECT id FROM public.consultants LIMIT 1),
    'order-test-001',
    '테스트 상담 예약',
    NOW() + INTERVAL '1 day',
    NOW() + INTERVAL '1 day' + INTERVAL '1 hour',
    60,
    50.00,
    'USD',
    'pending',
    'pending',
    'paypal'
WHERE NOT EXISTS (
    SELECT 1 FROM public.bookings WHERE order_id = 'order-test-001'
);

-- 테스트 결제 기록 생성
INSERT INTO public.payments (
    order_id, payment_id, user_id, booking_id,
    amount, currency, status, payment_method, paypal_data
)
SELECT 
    'order-test-001',
    'PAYPAL-TEST-001',
    (SELECT id FROM public.users LIMIT 1),
    (SELECT id FROM public.bookings WHERE order_id = 'order-test-001' LIMIT 1),
    5000, -- $50.00 (센트)
    'USD',
    'completed',
    'paypal',
    '{"id": "PAYPAL-TEST-001", "status": "COMPLETED"}'::jsonb
WHERE NOT EXISTS (
    SELECT 1 FROM public.payments WHERE payment_id = 'PAYPAL-TEST-001'
);
```

---

## 🚀 5. 마이그레이션 vs 수동 실행 추천

### ✅ **수동 실행 권장** (초기 설정)

**이유:**
1. ✅ **간단함**: Supabase Dashboard에서 바로 실행
2. ✅ **즉시 확인**: 실행 결과 바로 확인 가능
3. ✅ **디버깅 용이**: 에러 발생 시 바로 수정
4. ✅ **일회성 작업**: 초기 설정이므로 마이그레이션 관리 불필요

**실행 순서:**
```
1. Supabase Dashboard > SQL Editor 열기
2. paypal-payment-schema.sql 복사 & 실행
3. paypal-test-data.sql 복사 & 실행 (선택)
4. 데이터 확인
```

### ⚠️ **마이그레이션 사용 시** (팀 협업 또는 프로덕션)

**언제 사용:**
- 팀과 스키마 변경을 버전 관리해야 할 때
- 프로덕션 환경에 배포할 때
- 여러 환경(dev, staging, prod)을 관리할 때

**Supabase CLI 사용:**
```bash
supabase migration new paypal_payment_schema
# 생성된 파일에 SQL 복사
supabase db push
```

---

## ⚠️ 중요 사항

### 1. 코드 수정 필요

**`src/app/api/paypal/create-order/route.ts`** 파일에서 `purchases` 테이블에 실제로 저장하는 로직이 누락되어 있습니다.

**현재 코드 (73-86줄):**
```typescript
// 구매 기록 생성 (pending 상태)
const purchaseData = {
  orderId,
  paymentId: paypalData.id,
  amount: amount / 100,
  productType: productType || 'coupon',
  productData: productData || {},
  paypalData: paypalData
};

return NextResponse.json({
  orderId: paypalData.id,
  purchaseData
});
```

**수정 필요:**
```typescript
// 구매 기록 생성 (pending 상태)
const { data: purchase, error: purchaseError } = await supabase
  .from('purchases')
  .insert({
    user_id: body.userId, // 또는 auth에서 가져오기
    provider: 'paypal',
    payment_id: paypalData.id,
    order_id: orderId,
    amount: amount / 100,
    currency: 'USD',
    country: body.country || null,
    status: 'pending',
    product_type: productType || 'coupon',
    product_data: productData || {},
    paypal_data: paypalData
  })
  .select()
  .single();

if (purchaseError) {
  console.error('[PayPal] Failed to create purchase record:', purchaseError);
  // 에러 처리 (선택적 - 결제는 계속 진행)
}

return NextResponse.json({
  orderId: paypalData.id,
  purchaseId: purchase?.id
});
```

### 2. Supabase 클라이언트 설정

`create-order` API에서 Supabase 클라이언트를 사용하려면:

```typescript
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);
```

---

## 📊 데이터 플로우

```
1. create-order
   └─> purchases 테이블에 pending 상태로 저장
   
2. approve-order
   ├─> payments 테이블에 completed 상태로 저장
   └─> bookings 테이블 업데이트 (payment_status = 'paid')
   
3. webhook
   └─> purchases 테이블 업데이트 (status 변경)
```

---

## ✅ 체크리스트

- [ ] `paypal-payment-schema.sql` 실행 완료
- [ ] `bookings` 테이블에 `payment_status`, `payment_method`, `payment_id` 필드 추가 확인
- [ ] `payments` 테이블 생성 확인
- [ ] `purchases` 테이블 생성 확인
- [ ] 인덱스 생성 확인
- [ ] RLS 정책 확인
- [ ] 테스트 데이터 삽입 (선택)
- [ ] `create-order` API에 Supabase 저장 로직 추가
- [ ] PayPal 결제 플로우 테스트

---

**생성일:** 2025-12-09  
**버전:** 1.0
