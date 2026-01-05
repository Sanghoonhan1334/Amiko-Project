# FCM HTTP v1 API 사용 예제
# FCM HTTP v1 API Usage Examples

## 환경 변수 설정 예제

### 방법 1: 개별 환경변수 (권장)

`.env.local` 파일:

```env
# Firebase 프로젝트 ID
FCM_PROJECT_ID=amiko-7a30c

# 서비스 계정 이메일
FCM_CLIENT_EMAIL=firebase-adminsdk-xxxxx@amiko-7a30c.iam.gserviceaccount.com

# 서비스 계정 Private Key (개행 문자 포함)
FCM_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQC...\n-----END PRIVATE KEY-----\n"
```

### 방법 2: JSON 파일 경로

```env
FCM_SERVICE_ACCOUNT_JSON_PATH=./config/firebase-service-account.json
```

### 방법 3: JSON 문자열

```env
FCM_SERVICE_ACCOUNT_JSON={"type":"service_account","project_id":"amiko-7a30c","private_key_id":"...","private_key":"-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n","client_email":"...","client_id":"...","auth_uri":"https://accounts.google.com/o/oauth2/auth","token_uri":"https://oauth2.googleapis.com/token","auth_provider_x509_cert_url":"https://www.googleapis.com/oauth2/v1/certs","client_x509_cert_url":"..."}
```

---

## Node.js에서 직접 사용 예제

```typescript
// example-send-push.ts
import { sendFCMv1Notification } from './src/lib/fcm-v1'

async function testPush() {
  // 디바이스 토큰 (앱에서 받은 FCM 토큰)
  const deviceToken = 'fcm_device_token_from_app'
  
  // 푸시 알림 발송
  const result = await sendFCMv1Notification(
    deviceToken,
    '테스트 알림',
    '이것은 FCM v1 API 테스트입니다.',
    {
      url: '/notifications',
      notificationId: '123',
      customData: 'test'
    }
  )
  
  if (result.success) {
    console.log('✅ 푸시 알림 발송 성공!')
    console.log('Message ID:', result.messageId)
  } else {
    console.error('❌ 푸시 알림 발송 실패:', result.error)
  }
}

testPush().catch(console.error)
```

---

## API 엔드포인트 사용 예제

### cURL

```bash
curl -X POST http://localhost:3000/api/notifications/send-push \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "user-uuid-here",
    "title": "테스트 알림",
    "body": "이것은 테스트 메시지입니다.",
    "data": {
      "url": "/notifications",
      "notificationId": "123"
    }
  }'
```

### JavaScript/TypeScript

```typescript
const response = await fetch('/api/notifications/send-push', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    userId: 'user-uuid-here',
    title: '테스트 알림',
    body: '이것은 테스트 메시지입니다.',
    data: {
      url: '/notifications',
      notificationId: '123'
    }
  })
})

const result = await response.json()
console.log(result)
```

### Python

```python
import requests

response = requests.post(
    'http://localhost:3000/api/notifications/send-push',
    json={
        'userId': 'user-uuid-here',
        'title': '테스트 알림',
        'body': '이것은 테스트 메시지입니다.',
        'data': {
            'url': '/notifications',
            'notificationId': '123'
        }
    }
)

print(response.json())
```

---

## 배치 발송 예제

```typescript
import { sendFCMv1BatchNotifications } from './src/lib/fcm-v1'

async function sendBatchPush() {
  const deviceTokens = [
    'token1',
    'token2',
    'token3'
  ]
  
  const results = await sendFCMv1BatchNotifications(
    deviceTokens,
    '배치 알림',
    '여러 디바이스에 동시 발송합니다.',
    { url: '/notifications' }
  )
  
  results.forEach((result, index) => {
    if (result.success) {
      console.log(`✅ 디바이스 ${index + 1} 발송 성공:`, result.messageId)
    } else {
      console.error(`❌ 디바이스 ${index + 1} 발송 실패:`, result.error)
    }
  })
}

sendBatchPush().catch(console.error)
```

---

## 서비스 계정 JSON 파일 구조

Firebase Console에서 다운로드한 서비스 계정 JSON 파일:

```json
{
  "type": "service_account",
  "project_id": "amiko-7a30c",
  "private_key_id": "xxxxx",
  "private_key": "-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n",
  "client_email": "firebase-adminsdk-xxxxx@amiko-7a30c.iam.gserviceaccount.com",
  "client_id": "xxxxx",
  "auth_uri": "https://accounts.google.com/o/oauth2/auth",
  "token_uri": "https://oauth2.googleapis.com/token",
  "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
  "client_x509_cert_url": "https://www.googleapis.com/robot/v1/metadata/x509/firebase-adminsdk-xxxxx%40amiko-7a30c.iam.gserviceaccount.com"
}
```

필요한 필드:
- `project_id`
- `private_key`
- `client_email`

---

## 디버깅 팁

### 1. 환경 변수 확인

```typescript
console.log('FCM_PROJECT_ID:', process.env.FCM_PROJECT_ID ? '설정됨' : '설정 안 됨')
console.log('FCM_CLIENT_EMAIL:', process.env.FCM_CLIENT_EMAIL ? '설정됨' : '설정 안 됨')
console.log('FCM_PRIVATE_KEY:', process.env.FCM_PRIVATE_KEY ? '설정됨' : '설정 안 됨')
```

### 2. OAuth 토큰 생성 테스트

```typescript
import { sendFCMv1Notification } from './src/lib/fcm-v1'

// 더미 토큰으로 테스트 (실제 발송은 안 됨)
try {
  await sendFCMv1Notification('dummy-token', 'Test', 'Test')
} catch (error) {
  // OAuth 토큰 생성은 성공했지만, 디바이스 토큰이 유효하지 않아 실패
  console.log('OAuth 토큰 생성 성공, 디바이스 토큰 오류:', error.message)
}
```

### 3. 로그 확인

코드는 자동으로 다음 로그를 출력합니다:
- `[PUSH] 네이티브 앱 푸시 발송 시도: ...`
- `✅ FCM v1 푸시 알림 발송 성공: ...`
- `❌ FCM v1 푸시 알림 발송 실패: ...`

---

## 주의사항

1. **Private Key 형식**: `FCM_PRIVATE_KEY`는 반드시 개행 문자(`\n`)를 포함해야 합니다.
2. **서비스 계정 권한**: 서비스 계정에 **Firebase Cloud Messaging Admin** 역할이 필요합니다.
3. **API 활성화**: Firebase Cloud Messaging API가 Google Cloud Console에서 활성화되어 있어야 합니다.
4. **디바이스 토큰**: 앱에서 받은 실제 FCM 토큰을 사용해야 합니다.

