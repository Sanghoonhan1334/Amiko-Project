# 🔄 퀴즈 데이터 원상복구 가이드
# Quiz Data Rollback Guide

## ❌ 문제 상황

마이그레이션으로 인해:
- K-POP 스타 MBTI 테스트가 12개 → 20개로 변경됨
- 기존 퀴즈 데이터가 예상과 다르게 변경됨

## ✅ 해결 방법

### 🎯 가장 빠른 방법

**1. Supabase 대시보드 열기**
- https://supabase.com → 프로젝트 선택

**2. SQL Editor 클릭**

**3. 이 파일 열기**
```
database/rollback-simple.sql
```

**4. 전체 내용을 복사해서 SQL Editor에 붙여넣기**

**5. RUN 버튼 클릭** ▶️

**6. 결과 확인**
```
✅ 복구 완료!
K-POP 스타 MBTI 매칭 테스트 | 12
✅ slug 컬럼이 완전히 삭제되었습니다
```

---

## 🔍 복구 후 확인

### 1. 퀴즈 질문 수 확인

```sql
SELECT title, total_questions 
FROM public.quizzes
WHERE title ILIKE '%MBTI%' OR title ILIKE '%K-POP%';
```

**기대 결과**:
```
K-POP 스타 MBTI 매칭 테스트 | 12 ✅
당신과 닮은 K-POP 스타는? | 10 ✅
```

### 2. slug 컬럼 삭제 확인

```sql
SELECT column_name 
FROM information_schema.columns
WHERE table_name = 'quizzes' AND column_name = 'slug';
```

**기대 결과**: `0 rows` (slug 컬럼이 없어야 함)

---

## 🚨 만약 여전히 문제가 있다면

### 방법 1: 수동으로 하나씩 실행

```sql
-- 1단계: MBTI 테스트 복구
UPDATE public.quizzes 
SET total_questions = 12
WHERE title ILIKE '%K-POP 스타 MBTI%';
```

```sql
-- 2단계: 기존 K-POP 테스트 복구
UPDATE public.quizzes 
SET total_questions = 10
WHERE title ILIKE '%당신과 닮은 K-POP 스타%';
```

```sql
-- 3단계: slug 컬럼 삭제
ALTER TABLE public.quizzes DROP COLUMN IF EXISTS slug;
ALTER TABLE public.quiz_results DROP COLUMN IF EXISTS slug;
```

### 방법 2: 더 강력한 롤백

```sql
-- 모든 퀴즈 데이터 초기화 (주의!)
DELETE FROM public.quiz_options;
DELETE FROM public.quiz_questions;
DELETE FROM public.quiz_results;
DELETE FROM public.quizzes;

-- 기존 데이터 재삽입
-- (원본 데이터가 있다면 복원)
```

---

## ✅ 복구 완료 후

1. **퀴즈 목록 확인**
   - /community/tests 페이지에서 확인
   - K-POP 스타 MBTI 테스트가 12개 질문으로 표시되는지

2. **기능 테스트**
   - 퀴즈 클릭 시 정상 작동하는지
   - 질문이 12개만 나오는지

3. **다음 단계**
   - 복구가 완료되면 새 퀴즈 추가 방식을 재검토

---

## 💡 앞으로 주의사항

### ❌ 하지 말 것
- 기존 퀴즈 데이터를 직접 수정하는 마이그레이션
- `total_questions` 같은 필드를 자동으로 변경하는 스크립트

### ✅ 해야 할 것
- 새 퀴즈만 추가하는 방식으로 접근
- 기존 데이터는 건드리지 않기
- 백업 후 마이그레이션 실행

---

## 📞 문제 해결

**복구가 안 되면**:
1. 에러 메시지를 확인해주세요
2. 어떤 단계에서 문제가 발생했는지 알려주세요
3. 현재 퀴즈 데이터 상태를 확인해주세요

**복구가 완료되면**:
1. 퀴즈 목록에서 확인해주세요
2. 정상 작동하는지 테스트해주세요
3. 다음 단계를 진행할지 결정해주세요

---

**지금 바로 `database/rollback-simple.sql`을 실행해주세요!** 🚀
