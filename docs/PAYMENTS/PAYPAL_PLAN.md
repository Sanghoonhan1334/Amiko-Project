# PayPal 결제 시스템 구현 계획

## 📋 개요

라틴아메리카 사용자를 위한 PayPal 결제 시스템을 구현합니다. 현재 기본 구조와 타입 정의는 준비되어 있으며, 마리아가 이어서 구현할 예정입니다.

## 🏗️ 현재 상태

### 구현 완료된 부분

1. **API 라우트 구조**
   - `src/app/api/paypal/create-order/route.ts` - 주문 생성 엔드포인트
   - `src/app/api/paypal/approve-order/route.ts` - 주문 승인 엔드포인트
   - `src/app/api/paypal/webhook/route.ts` - 웹훅 처리 엔드포인트

2. **라이브러리 및 타입**
   - `src/lib/paypal.ts` - PayPal 설정 및 유틸리티 함수
   - `src/types/payment.ts` - 결제 관련 타입 정의

3. **컴포넌트**
   - `src/components/payments/PayPalPaymentButton.tsx` - PayPal 결제 버튼 컴포넌트

### 구현 필요 부분

1. **PayPal API 완전 연동**
   - Access Token 획득 로직 검증
   - 주문 생성/승인 플로우 완성
   - 에러 처리 강화

2. **라틴아메리카 결제 플로우**
   - 지역별 통화 지원 (USD, MXN, BRL 등)
   - 지역별 PayPal 계정 처리
   - 환율 변환 로직

3. **KYC (Know Your Customer) 처리**
   - 미성년자 보호 검증
   - 신원 확인 프로세스
   - 라틴아메리카 지역별 KYC 요구사항

4. **자동 영수증 이메일**
   - 결제 완료 시 자동 이메일 발송
   - 영수증 PDF 생성
   - 다국어 이메일 템플릿

5. **웹훅 처리 강화**
   - 결제 상태 동기화
   - 실패 처리
   - 재시도 로직

6. **데이터베이스 연동**
   - 결제 기록 저장
   - 예약 상태 업데이트
   - 통계 수집

## 📁 파일 구조

```
src/app/api/paypal/
├── create-order/
│   └── route.ts          # 주문 생성 (구조 준비 완료)
├── approve-order/
│   └── route.ts          # 주문 승인 (구조 준비 완료)
└── webhook/
    └── route.ts          # 웹훅 처리 (구조 준비 완료)

src/lib/
└── paypal.ts             # PayPal 설정 및 유틸리티

src/components/payments/
└── PayPalPaymentButton.tsx # PayPal 결제 버튼
```

## 🔧 환경 변수

다음 환경 변수가 필요합니다:

```env
# PayPal 클라이언트 ID (공개)
NEXT_PUBLIC_PAYPAL_CLIENT_ID=your_paypal_client_id

# PayPal 클라이언트 시크릿 (서버 전용)
PAYPAL_CLIENT_SECRET=your_paypal_client_secret

# PayPal API Base URL
PAYPAL_API_BASE_URL=https://api-m.sandbox.paypal.com  # 개발
# PAYPAL_API_BASE_URL=https://api-m.paypal.com        # 운영
```

## 📝 구현 체크리스트

### Phase 1: 기본 결제 플로우
- [ ] PayPal Access Token 획득 로직 검증
- [ ] 주문 생성 API 완성
- [ ] 주문 승인 API 완성
- [ ] 기본 에러 처리

### Phase 2: 라틴아메리카 지원
- [ ] 지역별 통화 지원
- [ ] 환율 변환 로직
- [ ] 지역별 PayPal 계정 처리

### Phase 3: KYC 및 보안
- [ ] 미성년자 보호 검증
- [ ] 신원 확인 프로세스
- [ ] 라틴아메리카 지역별 KYC 요구사항

### Phase 4: 자동화
- [ ] 자동 영수증 이메일
- [ ] 영수증 PDF 생성
- [ ] 다국어 이메일 템플릿

### Phase 5: 웹훅 및 모니터링
- [ ] 웹훅 처리 강화
- [ ] 결제 상태 동기화
- [ ] 실패 처리 및 재시도 로직
- [ ] 로깅 및 모니터링

## 🔗 참고 자료

- [PayPal Developer Documentation](https://developer.paypal.com/docs/)
- [PayPal REST API Reference](https://developer.paypal.com/api/rest/)
- [PayPal Webhooks](https://developer.paypal.com/docs/api-basics/notifications/webhooks/)

## 📞 문의

구현 중 문제가 발생하거나 질문이 있으면 이슈를 생성하거나 팀에 문의하세요.
