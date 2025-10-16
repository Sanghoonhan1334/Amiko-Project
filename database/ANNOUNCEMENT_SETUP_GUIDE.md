# 공지사항 기능 데이터베이스 설정 가이드

## 1. SQL 실행 방법

### 방법 1: Supabase 대시보드 사용 (권장)
1. Supabase 대시보드에 로그인
2. 좌측 메뉴에서 "SQL Editor" 클릭
3. `database/add-is-notice-column.sql` 파일 내용을 복사해서 붙여넣기
4. "Run" 버튼 클릭

### 방법 2: 로컬 PostgreSQL (psql 설치된 경우)
```bash
psql -h localhost -p 54322 -U postgres -d postgres -f database/add-is-notice-column.sql
```

## 2. 실행할 SQL 내용

```sql
-- posts 테이블에 is_notice 컬럼 추가
-- 이미 존재하는 경우 무시

-- 1. is_notice 컬럼 추가 (기본값 false)
ALTER TABLE public.posts 
ADD COLUMN IF NOT EXISTS is_notice BOOLEAN DEFAULT FALSE;

-- 2. is_pinned 컬럼도 확인하고 추가 (혹시 없다면)
ALTER TABLE public.posts 
ADD COLUMN IF NOT EXISTS is_pinned BOOLEAN DEFAULT FALSE;

-- 3. 인덱스 추가 (성능 최적화)
CREATE INDEX IF NOT EXISTS idx_posts_is_notice ON public.posts(is_notice) WHERE is_notice = true;
CREATE INDEX IF NOT EXISTS idx_posts_is_pinned ON public.posts(is_pinned) WHERE is_pinned = true;

-- 4. 컬럼 설명 추가
COMMENT ON COLUMN public.posts.is_notice IS '공지사항 여부';
COMMENT ON COLUMN public.posts.is_pinned IS '상단 고정 여부';
```

## 3. 확인 방법

SQL 실행 후 다음 쿼리로 확인:
```sql
SELECT column_name, data_type, is_nullable, column_default 
FROM information_schema.columns 
WHERE table_name = 'posts' 
AND column_name IN ('is_notice', 'is_pinned');
```

## 4. 문제 해결

### 컬럼이 이미 존재하는 경우
- `IF NOT EXISTS` 구문으로 에러 없이 실행됩니다.

### 권한 오류가 발생하는 경우
- Supabase 대시보드에서 실행하거나, 데이터베이스 관리자 권한으로 실행하세요.

## 5. 완료 후 확인사항

1. ✅ `is_notice` 컬럼이 posts 테이블에 추가되었는지 확인
2. ✅ `is_pinned` 컬럼이 posts 테이블에 추가되었는지 확인
3. ✅ 인덱스가 생성되었는지 확인
4. ✅ 공지사항 기능이 정상 작동하는지 테스트
