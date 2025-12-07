# 📱 Twilio SMS/WhatsApp 설정 가이드

실제 SMS/WhatsApp 발송을 위한 Twilio 설정 방법입니다.

## 💰 비용
- **SMS**: $0.0075/건 (약 10원)
- **WhatsApp**: $0.005/건 (약 7원)
- **계정 생성**: 무료 크레딧 $15 제공

## 🚀 1단계: Twilio 계정 생성

1. [Twilio Console](https://console.twilio.com/) 방문
2. "Sign up for free" 클릭
3. 이메일, 비밀번호, 전화번호 입력
4. 이메일 인증 및 전화번호 인증 완료
5. 무료 크레딧 $15 받기

## 🔧 2단계: 계정 정보 확인

1. Twilio Console 로그인
2. 대시보드에서 다음 정보 확인:
   - **Account SID**: `ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`
   - **Auth Token**: `your_auth_token_here`

## 📞 3단계: 발신번호 구매

### SMS용 전화번호:
1. Console → Phone Numbers → Manage → Buy a number
2. 국가 선택 (한국: South Korea)
3. 번호 선택 및 구매 ($1/월)

### WhatsApp용 (선택사항):
1. Console → Messaging → Senders → WhatsApp
2. WhatsApp Business API 신청
3. 승인 후 사용 가능

## ⚙️ 4단계: 환경변수 설정

`.env.local` 파일에 다음 정보 추가:

```bash
# Twilio SMS/WhatsApp 설정
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=your_auth_token_here
TWILIO_PHONE_NUMBER=+821012345678
TWILIO_WHATSAPP_FROM=whatsapp:+14155238886
```

## 🧪 5단계: 테스트

### 계정 설정 확인:
```bash
curl http://localhost:3000/api/test-twilio
```

### 실제 SMS 발송 테스트:
```bash
curl -X POST http://localhost:3000/api/test-twilio \
  -H "Content-Type: application/json" \
  -d '{"phoneNumber": "+82 10-1234-5678", "method": "sms"}'
```

### 실제 WhatsApp 발송 테스트:
```bash
curl -X POST http://localhost:3000/api/test-twilio \
  -H "Content-Type: application/json" \
  -d '{"phoneNumber": "+82 10-1234-5678", "method": "whatsapp"}'
```

## 📋 사용법

설정 완료 후 `/verification-simple` 페이지에서:
1. WhatsApp 또는 SMS 버튼 클릭
2. 전화번호 입력
3. "인증코드 발송" 클릭
4. **실제로 SMS/WhatsApp 메시지 수신** ✅

## 🔍 문제 해결

### 계정 정보 오류:
- Account SID와 Auth Token이 정확한지 확인
- 계정이 활성화되어 있는지 확인

### 발신번호 오류:
- 구매한 번호가 올바른지 확인
- 번호 형식: `+821012345678` (국가코드 포함)

### 발송 실패:
- 계정 잔액 확인
- 발신번호 권한 확인
- 수신번호 형식 확인

## 💡 팁

1. **개발 환경**: 무료 크레딧으로 충분히 테스트 가능
2. **프로덕션**: 월 사용량에 따라 요금제 선택
3. **국가별 최적화**: 각 국가별로 다른 SMS 서비스 사용 가능
4. **발송 제한**: 시간당 발송량 제한 있음

## 🌍 다른 SMS 서비스 옵션

### 한국 전용:
- **NCP SMS** (네이버 클라우드)
- **Kakao Alimtalk**

### 글로벌:
- **AWS SNS**
- **Google Cloud Messaging**
- **Firebase Cloud Messaging**

---

**설정 완료 후 실제 SMS/WhatsApp 발송이 가능합니다!** 🎉
