# 마리아 작업 요청 분석 및 답변

## 📋 요청 사항

1. **정책 + 동의합니다 UI
2. **결제시스템 + 커뮤니티에 강의 탭 만들기

---

## ❓ 질문 1: 영상통화 1:1 상담 결제 시스템

### ⚠️ **중요: 현재 상황

**1:1 영상통화 기능은 현재 개발 중이며 아직 완성되지 않았습니다.
- 개발 담당: 사용자 (본인)
- 구현 방식: **Agora**로 직접 구현
- 상태: **구현 중** (미완성)
- 예상 완료 시기: **2025년 1월말까지**

**따라서:
- 영상통화 UI/기능이 완성되기 전에는 결제 연결이 어려울 수 있음
- 하지만 결제 시스템 자체는 미리 준비 가능
- UI가 완성되면 (1월말 이후) 결제만 연결하면 됨

---

### 현재 상황 분석

✅ **이미 구현된 부분:
- `/api/video-call/start` - 영상통화 시작 API (기본 구조만 있음)
- `/payments/checkout` - 결제 페이지 UI ✅
- `PayPalPaymentButton` - PayPal 결제 버튼 컴포넌트 ✅
- `bookings` 테이블 - 예약 정보 저장 ✅
- PayPal 결제 API (`/api/paypal/create-order`, `/api/paypal/approve-order`) ✅

⚠️ **현재 작동 방식:
- ****쿠폰 기반 결제** (20분 = 1.99달러)
- 쿠폰을 먼저 구매 → 쿠폰으로 상담 예약
- 직접 PayPal 결제로 상담 예약하는 플로우는 **아직 없음**

❌ **아직 없는 부분:
- 완성된 영상통화 UI (현재 Agora로 개발 중, 1월말 완료 예정)
- PayPal 직접 결제 → 상담 예약 플로우

### 답변: **가능합니다! 미리 준비 가능**

**이유:
1. ✅ ****결제 UI는 이미 존재** (`/payments/checkout`)
2. ✅ ****PayPal 결제 시스템은 이미 구현됨**
3. ✅ ****데이터베이스 스키마도 준비됨** (방금 생성한 `paypal-payment-schema.sql`)
4. ⚠️ ****영상통화 UI는 Agora로 개발 중** (1월말 완료 예정)

**마리아에게 요청 가능한 작업:

```
"영상통화 1:1 상담을 PayPal로 직접 결제할 수 있도록 연결해줘"

현재:
- 쿠폰 구매 → 쿠폰으로 상담 예약

요청:
- PayPal 직접 결제 → 상담 예약 (쿠폰 없이)
```

**구현 방법:
1. `VideoCallStarter` 컴포넌트에 "PayPal로 결제하기" 버튼 추가
2. 결제 완료 후 → `bookings` 테이블에 예약 생성
3. 예약 생성 시 → `payments` 테이블에 결제 기록 저장
4. 이미 있는 `/payments/checkout` 페이지 활용

**추가 작업 필요:
- `VideoCallStarter`에서 결제 플로우 연결
- 결제 완료 후 자동으로 상담 시작 또는 예약 확정

****결론:** ✅ **UI가 없어도 결제 시스템은 미리 준비 가능합니다!**

---

## ❓ 질문 2: 커뮤니티 강의실 결제 시스템

### 현재 상황 분석

✅ **이미 구현된 부분:
- `CommunityTab` - 커뮤니티 메인 탭
- 여러 카테고리 (공지사항, 자유게시판, K-POP, K-Drama, 팬아트, 아이돌짤, 뷰티, 한국어공부, 스페인어공부, 투표게시판)
- PayPal 결제 시스템 (재사용 가능)

❌ **없는 부분:
- "강의실" 또는 "Class" 카테고리
- 강의 결제 플로우

### 답변: **충분히 가능합니다! 오래 걸리지 않을 것 같습니다**

**이유:
1. ✅ ****커뮤니티 탭 구조가 이미 잘 되어 있음**
   - 카테고리 추가만 하면 됨
   - 기존 카테고리 구조를 참고하면 쉬움

2. ✅ ****결제 시스템은 재사용 가능**
   - 이미 만든 PayPal 결제 시스템 활용
   - `purchases` 테이블에 `product_type: 'lecture'` 또는 `'class'` 추가

3. ✅ ****구조가 단순함**
   - 강의 목록 보기
   - 강의 상세 보기
   - "결제하기" 버튼
   - 결제 완료 후 강의 접근 권한 부여

**마리아에게 요청 가능한 작업:

```
"커뮤니티 탭에 '강의실' 카테고리를 추가하고, 
강의를 PayPal로 결제할 수 있게 해줘"

구현 내용:
1. CommunityTab에 '강의실' 카테고리 추가
2. 강의 목록/상세 페이지
3. PayPal 결제 버튼
4. 결제 완료 후 강의 접근 권한 부여
```

**예상 작업 시간:
- 카테고리 추가: 1-2시간
- 강의 목록/상세 UI: 2-3시간
- 결제 연결: 2-3시간 (기존 PayPal 시스템 재사용)
- ****총 예상: 5-8시간** (1일 이내 가능)

**데이터베이스:
- 강의 정보 저장 테이블 필요 (예: `lectures` 또는 `classes`)
- 결제는 기존 `purchases` 테이블 활용 (`product_type: 'lecture'`)

****결론:** ✅ **충분히 마리아가 할 수 있고, 오래 걸리지 않을 것 같습니다!**

---

## 📝 마리아에게 전달할 요청사항 정리

### 1. 영상통화 1:1 상담 PayPal 결제 연결

**⚠️ 중요: 현재 상황
- 1:1 영상통화 기능은 **사용자가 Agora로 직접 개발 중**이며 아직 완성되지 않았습니다.
- 예상 완료 시기: **2025년 1월말까지**
- 영상통화 UI가 완성되면 (1월말 이후), 그때 결제 시스템을 연결해주시면 됩니다.
- 당장 급하지 않으므로, **Phase 2 작업**으로 진행하면 됩니다.

**요청 (영상통화 UI 완성 후):
```
영상통화 1:1 상담을 PayPal로 직접 결제할 수 있도록 연결해줘.

현재는 쿠폰을 먼저 구매해야 하는데,
PayPal로 직접 결제 → 바로 상담 예약이 가능하도록 해주세요.

이미 있는 것:
- /payments/checkout 페이지 ✅
- PayPalPaymentButton 컴포넌트 ✅
- PayPal API (create-order, approve-order) ✅
- 데이터베이스 스키마 (paypal-payment-schema.sql) ✅

필요한 작업 (영상통화 UI 완성 후):
1. VideoCallStarter에 "PayPal로 결제하기" 버튼 추가
2. 결제 완료 후 bookings 테이블에 예약 생성
3. payments 테이블에 결제 기록 저장
4. 결제 완료 후 자동으로 상담 시작 또는 예약 확정
```

**참고 파일:**
- `src/components/video/VideoCallStarter.tsx`
- `src/app/payments/checkout/page.tsx`
- `src/components/payments/PayPalPaymentButton.tsx`
- `database/paypal-payment-schema.sql` (스키마 참고)

---

### 2. 커뮤니티 강의실 + 결제 시스템

**요청:
```
커뮤니티 탭에 '강의실' 카테고리를 추가하고, 
강의를 PayPal로 결제할 수 있게 해주세요.

구현 내용:
1. CommunityTab에 '강의실' 카테고리 추가
   - 기존 카테고리 구조 참고 (announcement, free, kpop 등)
   
2. 강의 목록/상세 페이지
   - 강의 제목, 설명, 가격, 강사 정보
   - "결제하기" 버튼
   
3. PayPal 결제 연결
   - 기존 PayPalPaymentButton 재사용
   - purchases 테이블에 product_type: 'lecture'로 저장
   
4. 결제 완료 후 강의 접근 권한 부여
   - 사용자가 구매한 강의 목록 표시
   - 강의 콘텐츠 접근 가능하도록
```

**참고 파일:**
- `src/components/main/app/community/CommunityTab.tsx`
- `src/components/payments/PayPalPaymentButton.tsx`
- `database/paypal-payment-schema.sql`

**추가 필요:**
- 강의 정보 저장 테이블 (예: `lectures` 테이블)
- 강의-사용자 매핑 테이블 (예: `user_lectures` 또는 `purchases` 활용)

---

## 🎯 우선순위 추천

### Phase 1 (12월까지 - 급함)
1. ✅ **정책 + 동의합니다 UI** (마리아 작업)
2. ✅ **커뮤니티 강의실 + 결제** (마리아 작업, 빠르게 가능)

### Phase 2 (영상통화 UI 완성 후 - 사용자가 먼저 완성)
3. **영상통화 1:1 상담 PayPal 결제 연결** (마리아 작업)

**작업 순서:
1. ****사용자**: 1:1 영상통화 UI/기능 완성 (Agora로 구현, **1월말까지 예정**)
2. ****마리아**: 영상통화 완성 후 (1월말 이후) → PayPal 결제 연결

**이유:
- 강의실은 독립적인 기능이라 빠르게 구현 가능
- ****영상통화는 사용자가 Agora로 직접 개발 중이며, 1월말까지 완료 예정**
- ****완성되면 마리아가 결제만 연결하면 됨**
- 결제 시스템은 이미 준비되어 있으므로 연결 작업만 필요
- 당장 급하지 않으므로 Phase 2로 진행

---

## 💡 추가 제안

### 강의실 데이터베이스 스키마 (마리아에게 제공 가능)

```sql
-- 강의 테이블

CREATE TABLE IF NOT EXISTS public.lectures (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    instructor_id UUID REFERENCES public.users(id),
    price DECIMAL(10, 2) NOT NULL,
    currency TEXT DEFAULT 'USD',
    duration_minutes INTEGER,
    category TEXT, -- 'korean', 'spanish', 'culture', etc.
    thumbnail_url TEXT,
    content_url TEXT, -- 강의 콘텐츠 URL 또는 JSONB
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 결제는 기존 purchases 테이블 활용

-- product_type: 'lecture'

-- product_data: { lecture_id: '...' }

```

이 스키마도 마리아에게 제공하면 더 빠르게 작업할 수 있습니다!

---

****작성일:** 2025-12-09
