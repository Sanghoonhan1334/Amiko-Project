# Agora 화상 채팅 설정 가이드

## 문제 해결
현재 화상 채팅이 시작되지 않는 이유는 Agora 환경 변수가 설정되지 않았기 때문입니다.

## 설정 방법

### 1. Agora 계정 생성 및 앱 생성
1. [Agora.io](https://www.agora.io)에 가입
2. 프로젝트 생성
3. App ID와 App Certificate 확인

### 2. 환경 변수 설정
프로젝트 루트에 `.env.local` 파일을 생성하고 다음 내용을 추가하세요:

```env
# Agora 설정
AGORA_APP_ID=your_actual_app_id_here
AGORA_APP_CERTIFICATE=your_actual_app_certificate_here

# Supabase 설정 (기존)
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url_here
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key_here
```

### 3. 개발 서버 재시작
환경 변수 설정 후 개발 서버를 재시작하세요:

```bash
npm run dev
```

## 임시 해결책 (테스트용)
Agora 설정이 완료되기 전까지는 화상 채팅 기능을 비활성화하고 대체 UI를 사용할 수 있습니다.

## 확인 방법
1. 브라우저 개발자 도구 → Console 탭에서 에러 메시지 확인
2. Network 탭에서 `/api/agora/token` 요청 상태 확인
3. 환경 변수가 올바르게 설정되었는지 확인
