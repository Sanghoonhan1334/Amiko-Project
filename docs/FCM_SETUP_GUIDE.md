# FCM (Firebase Cloud Messaging) 설정 가이드
# FCM Setup Guide for Native App Push Notifications

## 개요 / Overview

이 가이드는 Android 네이티브 앱 푸시 알림을 위한 FCM 설정 방법을 설명합니다.
This guide explains how to set up FCM for Android native app push notifications.

**중요**: FCM은 푸시 알림 전송용으로만 사용하며, Supabase는 계속 사용합니다.
**Important**: FCM is used only for push notification delivery. Supabase remains the primary backend.

---

## 1단계: Firebase 프로젝트 생성 / Step 1: Create Firebase Project

1. [Firebase Console](https://console.firebase.google.com/) 접속
2. "프로젝트 추가" 클릭
3. 프로젝트 이름 입력 (예: "Amiko Push Notifications")
4. Google Analytics는 선택사항 (필요 없으면 비활성화 가능)
5. 프로젝트 생성 완료

---

## 2단계: Android 앱 추가 / Step 2: Add Android App

1. Firebase 프로젝트 대시보드에서 "Android 앱 추가" 클릭
2. **Android 패키지 이름**: `com.amiko.biz` 입력
3. 앱 닉네임 입력 (선택사항)
4. "앱 등록" 클릭

---

## 3단계: google-services.json 다운로드 / Step 3: Download google-services.json

1. `google-services.json` 파일 다운로드
2. 파일을 다음 위치에 배치:
   ```
   android/app/google-services.json
   ```
3. 파일이 올바른 위치에 있는지 확인

---

## 4단계: FCM 서버 키 발급 / Step 4: Get FCM Server Key

1. Firebase Console → 프로젝트 설정 (톱니바퀴 아이콘)
2. "클라우드 메시징" 탭 클릭
3. "서버 키" 또는 "Cloud Messaging API (Legacy)" 섹션에서 서버 키 복사
   - 또는 "Cloud Messaging API (V1)" 사용 시 서비스 계정 키 필요

**참고**: 
- Legacy 서버 키: 간단하지만 보안상 권장되지 않음
- V1 API: 더 안전하지만 서비스 계정 설정 필요

---

## 5단계: 환경 변수 설정 / Step 5: Set Environment Variables

`.env.local` 파일에 추가:

```env
# FCM 서버 키 (Legacy)
FCM_SERVER_KEY=your_fcm_server_key_here

# 또는 V1 API 사용 시
# FCM_PROJECT_ID=your_project_id
# FCM_PRIVATE_KEY=your_private_key
# FCM_CLIENT_EMAIL=your_client_email
```

**보안 주의사항**:
- `.env.local`은 Git에 커밋하지 마세요
- Vercel/배포 환경에도 환경 변수로 추가해야 합니다

---

## 6단계: Capacitor 동기화 / Step 6: Sync Capacitor

```bash
npx cap sync android
```

이 명령어는:
- `google-services.json`을 Android 프로젝트에 통합
- Capacitor 플러그인 동기화
- 네이티브 코드 업데이트

---

## 7단계: 앱 빌드 및 테스트 / Step 7: Build and Test

1. Android 앱 빌드:
   ```bash
   cd android
   ./gradlew assembleDebug
   ```

2. 앱 설치 및 실행

3. 앱에서 로그인 후 푸시 알림 동의

4. 콘솔 로그 확인:
   ```
   [PUSH] 네이티브 앱 푸시 알림 초기화 시작
   [PUSH] 네이티브 앱 알림 권한 허용됨
   [PUSH] 네이티브 앱 푸시 토큰 수신: ...
   ```

---

## 문제 해결 / Troubleshooting

### google-services.json을 찾을 수 없음
- 파일이 `android/app/` 디렉토리에 있는지 확인
- 파일 이름이 정확히 `google-services.json`인지 확인

### FCM 서버 키 오류
- Firebase Console에서 서버 키가 활성화되어 있는지 확인
- 환경 변수가 올바르게 설정되었는지 확인
- 서버 재시작 필요할 수 있음

### 푸시 알림이 오지 않음
1. 앱이 백그라운드에 있는지 확인
2. 알림 권한이 허용되었는지 확인
3. FCM 토큰이 서버에 저장되었는지 확인:
   ```sql
   SELECT * FROM push_subscriptions WHERE platform = 'android';
   ```

### 빌드 오류
- `npx cap sync android` 실행
- `android/app/build.gradle`에서 google-services 플러그인이 적용되었는지 확인

---

## 보안 권장사항 / Security Recommendations

1. **V1 API 사용 권장** (향후 구현 예정):
   - Legacy 서버 키보다 안전
   - 서비스 계정 기반 인증

2. **환경 변수 관리**:
   - 로컬: `.env.local`
   - 프로덕션: Vercel 환경 변수
   - Git에 커밋하지 않기

3. **토큰 관리**:
   - 사용자가 앱 삭제 시 토큰 자동 삭제 (이미 구현됨)
   - 만료된 토큰 정기 정리

---

## 다음 단계 / Next Steps

1. ✅ Firebase 프로젝트 생성
2. ✅ google-services.json 다운로드 및 배치
3. ✅ FCM 서버 키 발급 및 환경 변수 설정
4. ✅ `npx cap sync android` 실행
5. ✅ 앱 빌드 및 테스트

완료되면 네이티브 앱에서 푸시 알림을 받을 수 있습니다! 🎉

