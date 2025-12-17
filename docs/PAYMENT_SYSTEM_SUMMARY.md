# 결제 시스템 요약

## 현재 결제 가능한 항목

### 1. VIP 구독 (VIP Subscription)
- **상품 타입**: `vip_subscription`
- **플랜 타입**:
  - `monthly` - 월간 구독
  - `yearly` - 연간 구독  
  - `lifetime` - 평생 구독
- **결제 방법**: `paypal`, `stripe`, `coupon`, `admin`
- **테이블**: `vip_subscriptions`
- **상태**: `active`, `cancelled`, `expired`, `suspended`

### 2. 쿠폰 (AKO) - 화상통화/상담용
- **상품 타입**: `coupon`
- **쿠폰 타입**: 
  - `ako` - AKO 쿠폰 (화상통화/상담에 사용)
  - `video_call` - 화상통화 쿠폰
  - `consultation` - 상담 쿠폰
- **가격 정책**: 
  - **1 AKO = $1.99 = 20분**
  - 패키지별 할인 적용
- **패키지 옵션**:
  - 1개: $1.99 (20분)
  - 5개: $9.45 (100분) - 5% 할인
  - 10개: $17.90 (200분) - 10% 할인
  - 20개: $33.80 (400분) - 15% 할인
- **테이블**: `coupons`, `purchases`
- **만료 기간**: 구매 후 1년

## 데이터베이스 스키마

### purchases 테이블
```sql
product_type CHECK (product_type IN ('coupon', 'vip_subscription'))
```

### vip_subscriptions 테이블
- `plan_type`: 'monthly', 'yearly', 'lifetime'
- `status`: 'active', 'cancelled', 'expired', 'suspended'
- `payment_method`: 'paypal', 'stripe', 'coupon', 'admin'

### coupons 테이블
- `type`: 'ako', 'video_call', 'consultation'
- `amount`: 쿠폰 개수
- `minutes_remaining`: 남은 분수 (AKO의 경우)

## 결제 플로우

1. **쿠폰 구매**:
   - PayPal 결제 → `purchases` 테이블에 기록
   - 결제 완료 시 → `coupons` 테이블에 쿠폰 적립
   - 20분 = 1.99달러 비율로 계산

2. **VIP 구독**:
   - PayPal/Stripe 결제 → `purchases` 테이블에 기록
   - 결제 완료 시 → `vip_subscriptions` 테이블에 구독 생성
   - 구독 기간에 따라 `end_date` 설정

## 결제 제공업체
- `paypal` - PayPal 결제
- `toss` - 토스페이먼츠 (예정)
- `stripe` - Stripe 결제

## 참고 파일
- `database/purchases-table.sql` - 구매 기록 테이블
- `database/vip-subscriptions-table.sql` - VIP 구독 테이블
- `database/coupons-table.sql` - 쿠폰 테이블
- `src/app/api/paypal/create-order/route.ts` - PayPal 주문 생성
- `src/app/api/paypal/webhook/route.ts` - PayPal 웹훅 처리
- `src/components/main/app/charging/ChargingTab.tsx` - 결제 UI

