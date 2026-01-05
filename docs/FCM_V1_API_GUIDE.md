# FCM HTTP v1 API 사용 가이드
# FCM HTTP v1 API Setup Guide

## 개요 / Overview

이 가이드는 **Firebase SDK나 Firebase Admin을 사용하지 않고**, 순수 **FCM HTTP v1 API**와 **OAuth 2.0**을 사용하여 네이티브 앱 푸시 알림을 구현하는 방법을 설명합니다.

This guide explains how to implement native app push notifications using **FCM HTTP v1 API** and **OAuth 2.0** **without** using Firebase SDK or Firebase Admin.

---

## 주요 특징 / Key Features

- ✅ **Firebase SDK 사용 안 함** - 순수 HTTP API만 사용
- ✅ **OAuth 2.0 인증** - 서비스 계정 JSON으로 동적 access token 생성
- ✅ **Legacy API 미사용** - 최신 HTTP v1 API만 사용
- ✅ **보안 강화** - 서버 키 대신 서비스 계정 사용

---

## 1단계: Google Cloud 서비스 계정 생성 / Step 1: Create Google Cloud Service Account

### Firebase Console에서

1. [Firebase Console](https://console.firebase.google.com/) 접속
2. 프로젝트 선택 (또는 새로 생성)
3. **프로젝트 설정** (톱니바퀴 아이콘) → **서비스 계정** 탭
4. **새 비공개 키 생성** 클릭
5. JSON 파일 다운로드

### 또는 Google Cloud Console에서

1. [Google Cloud Console](https://console.cloud.google.com/) 접속
2. 프로젝트 선택
3. **API 및 서비스** → **사용자 인증 정보**
4. **사용자 인증 정보 만들기** → **서비스 계정**
5. 서비스 계정 생성 후 **키** 탭에서 **키 추가** → **JSON** 선택
6. JSON 파일 다운로드

---

## 2단계: Firebase Cloud Messaging API 활성화 / Step 2: Enable FCM API

1. [Google Cloud Console](https://console.cloud.google.com/) 접속
2. 프로젝트 선택
3. **API 및 서비스** → **라이브러리**
4. "Firebase Cloud Messaging API" 검색
5. **사용 설정** 클릭

---

## 3단계: 서비스 계정에 권한 부여 / Step 3: Grant Permissions

서비스 계정에 **Firebase Cloud Messaging Admin** 역할이 필요합니다.

1. Google Cloud Console → **IAM 및 관리자** → **IAM**
2. 다운로드한 JSON 파일의 `client_email` 찾기
3. 해당 서비스 계정에 **Firebase Cloud Messaging Admin** 역할 추가

또는 Firebase Console에서:
1. **프로젝트 설정** → **서비스 계정** 탭
2. 서비스 계정에 **Firebase Cloud Messaging Admin** 역할 확인

---

## 4단계: 환경 변수 설정 / Step 4: Set Environment Variables

### 방법 1: 개별 환경변수 (권장)

`.env.local` 파일에 추가:

```env
FCM_PROJECT_ID=your-project-id
FCM_CLIENT_EMAIL=your-service-account@project-id.iam.gserviceaccount.com
FCM_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYour private key here\n-----END PRIVATE KEY-----\n"
```

**주의**: `FCM_PRIVATE_KEY`는 개행 문자(`\n`)를 포함해야 합니다.

### 방법 2: JSON 파일 경로

```env
FCM_SERVICE_ACCOUNT_JSON_PATH=./path/to/service-account-key.json
```

### 방법 3: JSON 문자열 (한 줄)

```env
FCM_SERVICE_ACCOUNT_JSON={"type":"service_account","project_id":"...","private_key":"...","client_email":"..."}
```

---

## 5단계: 코드 사용 예제 / Step 5: Code Examples

### 단일 디바이스에 푸시 발송

```typescript
import { sendFCMv1Notification } from '@/lib/fcm-v1'

// 디바이스 토큰 (앱에서 받은 FCM 토큰)
const deviceToken = 'fcm_device_token_here'

// 푸시 알림 발송
const result = await sendFCMv1Notification(
  deviceToken,
  '알림 제목',
  '알림 내용',
  {
    // 추가 데이터 (선택사항)
    url: '/notifications',
    notificationId: '123'
  }
)

if (result.success) {
  console.log('푸시 알림 발송 성공:', result.messageId)
} else {
  console.error('푸시 알림 발송 실패:', result.error)
}
```

### 여러 디바이스에 배치 발송

```typescript
import { sendFCMv1BatchNotifications } from '@/lib/fcm-v1'

const deviceTokens = [
  'token1',
  'token2',
  'token3'
]

const results = await sendFCMv1BatchNotifications(
  deviceTokens,
  '알림 제목',
  '알림 내용',
  { url: '/notifications' }
)

results.forEach(result => {
  if (result.success) {
    console.log(`✅ ${result.token}: 성공`)
  } else {
    console.error(`❌ ${result.token}: ${result.error}`)
  }
})
```

---

## 6단계: API 엔드포인트 사용 / Step 6: Use API Endpoint

기존 `/api/notifications/send-push` 엔드포인트가 자동으로 FCM v1 API를 사용합니다.

```typescript
// POST /api/notifications/send-push
const response = await fetch('/api/notifications/send-push', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    userId: 'user-id',
    title: '알림 제목',
    body: '알림 내용',
    data: {
      url: '/notifications',
      notificationId: '123'
    }
  })
})
```

---

## 기술 상세 / Technical Details

### OAuth 2.0 Access Token 생성 과정

1. **JWT 생성**: 서비스 계정 정보로 JWT 생성
   - `iss`: 서비스 계정 이메일
   - `scope`: `https://www.googleapis.com/auth/firebase.messaging`
   - `aud`: `https://oauth2.googleapis.com/token`
   - `exp`: 현재 시간 + 1시간

2. **JWT 서명**: RSA-SHA256으로 서명

3. **Access Token 요청**: JWT를 사용하여 OAuth 2.0 토큰 요청

4. **토큰 사용**: 받은 access token으로 FCM v1 API 호출

### FCM v1 API 엔드포인트

```
POST https://fcm.googleapis.com/v1/projects/{project_id}/messages:send
Authorization: Bearer {access_token}
Content-Type: application/json
```

### 메시지 페이로드 구조

```json
{
  "message": {
    "token": "device_token",
    "notification": {
      "title": "알림 제목",
      "body": "알림 내용"
    },
    "data": {
      "key1": "value1",
      "key2": "value2"
    },
    "android": {
      "priority": "high",
      "notification": {
        "sound": "default",
        "channelId": "default"
      }
    }
  }
}
```

---

## 문제 해결 / Troubleshooting

### OAuth 2.0 토큰 요청 실패

**에러**: `OAuth 2.0 토큰 요청 실패: 401`

**해결**:
- 서비스 계정 JSON 파일이 올바른지 확인
- `FCM_PRIVATE_KEY`에 개행 문자(`\n`)가 포함되어 있는지 확인
- 서비스 계정 이메일이 올바른지 확인

### FCM API 호출 실패

**에러**: `FCM 발송 실패: 403`

**해결**:
- Firebase Cloud Messaging API가 활성화되어 있는지 확인
- 서비스 계정에 **Firebase Cloud Messaging Admin** 역할이 부여되어 있는지 확인
- 프로젝트 ID가 올바른지 확인

### 디바이스 토큰이 유효하지 않음

**에러**: `FCM 발송 실패: 404`

**해결**:
- 디바이스 토큰이 올바른지 확인
- 토큰이 만료되었을 수 있음 (앱 재설치 시 토큰 변경됨)

---

## 보안 주의사항 / Security Notes

1. **서비스 계정 JSON 파일을 Git에 커밋하지 마세요**
2. `.env.local` 파일을 `.gitignore`에 추가하세요
3. 배포 환경(Vercel 등)에도 환경 변수를 설정하세요
4. 서비스 계정 키는 최소 권한 원칙에 따라 필요한 권한만 부여하세요

---

## Legacy API와의 차이점 / Differences from Legacy API

| 항목 | Legacy API | HTTP v1 API |
|------|-----------|-------------|
| 엔드포인트 | `https://fcm.googleapis.com/fcm/send` | `https://fcm.googleapis.com/v1/projects/{project_id}/messages:send` |
| 인증 | Server Key (`AAAA...`) | OAuth 2.0 Access Token |
| 보안 | 낮음 (서버 키 노출 위험) | 높음 (서비스 계정 사용) |
| 지원 기간 | 2024년 6월 20일까지 | 계속 지원 |
| 권장 여부 | ❌ 비권장 | ✅ 권장 |

---

## 참고 자료 / References

- [FCM HTTP v1 API 문서](https://firebase.google.com/docs/cloud-messaging/migrate-v1)
- [Google OAuth 2.0 문서](https://developers.google.com/identity/protocols/oauth2)
- [서비스 계정 인증](https://cloud.google.com/docs/authentication/production)

