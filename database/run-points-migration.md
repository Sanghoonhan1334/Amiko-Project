# 포인트 시스템 마이그레이션 가이드

## 실행 순서

### 1단계: 포인트 시스템 2026 업데이트
```sql
-- Supabase SQL Editor에서 실행:
database/update-points-system-2026.sql
```

**주요 내용:**
- `user_points` 테이블에 `monthly_points` 컬럼 추가
- `points_history` 테이블의 type 제약조건 업데이트
- `daily_activity` 테이블 생성 (일일 활동 추적)
- 포인트 적립 함수 업데이트 (75점 일일 한도)
- 월별 포인트 초기화 함수 생성
- 일일 활동 조회 함수 생성

### 2단계: 추천인 시스템 생성
```sql
-- Supabase SQL Editor에서 실행:
database/create-referrals-system.sql
```

**주요 내용:**
- `referrals` 테이블 생성 (추천인 코드 관리)
- `referral_event_participants` 테이블 생성 (추천인 이벤트)
- `monthly_points_event_participants` 테이블 생성 (월별 포인트 이벤트)
- 추첨 함수 생성

**주의:** 이 파일은 `monthly_points` 컬럼이 필요하므로 1단계를 먼저 실행해야 합니다.

### 3단계 (선택): 테스트 데이터 생성
```sql
-- Supabase SQL Editor에서 실행:
database/seed-test-points-data.sql
```

**주요 내용:**
- 기존 사용자들에게 랜덤 포인트 추가
- 랭킹 테스트용 데이터 생성

## 확인 방법

### 포인트 시스템 확인
```sql
-- user_points 테이블에 monthly_points 컬럼이 있는지 확인
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'user_points';

-- daily_activity 테이블이 생성되었는지 확인
SELECT COUNT(*) FROM daily_activity;
```

### 함수 확인
```sql
-- 함수 목록 확인
SELECT routine_name 
FROM information_schema.routines 
WHERE routine_type = 'FUNCTION' 
AND routine_schema = 'public'
AND routine_name IN (
  'get_user_points_summary', 
  'update_daily_activity',
  'add_points_with_limit',
  'reset_monthly_points'
);
```

### 추천인 시스템 확인
```sql
-- 테이블이 생성되었는지 확인
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public'
AND table_name IN (
  'referrals',
  'referral_event_participants',
  'monthly_points_event_participants'
);
```

## 문제 해결

### 이미 monthly_points 컬럼이 있는 경우
`update-points-system-2026.sql` 파일은 이미 존재하는 컬럼을 건너뜁니다.

### RLS 정책 오류
RLS 정책이 이미 존재하는 경우, 스크립트가 기존 정책을 삭제하고 재생성합니다.

