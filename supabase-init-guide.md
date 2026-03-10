# AMIKO 프로젝트 Supabase 초기화 가이드

## 📋 개요

이 가이드는 AMIKO 프로젝트의 Supabase 데이터베이스를 초기화하는 방법을 안내합니다.

`supabase-init.sql` 스크립트를 실행하면 다음 테이블들이 생성됩니다:

1. **users** - 사용자 프로필 (auth.users 확장)
2. **consultants** - 상담사 정보
3. **bookings** - 예약 정보
4. **payments** - PayPal 결제 기록
5. **purchases** - 구매 기록 (쿠폰, VIP 구독 등)
6. **coupons** - 쿠폰
7. **coupon_usage** - 쿠폰 사용 기록
8. **vip_subscriptions** - VIP 구독
9. **vip_features** - VIP 기능 목록

## 🚀 실행 방법 (3단계)

### 1단계: Supabase 콘솔 접속
1. https://app.supabase.com 접속
2. 프로젝트 선택
3. 왼쪽 메뉴에서 **"SQL Editor"** 클릭

### 2단계: 스크립트 실행
1. **"New query"** 버튼 클릭
2. `supabase-init.sql` 파일 내용 전체를 복사하여 붙여넣기
3. **"Run"** 버튼 클릭 (또는 Ctrl+Enter / Cmd+Enter)
4. 실행 완료 메시지 확인

### 3단계: 테스트 사용자 생성 및 데이터 확인
1. 왼쪽 메뉴에서 **"Authentication" > "Users"** 이동
2. **"Add user"** 버튼 클릭
3. 다음 정보 입력:
   - **Email**: `test@amiko.com`
   - **Password**: `test123456` (또는 원하는 비밀번호)
   - **Auto Confirm User**: 체크
4. **"Create user"** 클릭
5. `supabase-init.sql` 스크립트를 다시 실행하여 테스트 데이터 생성

## 📁 파일 위치

```
AMIKO-Project-main/
├── supabase-init.sql          # 메인 초기화 스크립트 (이 파일을 사용)
└── supabase-init-guide.md     # 이 가이드 문서
```

## ✅ 실행 후 확인 사항

### 테이블 생성 확인
SQL Editor에서 다음 쿼리를 실행하여 테이블이 생성되었는지 확인:

```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN (
    'users', 
    'consultants', 
    'bookings', 
    'payments', 
    'purchases', 
    'coupons', 
    'coupon_usage', 
    'vip_subscriptions', 
    'vip_features'
)
ORDER BY table_name;
```

### 테스트 사용자 확인
```sql
SELECT id, email, full_name, is_admin 
FROM public.users 
WHERE email = 'test@amiko.com';
```

### 테스트 결제 기록 확인
```sql
SELECT id, payment_id, order_id, amount, status, product_type
FROM public.purchases
WHERE payment_id LIKE 'PAYPAL-TEST-%';
```

## 🔗 테이블 관계도

```
auth.users (1) ──< (1) public.users
                        │
                        ├──< (N) consultants
                        │
                        ├──< (N) bookings ──> (N) consultants
                        │        │
                        │        └──> (0..1) payments
                        │
                        ├──< (N) payments
                        │
                        ├──< (N) purchases
                        │
                        ├──< (N) coupons
                        │        │
                        │        └──< (N) coupon_usage ──> bookings
                        │
                        └──< (N) vip_subscriptions
```

## 📊 주요 필드 설명

### users 테이블
- `id`: auth.users(id)와 1:1 관계
- `email`: 이메일 주소 (UNIQUE)
- `full_name`, `name`: 사용자 이름
- `is_admin`: 관리자 여부
- `is_korean`: 한국인 여부

### bookings 테이블
- `user_id`: 예약한 사용자
- `consultant_id`: 상담사
- `order_id`: 내부 주문 번호 (UNIQUE)
- `status`: 예약 상태 (pending, confirmed, cancelled, completed, no_show)
- `payment_status`: 결제 상태 (pending, paid, failed, refunded)
- `payment_id`: PayPal Order ID

### payments 테이블
- `amount`: INTEGER (센트 단위, 예: $1.99 = 199)
- `payment_id`: PayPal Order ID (UNIQUE)
- `booking_id`: 관련 예약 (NULL 가능)

### purchases 테이블
- `amount`: DECIMAL(10,2) (USD 단위, 예: 1.99)
- `product_type`: 상품 타입 (coupon, vip_subscription, booking)
- `product_data`: JSONB (상품 상세 정보)
- `status`: 구매 상태 (pending, paid, failed, canceled, refunded)

### coupons 테이블
- `amount`: 쿠폰 개수 (AKO 단위)
- `used_amount`: 사용된 쿠폰 개수
- `type`: 쿠폰 타입 (video_call, consultation, ako)

## 🔒 RLS (Row Level Security) 정책

모든 테이블에 RLS가 활성화되어 있으며, 다음 정책이 적용됩니다:

- **사용자 정책**: 사용자는 자신의 데이터만 조회/수정 가능
- **시스템 정책**: 서버 사이드에서 데이터 생성/수정 가능 (payments, purchases 등)
- **관리자 정책**: 관리자는 모든 데이터 관리 가능

## 🧪 테스트하기

### 1. 로그인 테스트
- Email: `test@amiko.com`
- Password: 생성 시 설정한 비밀번호

### 2. 결제 플로우 테스트
- PayPal Sandbox 환경에서 테스트 결제 진행
- `purchases` 테이블에 기록이 생성되는지 확인

### 3. 예약 플로우 테스트
- 상담사 프로필 생성 → 예약 생성 → 결제 진행
- `bookings`와 `payments` 테이블 연동 확인

## ⚠️ 주의사항

1. **중복 실행**: 스크립트는 `IF NOT EXISTS`를 사용하므로 여러 번 실행해도 안전합니다.
2. **테스트 사용자**: 테스트 사용자는 Supabase Auth에서 먼저 생성해야 합니다.
3. **RLS 정책**: 프로덕션 환경에서는 필요에 따라 RLS 정책을 수정하세요.
4. **데이터 삭제**: 기존 데이터가 있는 경우 외래 키 제약 조건으로 인해 삭제 순서를 주의하세요.

## 🔧 문제 해결

### "relation already exists" 에러
- 정상입니다. 테이블이 이미 존재한다는 의미입니다.
- `IF NOT EXISTS`가 있어 안전하게 넘어갑니다.

### "foreign key constraint" 에러
- 참조하는 테이블이 먼저 생성되어야 합니다.
- 스크립트는 올바른 순서로 생성되므로 처음부터 다시 실행하세요.

### "permission denied" 에러
- Service Role Key를 사용하거나 RLS 정책을 확인하세요.
- Supabase Dashboard에서 실행하면 자동으로 Service Role 권한이 적용됩니다.

## 📞 지원

문제가 발생하면 다음을 확인하세요:
1. Supabase 프로젝트 설정 확인
2. SQL Editor에서 에러 메시지 확인
3. 테이블 생성 상태 확인 (위의 확인 쿼리 사용)

---

**생성일**: 2024-12-19  
**버전**: 1.0.0
