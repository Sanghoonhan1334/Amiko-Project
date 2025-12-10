# PayPal 결제 시스템 Supabase 스키마 가이드

## 📋 목차

1. [테이블 목록](#1-테이블-목록)
2. [테이블 구조](#2-테이블-구조)
3. [실행 방법](#3-실행-방법)
4. [테스트 데이터](#4-테스트-데이터)
5. [마이그레이션 vs 수동 실행](#5-마이그레이션-vs-수동-실행)

---

## 1. 테이블 목록

PayPal 결제 시스템에 필요한 Supabase 테이블:

### 필수 테이블 (5개)

1. **`users`** - 사용자 정보 (이미 존재할 수 있음)
2. **`consultants`** - 상담사 정보 (이미 존재할 수 있음)
3. **`bookings`** - 예약 정보 (payment_status, payment_method, payment_id 필드 필요)
4. **`payments`** - PayPal 결제 기록 (새로 생성 필요)
5. **`purchases`** - 구매 기록 (쿠폰, VIP 구독 등) (새로 생성 필요)

---

## 2. 테이블 구조

### 2.1. `bookings` 테이블 (업데이트 필요)

**추가/수정 필요한 필드:**

```sql
-- 이미 존재하는 경우 ALTER TABLE로 추가
ALTER TABLE public.bookings 
ADD COLUMN IF NOT EXISTS payment_status TEXT DEFAULT 'pending' 
    CHECK (payment_status IN ('pending', 'paid', 'failed', 'refunded'));

ALTER TABLE public.bookings 
ADD COLUMN IF NOT EXISTS payment_method TEXT DEFAULT 'paypal';

ALTER TABLE public.bookings 
ADD COLUMN IF NOT EXISTS payment_id TEXT;
```

**전체 구조:**

| 필드명 | 타입 | 설명 | 제약조건 |
|--------|------|------|----------|
| `id` | UUID | 기본키 | PRIMARY KEY |
| `user_id` | UUID | 사용자 ID | FOREIGN KEY → users(id) |
| `consultant_id` | UUID | 상담사 ID | FOREIGN KEY → consultants(id) |
| `order_id` | TEXT | 내부 주문 번호 | UNIQUE, NOT NULL |
| `topic` | TEXT | 상담 주제 | NOT NULL |
| `description` | TEXT | 상세 설명 | |
| `start_at` | TIMESTAMPTZ | 시작 시간 | NOT NULL |
| `end_at` | TIMESTAMPTZ | 종료 시간 | NOT NULL |
| `duration` | INTEGER | 상담 시간 (분) | NOT NULL |
| `price` | DECIMAL(10,2) | 가격 (USD) | NOT NULL |
| `currency` | TEXT | 통화 | DEFAULT 'USD' |
| `status` | TEXT | 예약 상태 | DEFAULT 'pending', CHECK |
| **`payment_status`** | TEXT | **결제 상태** | **DEFAULT 'pending', CHECK** |
| **`payment_method`** | TEXT | **결제 방법** | **DEFAULT 'paypal'** |
| **`payment_id`** | TEXT | **PayPal Order ID** | |
| `meeting_link` | TEXT | 화상회의 링크 | |
| `notes` | TEXT | 메모 | |
| `created_at` | TIMESTAMPTZ | 생성 시간 | DEFAULT NOW() |
| `updated_at` | TIMESTAMPTZ | 수정 시간 | DEFAULT NOW() |

### 2.2. `payments` 테이블 (새로 생성)

**목적:** PayPal 결제 승인 시 저장 (`/api/paypal/approve-order`)

| 필드명 | 타입 | 설명 | 제약조건 |
|--------|------|------|----------|
| `id` | UUID | 기본키 | PRIMARY KEY |
| `order_id` | TEXT | 내부 주문 번호 | NOT NULL |
| `payment_id` | TEXT | PayPal Order ID | UNIQUE, NOT NULL |
| `user_id` | UUID | 사용자 ID | FOREIGN KEY → users(id) |
| `booking_id` | UUID | 예약 ID | FOREIGN KEY → bookings(id), NULL 허용 |
| `amount` | INTEGER | 결제 금액 (센트) | NOT NULL |
| `currency` | TEXT | 통화 | DEFAULT 'USD' |
| `status` | TEXT | 결제 상태 | NOT NULL, CHECK |
| `payment_method` | TEXT | 결제 방법 | DEFAULT 'paypal' |
| `paypal_data` | JSONB | PayPal API 응답 전체 | |
| `created_at` | TIMESTAMPTZ | 생성 시간 | DEFAULT NOW() |
| `updated_at` | TIMESTAMPTZ | 수정 시간 | DEFAULT NOW() |

**상태 값:** `pending`, `completed`, `failed`, `cancelled`, `refunded`

### 2.3. `purchases` 테이블 (새로 생성)

**목적:** 구매 기록 (쿠폰, VIP 구독 등) - `create-order`에서 pending으로 저장, `webhook`에서 업데이트

| 필드명 | 타입 | 설명 | 제약조건 |
|--------|------|------|----------|
| `id` | UUID | 기본키 | PRIMARY KEY |
| `user_id` | UUID | 사용자 ID | FOREIGN KEY → users(id) |
| `provider` | TEXT | 결제 제공업체 | NOT NULL, CHECK |
| `payment_id` | TEXT | PayPal Order ID | UNIQUE, NOT NULL |
| `order_id` | TEXT | 내부 주문 번호 | NOT NULL |
| `amount` | DECIMAL(10,2) | 결제 금액 (USD) | NOT NULL |
| `currency` | TEXT | 통화 | DEFAULT 'USD' |
| `country` | TEXT | 결제 국가 | |
| `status` | TEXT | 구매 상태 | DEFAULT 'pending', CHECK |
| `product_type` | TEXT | 상품 타입 | NOT NULL, CHECK |
| `product_data` | JSONB | 상품 상세 정보 | DEFAULT '{}' |
| `paypal_data` | JSONB | PayPal API 응답 전체 | |
| `created_at` | TIMESTAMPTZ | 생성 시간 | DEFAULT NOW() |
| `updated_at` | TIMESTAMPTZ | 수정 시간 | DEFAULT NOW() |

**제공업체 값:** `paypal`, `toss`, `stripe`  
**상태 값:** `pending`, `paid`, `failed`, `canceled`, `refunded`  
**상품 타입:** `coupon`, `vip_subscription`, `booking`

---

## 3. 실행 방법

### 방법 1: Supabase Dashboard (권장 - 초기 설정)

1. **Supabase Dashboard 접속**
   - https://app.supabase.com 접속
   - 프로젝트 선택

2. **SQL Editor 열기**
   - 왼쪽 메뉴에서 "SQL Editor" 클릭
   - "New query" 클릭

3. **스키마 파일 실행**
   - `database/paypal-payment-schema.sql` 파일 내용 복사
   - SQL Editor에 붙여넣기
   - "Run" 버튼 클릭

4. **테스트 데이터 삽입 (선택)**
   - `database/paypal-test-data.sql` 파일 내용 복사
   - SQL Editor에 붙여넣기
   - "Run" 버튼 클릭

### 방법 2: Supabase CLI (마이그레이션)

```bash
# Supabase CLI 설치 (미설치 시)
npm install -g supabase

# Supabase 로그인
supabase login

# 프로젝트 링크
supabase link --project-ref your-project-ref

# 마이그레이션 파일 생성
supabase migration new paypal_payment_schema

# 생성된 마이그레이션 파일에 SQL 복사
# supabase/migrations/YYYYMMDDHHMMSS_paypal_payment_schema.sql

# 마이그레이션 실행
supabase db push
```

---

## 4. 테스트 데이터

### 4.1. 필수 사전 작업

**⚠️ 중요:** 테스트 데이터를 삽입하기 전에:

1. **Supabase Auth에서 테스트 사용자 생성**
   - Dashboard > Authentication > Users
   - "Add user" 클릭
   - Email: `test@amiko.com`
   - Password: 임시 비밀번호 설정

2. **public.users 테이블에 프로필 추가**
   ```sql
   INSERT INTO public.users (id, email, full_name)
   SELECT id, email, '테스트 사용자'
   FROM auth.users
   WHERE email = 'test@amiko.com'
   ON CONFLICT (id) DO NOTHING;
   ```

### 4.2. 테스트 데이터 실행

`database/paypal-test-data.sql` 파일 실행

**생성되는 데이터:**
- ✅ 테스트 상담사 1명
- ✅ 테스트 예약 1건 (order-test-001)
- ✅ 테스트 결제 기록 1건 (PAYPAL-TEST-001)
- ✅ 테스트 구매 기록 1건 (쿠폰 구매)

---

## 5. 마이그레이션 vs 수동 실행

### ✅ **수동 실행 권장** (초기 설정)

**이유:**
1. ✅ **간단함**: Supabase Dashboard에서 바로 실행 가능
2. ✅ **즉시 확인**: 실행 결과를 바로 확인 가능
3. ✅ **디버깅 용이**: 에러 발생 시 바로 수정 가능
4. ✅ **일회성 작업**: 초기 설정이므로 마이그레이션 관리 불필요

**실행 순서:**
```
1. paypal-payment-schema.sql 실행
2. paypal-test-data.sql 실행 (선택)
3. 데이터 확인
```

### ⚠️ **마이그레이션 사용 시** (팀 협업 또는 프로덕션)

**언제 사용:**
- 팀과 스키마 변경을 버전 관리해야 할 때
- 프로덕션 환경에 배포할 때
- 여러 환경(dev, staging, prod)을 관리할 때

**장점:**
- 버전 관리 가능
- 롤백 가능
- 변경 이력 추적

---

## 6. 데이터 관계도

```
users (1) ──< (N) bookings
                │
                │ (1:1 또는 1:0)
                │
                └──> payments
                
users (1) ──< (N) purchases
```

**관계 설명:**
- `bookings.user_id` → `users.id` (CASCADE)
- `payments.user_id` → `users.id` (CASCADE)
- `payments.booking_id` → `bookings.id` (SET NULL)
- `purchases.user_id` → `users.id` (CASCADE)

---

## 7. 코드에서 사용하는 필드 매핑

### 7.1. `/api/paypal/create-order`

**입력:**
- `amount` (센트)
- `orderId` → `purchases.order_id`
- `orderName`
- `customerName`
- `customerEmail`
- `bookingId` → `purchases.product_data.booking_id` (선택)
- `productType` → `purchases.product_type`
- `productData` → `purchases.product_data`

**저장 위치:** `purchases` 테이블 (pending 상태)

### 7.2. `/api/paypal/approve-order`

**입력:**
- `orderId` (PayPal Order ID)

**저장 위치:**
- `payments` 테이블 (completed 상태)
- `bookings` 테이블 업데이트 (payment_status = 'paid')

### 7.3. `/api/paypal/webhook`

**입력:**
- PayPal 웹훅 이벤트

**업데이트:**
- `purchases` 테이블 (status 업데이트)

---

## 8. 확인 쿼리

### 8.1. 테이블 존재 확인

```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('users', 'bookings', 'payments', 'purchases', 'consultants');
```

### 8.2. 인덱스 확인

```sql
SELECT indexname, tablename 
FROM pg_indexes 
WHERE schemaname = 'public' 
AND tablename IN ('bookings', 'payments', 'purchases');
```

### 8.3. RLS 정책 확인

```sql
SELECT tablename, policyname, cmd 
FROM pg_policies 
WHERE schemaname = 'public' 
AND tablename IN ('bookings', 'payments', 'purchases');
```

---

## 9. 문제 해결

### 문제: "relation already exists"
**해결:** `CREATE TABLE IF NOT EXISTS` 사용 (이미 적용됨)

### 문제: "foreign key constraint"
**해결:** 참조하는 테이블(users)이 먼저 생성되어 있어야 함

### 문제: "permission denied"
**해결:** Supabase Dashboard에서 Service Role Key로 실행하거나 RLS 정책 확인

---

## 10. 다음 단계

1. ✅ 스키마 생성 완료
2. ✅ 테스트 데이터 삽입 (선택)
3. 🔄 PayPal 결제 플로우 테스트
4. 🔄 웹훅 엔드포인트 테스트
5. 🔄 프로덕션 배포

---

**생성일:** 2025-12-09  
**버전:** 1.0
