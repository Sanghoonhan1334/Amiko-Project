# 포인트 시스템 통합 가이드

## 📊 개요

Amiko 플랫폼의 포인트 시스템을 통합하여 안정성과 일관성을 향상시켰습니다.

## 🔧 주요 개선사항

### 1. 데이터베이스 스키마 통합
- **기존**: 3개의 서로 다른 포인트 테이블 구조
- **개선**: 1개의 통합된 포인트 시스템

### 2. API 클라이언트 통일
- **기존**: `@supabase/supabase-js` 직접 사용
- **개선**: `@/lib/supabase/server` 통일 사용

### 3. 포인트 함수 통합
- **기존**: 여러 개의 중복된 포인트 함수
- **개선**: 통합된 포인트 관리 함수

## 📁 파일 구조

### 데이터베이스
```
database/
├── unified-points-system.sql      # 통합 포인트 시스템 스키마
├── migrate-points-system.sql      # 마이그레이션 스크립트
└── points-system-schema.sql       # 기존 스키마 (참고용)
```

### API 엔드포인트
```
src/app/api/
├── points/
│   ├── route.ts                   # 포인트 조회
│   ├── use/route.ts              # 포인트 사용
│   ├── test/route.ts             # 포인트 시스템 테스트
│   └── ranking/route.ts          # 포인트 랭킹
└── community/
    └── points/route.ts           # 커뮤니티 포인트 지급
```

## 🗄️ 데이터베이스 스키마

### 1. user_points 테이블
```sql
CREATE TABLE public.user_points (
    id UUID PRIMARY KEY,
    user_id UUID REFERENCES users(id),
    available_points INTEGER DEFAULT 0,  -- 사용 가능한 포인트
    total_points INTEGER DEFAULT 0,      -- 총 누적 포인트
    created_at TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE
);
```

### 2. points_history 테이블
```sql
CREATE TABLE public.points_history (
    id UUID PRIMARY KEY,
    user_id UUID REFERENCES users(id),
    points INTEGER NOT NULL,             -- 획득/사용 포인트
    type VARCHAR(50) NOT NULL,           -- 포인트 유형
    description TEXT,                    -- 설명
    related_id UUID,                     -- 관련 ID
    related_type VARCHAR(20),            -- 관련 타입
    created_at TIMESTAMP WITH TIME ZONE
);
```

### 3. daily_points_limit 테이블
```sql
CREATE TABLE public.daily_points_limit (
    id UUID PRIMARY KEY,
    user_id UUID REFERENCES users(id),
    date DATE NOT NULL,
    community_points INTEGER DEFAULT 0,  -- 커뮤니티 포인트
    video_call_points INTEGER DEFAULT 0, -- 영상통화 포인트
    created_at TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE
);
```

## 🔧 통합 함수

### 1. add_points_with_limit()
포인트 적립 (일일 한도 체크 포함)
```sql
SELECT add_points_with_limit(
    'user_id'::UUID,
    'question_post'::VARCHAR,
    5::INTEGER,
    '질문 작성으로 5포인트 획득'::TEXT,
    'post_id'::UUID,
    'post'::VARCHAR
);
```

### 2. use_points()
포인트 사용 (available_points 차감)
```sql
SELECT use_points(
    'user_id'::UUID,
    100::INTEGER,
    '쿠폰 구매'::TEXT,
    'coupon_id'::UUID,
    'coupon'::VARCHAR
);
```

### 3. get_user_points_summary()
사용자 포인트 요약 정보
```sql
SELECT * FROM get_user_points_summary('user_id'::UUID);
```

### 4. get_points_ranking()
포인트 랭킹 조회
```sql
SELECT * FROM get_points_ranking(10);
```

## 📊 포인트 획득 규칙

| 활동 | 포인트 | 일일 한도 |
|------|--------|-----------|
| 질문 작성 | +5 | 20포인트 |
| 답변 작성 | +10 | 20포인트 |
| 스토리 작성 | +3 | 20포인트 |
| 자유게시판 작성 | +2 | 20포인트 |
| 댓글 작성 | +1 | 20포인트 |
| 좋아요 받음 | +2 | 20포인트 |
| 영상통화 완료 | +40 | 별도 한도 |

## 🚀 마이그레이션 방법

### 1. 데이터베이스 마이그레이션
```bash
# Supabase SQL Editor에서 실행
psql -f database/migrate-points-system.sql
```

### 2. API 테스트
```bash
# 포인트 시스템 상태 확인
GET /api/points/test?userId=USER_ID

# 테스트 포인트 지급
POST /api/points/test
{
  "userId": "USER_ID",
  "amount": 10,
  "type": "test_points",
  "description": "테스트 포인트"
}
```

## 🔍 테스트 방법

### 1. 포인트 조회 테스트
```javascript
const response = await fetch('/api/points?userId=USER_ID');
const data = await response.json();
console.log('포인트 정보:', data);
```

### 2. 포인트 지급 테스트
```javascript
const response = await fetch('/api/community/points', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    userId: 'USER_ID',
    activityType: 'question_post',
    postId: 'POST_ID',
    title: '테스트 질문'
  })
});
```

### 3. 포인트 사용 테스트
```javascript
const response = await fetch('/api/points/use', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    userId: 'USER_ID',
    amount: 100,
    description: '테스트 포인트 사용',
    relatedId: 'RELATED_ID',
    relatedType: 'coupon'
  })
});
```

## 📈 모니터링

### 1. 포인트 시스템 상태 확인
- `/api/points/test?userId=USER_ID` - 개별 사용자 상태
- 데이터베이스 쿼리로 전체 시스템 상태 모니터링

### 2. 주요 지표
- 총 포인트 발행량
- 일일 포인트 지급량
- 포인트 사용량
- 사용자별 포인트 분포

## ⚠️ 주의사항

1. **마이그레이션 전 백업**: 기존 데이터 백업 필수
2. **테스트 환경**: 프로덕션 적용 전 테스트 환경에서 검증
3. **모니터링**: 마이그레이션 후 포인트 시스템 모니터링
4. **롤백 계획**: 문제 발생 시 롤백 계획 준비

## 🎯 향후 개선 계획

1. **포인트 상점**: 포인트로 구매 가능한 아이템 시스템
2. **포인트 이벤트**: 특별 이벤트 시 포인트 보너스
3. **포인트 분석**: 사용자 행동 분석을 위한 포인트 데이터 활용
4. **포인트 알림**: 실시간 포인트 획득/사용 알림

## 📞 지원

포인트 시스템 관련 문의사항이 있으시면 개발팀에 연락해주세요.
