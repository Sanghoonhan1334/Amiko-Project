# 🔧 DB 마이그레이션 에러 해결
# DB Migration Error Fix

## ❌ 발생한 에러

```
ERROR: 42703: column "slug" does not exist
```

## ✅ 해결 방법

### 방법 1: 간단 버전 (권장)

**가장 쉬운 방법입니다. 이것을 먼저 시도하세요!**

1. **Supabase 대시보드** 접속
2. 왼쪽 메뉴에서 **SQL Editor** 클릭
3. **New Query** 클릭
4. 아래 파일 내용을 **전체 복사**:
   ```
   database/quiz-migration-simple.sql
   ```
5. SQL Editor에 **붙여넣기**
6. **RUN** 버튼 클릭 (또는 Ctrl/Cmd + Enter)
7. 결과 확인:
   ```
   ✅ Total quizzes: X
   with_slug: X
   ```
   두 숫자가 같으면 성공!

### 방법 2: 단계별 실행

더 세밀한 제어가 필요하면 이 방법을 사용하세요.

파일: `database/quiz-migration-step-by-step.sql`

각 STEP을 하나씩 복사해서 실행하세요.

---

## 🔍 마이그레이션 후 확인

### 1. slug 컬럼이 추가되었는지 확인

```sql
-- Supabase SQL Editor에서 실행
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'quizzes' 
  AND column_name = 'slug';
```

**기대 결과**:
```
column_name | data_type        | is_nullable
slug        | character varying| YES
```

### 2. 기존 퀴즈에 slug가 있는지 확인

```sql
SELECT id, title, slug, category
FROM public.quizzes
ORDER BY created_at DESC;
```

**기대 결과**: 모든 행에 `slug` 값이 있어야 함

### 3. slug 중복 확인

```sql
SELECT slug, COUNT(*) 
FROM public.quizzes 
GROUP BY slug 
HAVING COUNT(*) > 1;
```

**기대 결과**: `0 rows` (중복 없음)

---

## 🚨 여전히 에러가 발생하면

### 에러 1: "permission denied"

**해결책**: Supabase 대시보드에서 실행하세요 (CLI 대신)

### 에러 2: "relation does not exist"

**해결책**: 테이블 이름 확인
```sql
-- 테이블 목록 확인
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name LIKE '%quiz%';
```

### 에러 3: "index already exists"

**해결책**: 이미 생성된 인덱스 삭제 후 재생성
```sql
DROP INDEX IF EXISTS idx_quizzes_slug;
CREATE UNIQUE INDEX idx_quizzes_slug ON public.quizzes(slug);
```

---

## 📋 수동으로 하나씩 실행하기

정말 안 되면, 이 명령어들을 **하나씩** 복사해서 실행하세요:

```sql
-- 1단계: slug 컬럼 추가
ALTER TABLE public.quizzes ADD COLUMN IF NOT EXISTS slug VARCHAR(100);
```

실행 후 에러가 없으면 다음 단계:

```sql
-- 2단계: 기존 데이터에 slug 추가
UPDATE public.quizzes 
SET slug = 'quiz-' || substring(id::text, 1, 8)
WHERE slug IS NULL;
```

실행 후 에러가 없으면 다음 단계:

```sql
-- 3단계: 고유 인덱스 생성
CREATE UNIQUE INDEX idx_quizzes_slug ON public.quizzes(slug);
```

실행 후 에러가 없으면 다음 단계:

```sql
-- 4단계: 검증
SELECT id, title, slug FROM public.quizzes;
```

---

## ✅ 성공 확인

마이그레이션이 성공하면 다음 쿼리가 **에러 없이** 실행됩니다:

```sql
SELECT id, title, slug FROM public.quizzes WHERE slug IS NULL;
```

**결과**: `0 rows` ✅

---

## 🔄 마이그레이션 롤백 (원상복구)

문제가 생기면 롤백하세요:

```sql
-- slug 컬럼 삭제
ALTER TABLE public.quizzes DROP COLUMN IF EXISTS slug;
ALTER TABLE public.quiz_results DROP COLUMN IF EXISTS slug;

-- 인덱스 삭제
DROP INDEX IF EXISTS idx_quizzes_slug;
DROP INDEX IF EXISTS idx_quiz_results_quiz_slug;
DROP INDEX IF EXISTS idx_quiz_questions_quiz_order;
```

---

## 📞 다음 단계

마이그레이션이 성공하면:

1. **검증 쿼리** 실행:
   ```sql
   SELECT id, title, slug FROM public.quizzes;
   ```

2. **다시 시도**:
   - API가 정상 작동하는지 확인
   - 새 퀴즈 생성 테스트

3. **아이돌 포지션 테스트** 생성 진행!

---

## 💡 팁

- Supabase 대시보드의 SQL Editor를 사용하세요 (CLI보다 안전)
- 한 번에 모든 SQL을 실행하지 말고, 단계별로 확인하세요
- 에러 메시지를 잘 읽으세요 (어떤 줄에서 에러가 났는지 알려줍니다)
- 백업이 없다면 중요한 데이터는 먼저 백업하세요

---

**문제가 해결되었나요?** 
- ✅ Yes → 다음 단계로 진행
- ❌ No → 에러 메시지를 다시 확인해주세요

