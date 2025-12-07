# 관리자 API 설정 가이드

## 문제
관리자 포인트 랭킹 API가 500 에러를 발생시킴

## 원인
관리자 API는 모든 데이터를 조회해야 하는데, 일반 클라이언트는 RLS(Row Level Security) 정책의 영향을 받아 접근이 제한됩니다.

## 해결 방법

### 1. Supabase에서 Service Role Key 확인
1. Supabase Dashboard 로그인
2. Project Settings → API
3. **service_role** 키 복사 (⚠️ 절대 공개하지 말 것!)

### 2. `.env.local` 파일에 추가
프로젝트 루트에 `.env.local` 파일이 있는지 확인하고, 없으면 생성합니다.

```bash
# Supabase 설정
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here  # ← 이 줄 추가!
```

### 3. 개발 서버 재시작
```bash
# 현재 실행 중인 서버 중지 (Ctrl+C)
# 그리고 다시 시작
npm run dev
```

## 확인
1. 브라우저를 새로고침
2. 관리자 대시보드 → 포인트 랭킹
3. 랭킹 데이터가 정상적으로 표시되는지 확인

## ⚠️ 보안 주의사항
- `SUPABASE_SERVICE_ROLE_KEY`는 **절대** 클라이언트 코드에 노출하지 마세요
- Git에 커밋하지 마세요 (`.gitignore`에 `.env.local`이 있는지 확인)
- 프로덕션에서는 Vercel 대시보드에서 환경변수로 설정

