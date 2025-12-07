# WhatsApp 템플릿 SID 확인 및 테스트 가이드

## 1. Twilio 콘솔에서 템플릿 SID 확인

1. [Twilio 콘솔](https://console.twilio.com/)에 로그인
2. 왼쪽 메뉴에서 **Messaging** → **Content Templates** 클릭
3. `amiko_verification` 템플릿 찾기
4. 템플릿을 클릭하면 **Content SID** 확인 가능
   - 형식: `HX...` (예: `HX1234567890abcdef1234567890abcdef`)
5. **Status**가 **Approved**인지 확인

## 2. 환경 변수에 템플릿 SID 추가

`.env.local` 파일에 다음 줄 추가:

```env
TWILIO_WHATSAPP_TEMPLATE_SID=HX...  # 실제 SID로 교체
```

## 3. 개발 서버 재시작

```bash
# 개발 서버 중지 (Ctrl+C) 후
npm run dev
```

## 4. 테스트 방법

### 방법 1: curl 명령어로 테스트

```bash
curl -X POST http://localhost:3000/api/whatsapp/send-otp \
  -H "Content-Type: application/json" \
  -d '{"phoneNumber":"+821056892434","otp":"123456"}'
```

### 방법 2: 실제 전화번호로 테스트

```bash
# 본인의 WhatsApp 전화번호로 테스트
curl -X POST http://localhost:3000/api/whatsapp/send-otp \
  -H "Content-Type: application/json" \
  -d '{"phoneNumber":"+82본인전화번호","otp":"123456"}'
```

## 5. 성공 응답 예시

```json
{
  "success": true,
  "messageSid": "SM...",
  "status": "queued"
}
```

## 6. 에러 처리

### 템플릿 SID 오류
- 에러 코드: `63007`
- 의미: 템플릿이 승인되지 않았거나 SID가 잘못됨
- 해결: Twilio 콘솔에서 템플릿 상태 확인

### 전화번호 오류
- 에러 코드: `21211`
- 의미: 잘못된 전화번호 형식
- 해결: E.164 형식 확인 (예: +821012345678)

### 발신 번호 오류
- 에러 코드: `21608`
- 의미: WhatsApp 발신 번호가 등록되지 않음
- 해결: Twilio 콘솔에서 WhatsApp Business 번호 확인

## 7. 로그 확인

서버 콘솔에서 다음 로그 확인:

```
[WHATSAPP_OTP] ========================================
[WHATSAPP_OTP] OTP 전송 시작
[WHATSAPP_OTP] 받는 번호: whatsapp:+821056892434
[WHATSAPP_OTP] OTP 코드: 123456
[WHATSAPP_OTP] 발신 번호: whatsapp:+14155238886
[WHATSAPP_OTP] 템플릿 SID: HX...
[WHATSAPP_OTP] 템플릿 모드 사용
[WHATSAPP_OTP] 전송 성공
[WHATSAPP_OTP] 메시지 SID: SM...
[WHATSAPP_OTP] 상태: queued
```

