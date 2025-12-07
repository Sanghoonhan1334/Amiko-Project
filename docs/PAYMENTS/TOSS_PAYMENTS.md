# Toss Payments 결제 시스템

## 📋 개요

한국 사용자를 위한 Toss Payments 결제 시스템입니다.

## 🏗️ 구현 상태

Toss Payments는 프로젝트에 통합되어 있으며, 현재 한국 사용자 대상으로 사용 중입니다.

## 📁 파일 위치

Toss Payments 관련 파일 위치는 코드베이스에서 확인이 필요합니다. 일반적으로 다음 위치에 있을 것으로 예상됩니다:

- API 라우트: `src/app/api/toss/` (예상)
- 결제 컴포넌트: `src/components/payments/` (예상)
- 설정 파일: `src/lib/toss.ts` (예상)

## 🔧 환경 변수

다음 환경 변수가 필요합니다:

```env
# Toss Payments 클라이언트 키 (공개)
NEXT_PUBLIC_TOSS_CLIENT_KEY=your_toss_client_key

# Toss Payments 시크릿 키 (서버 전용)
TOSS_SECRET_KEY=your_toss_secret_key

# Toss Payments 웹훅 시크릿 키
TOSS_WEBHOOK_SECRET_KEY=your_toss_webhook_secret_key
```

## 📝 참고사항

- Toss Payments는 한국 사용자 전용입니다.
- 라틴아메리카 사용자는 PayPal을 사용합니다.
- 자세한 구현 내용은 코드베이스를 참고하세요.
