# 개발 환경 서비스워커 캐시 초기화 가이드

## 문제 상황
개발 환경에서 Next.js PWA(Service Worker)가 활성화되어 있을 때, 라우팅 변경이나 정적 파일 수정 후에도 이전 캐시가 남아있어 404 에러나 잘못된 라우팅이 발생할 수 있습니다.

## 해결 방법

### 1. 브라우저 콘솔에서 캐시 초기화

개발자 도구(F12) → Console 탭에서 다음 명령어들을 순서대로 실행:

```javascript
// 1. 모든 캐시 삭제
caches.keys().then(keys => keys.forEach(k => caches.delete(k)));

// 2. 서비스워커 등록 해제
navigator.serviceWorker.getRegistrations().then(rs => rs.forEach(r => r.unregister()));

// 3. 로컬 스토리지 클리어
localStorage.clear(); 
sessionStorage.clear();

// 4. 페이지 새로고침
location.reload(true);
```

### 2. 개발자 도구를 통한 초기화

1. **개발자 도구** (F12) 열기
2. **Application** 탭 선택
3. **Storage** 섹션에서 **Clear storage** 클릭
4. **Service Workers** 탭에서 **Unregister** 클릭
5. **강력 새로고침** (Ctrl+Shift+R 또는 Cmd+Shift+R)

### 3. 개발 서버 재시작

터미널에서 다음 명령어 실행:

```bash
# Next.js 캐시 삭제 및 서버 재시작
rm -rf .next
npm run dev
```

### 4. 개발 환경에서 Service Worker 비활성화 (권장)

`next.config.js`에서 개발 환경에서만 PWA를 비활성화:

```javascript
const withPWA = require('next-pwa')({
  dest: 'public',
  disable: process.env.NODE_ENV === 'development', // 개발 환경에서 비활성화
  register: true,
  skipWaiting: true,
})
```

## 언제 사용하나요?

- 라우팅 변경 후 404 에러 발생
- 정적 파일 수정이 반영되지 않음
- Service Worker 관련 오류 메시지
- 캐시된 데이터로 인한 예상치 못한 동작

## 주의사항

- 프로덕션 환경에서는 이 방법을 사용하지 마세요
- 사용자 데이터가 삭제될 수 있으므로 중요한 데이터는 미리 백업하세요
- 개발 중에는 Service Worker를 비활성화하는 것을 권장합니다
