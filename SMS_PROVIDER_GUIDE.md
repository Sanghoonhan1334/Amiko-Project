# SMS 프로바이더 국가별 선택 가이드

## 📋 개요

Amiko 프로젝트의 SMS 인증 로직이 국가별로 다른 프로바이더를 사용하도록 개선되었습니다.

- **기본**: Twilio 사용
- **Chile (CL)**: Bird (MessageBird) 사용
- **향후 확장 가능**: 다른 국가도 쉽게 추가 가능

## 🔧 환경변수 설정

### Twilio (기본 프로바이더)
```env
TWILIO_ACCOUNT_SID=your_account_sid
TWILIO_AUTH_TOKEN=your_auth_token
TWILIO_PHONE_NUMBER=+1234567890
```

### Bird (Chile 등 특정 국가)
```env
BIRD_API_KEY=your_bird_api_key
BIRD_SENDER_ID=AMIKO
```

## 📝 코드 사용 예제

### 1. 기본 사용 (기존 코드와 동일)

```typescript
import { sendVerificationSMS } from '@/lib/smsService'

// 국가 코드를 전달하면 자동으로 적절한 프로바이더 선택
const result = await sendVerificationSMS(
  '+56912345678',  // 전화번호 (E.164 형식)
  '123456',        // 인증 코드
  'es',            // 언어 ('ko' | 'es')
  'CL'             // 국가 코드 → Bird 사용
)

// 다른 국가는 자동으로 Twilio 사용
const result2 = await sendVerificationSMS(
  '+821012345678', // 한국 번호
  '123456',
  'ko',
  'KR'             // 국가 코드 → Twilio 사용
)
```

### 2. 직접 SMS 발송

```typescript
import { sendSMS, createSMSTemplate } from '@/lib/smsService'

const template = createSMSTemplate('verification', { code: '123456' }, 'es')

const result = await sendSMS({
  to: '+56912345678',
  template,
  data: { code: '123456' },
  countryCode: 'CL'  // 국가 코드에 따라 프로바이더 자동 선택
})
```

### 3. 프로바이더 상태 확인

```typescript
import { getSMSServiceStatus } from '@/lib/smsService'

const status = getSMSServiceStatus()
console.log(status)
// {
//   isAvailable: true,
//   service: 'Twilio + Bird (국가별 자동 선택)',
//   environment: 'production',
//   supportedProviders: [...],
//   countryProviderMap: { 'CL': 'bird' }
// }
```

## 🌍 국가별 프로바이더 매핑

현재 설정:
- **CL (Chile)**: Bird
- **기타 모든 국가**: Twilio

### 새로운 국가 추가 방법

`src/lib/smsService.ts` 파일의 `COUNTRY_PROVIDER_MAP` 객체에 추가:

```typescript
const COUNTRY_PROVIDER_MAP: Record<string, SMSProvider> = {
  'CL': 'bird',      // Chile
  'SA': 'bird',      // 사우디아라비아 (예시)
  'AE': 'bird',      // UAE (예시)
}
```

## 🔄 동작 흐름

1. `sendVerificationSMS()` 또는 `sendSMS()` 호출
2. `selectSMSProvider(countryCode)` 함수가 국가 코드 확인
3. 매핑 테이블에서 프로바이더 선택
   - 매핑에 있으면: 해당 프로바이더 사용
   - 매핑에 없으면: 기본값 (Twilio) 사용
4. 선택된 프로바이더로 SMS 발송
5. 실패 시 자동으로 Twilio로 fallback

## 🛠️ API 엔드포인트

### 인증 코드 발송
```
POST /api/auth/verification
{
  "phoneNumber": "+56912345678",
  "type": "sms",
  "nationality": "CL"  // 국가 코드
}
```

### SMS 테스트
```
POST /api/test-sms
{
  "phoneNumber": "+56912345678",
  "countryCode": "CL"
}
```

## 📊 로깅

각 프로바이더별로 상세한 로그가 출력됩니다:

- `[SMS_PROVIDER]`: 프로바이더 선택 로그
- `[BIRD_SMS]`: Bird API 발송 로그
- `[TWILIO_SMS]`: Twilio 발송 로그
- `[SMS_SEND]`: 전체 SMS 발송 로그

## ⚠️ 주의사항

1. **환경변수 필수**: 각 프로바이더의 환경변수가 설정되어 있어야 합니다
2. **Fallback**: Bird 실패 시 자동으로 Twilio로 재시도합니다
3. **전화번호 형식**: E.164 형식 (`+국가코드번호`)을 사용해야 합니다
4. **국가 코드**: ISO 3166-1 alpha-2 형식 (예: 'CL', 'KR', 'MX')

## 🧪 테스트

### 개발 환경
- 환경변수가 없으면 콘솔에만 출력됩니다
- 실제 발송 없이 로직만 테스트 가능

### 프로덕션 환경
- 환경변수가 설정되어 있어야 실제 발송됩니다
- Bird와 Twilio 모두 설정 권장 (fallback을 위해)

## 📚 관련 파일

- `src/lib/smsService.ts`: SMS 발송 서비스 (프로바이더 선택 로직)
- `src/lib/birdService.ts`: Bird API 연동
- `src/lib/twilioService.ts`: Twilio API 연동 (기존)
- `src/app/api/auth/verification/route.ts`: 인증 API 엔드포인트

