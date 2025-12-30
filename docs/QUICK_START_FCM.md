# FCM 빠른 시작 가이드 / FCM Quick Start Guide

## 🚀 5분 안에 설정하기

### 1. Firebase 프로젝트 생성
1. https://console.firebase.google.com/ 접속
2. "프로젝트 추가" → 이름 입력 → 생성

### 2. Android 앱 추가
1. 프로젝트 대시보드 → "Android 앱 추가"
2. 패키지 이름: `com.amiko.biz` 입력
3. 앱 등록

### 3. google-services.json 다운로드
1. 다운로드된 파일을 `android/app/google-services.json`에 배치

### 4. FCM 서버 키 발급
1. 프로젝트 설정 (톱니바퀴) → 클라우드 메시징
2. 서버 키 복사

### 5. 환경 변수 설정
`.env.local` 파일에 추가:
```env
FCM_SERVER_KEY=복사한_서버_키_여기에_붙여넣기
```

### 6. 동기화 및 빌드
```bash
npx cap sync android
cd android
./gradlew assembleDebug
```

### 7. 테스트
1. 앱 설치 및 실행
2. 로그인 후 푸시 알림 동의
3. 콘솔에서 토큰 수신 확인

---

## ✅ 완료 체크리스트

- [ ] Firebase 프로젝트 생성
- [ ] Android 앱 추가 (패키지: com.amiko.biz)
- [ ] google-services.json 다운로드 및 배치
- [ ] FCM 서버 키 발급
- [ ] .env.local에 FCM_SERVER_KEY 설정
- [ ] `npx cap sync android` 실행
- [ ] 앱 빌드 및 테스트

---

## 📚 자세한 가이드

더 자세한 설명은 [FCM_SETUP_GUIDE.md](./FCM_SETUP_GUIDE.md)를 참조하세요.

---

## ❓ 문제가 있나요?

1. `google-services.json` 파일이 `android/app/` 디렉토리에 있는지 확인
2. 환경 변수가 올바르게 설정되었는지 확인
3. `npx cap sync android` 실행했는지 확인
4. 앱을 완전히 재빌드했는지 확인

