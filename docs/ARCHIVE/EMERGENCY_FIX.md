# 🚨 긴급 복구 가이드
# Emergency Fix Guide

## 🔥 현재 상황
1. **DB 마이그레이션으로 기존 퀴즈 데이터 변경됨** (12개 → 20개)
2. **번역 키가 표시되지 않음** (tests.mbti.title 등)

## ⚡ 긴급 복구 순서

### 1단계: DB 원상복구 (가장 중요!)

**Supabase SQL Editor에서 실행:**

```sql
-- 1. K-POP 스타 MBTI 테스트 복구 (20개 → 12개)
UPDATE public.quizzes 
SET total_questions = 12
WHERE title ILIKE '%K-POP 스타 MBTI%';

-- 2. 기존 K-POP 스타 테스트 복구
UPDATE public.quizzes 
SET total_questions = 10
WHERE title ILIKE '%당신과 닮은 K-POP 스타%';

-- 3. slug 관련 모든 변경사항 제거
DROP INDEX IF EXISTS idx_quizzes_slug;
DROP INDEX IF EXISTS idx_quiz_results_quiz_slug;
DROP INDEX IF EXISTS idx_quiz_questions_quiz_order;

ALTER TABLE public.quizzes DROP COLUMN IF EXISTS slug;
ALTER TABLE public.quiz_results DROP COLUMN IF EXISTS slug;

-- 4. 확인
SELECT title, total_questions 
FROM public.quizzes
WHERE title ILIKE '%MBTI%' OR title ILIKE '%K-POP%';
```

**결과 확인:**
```
K-POP 스타 MBTI 매칭 테스트 | 12 ✅
당신과 닮은 K-POP 스타는? | 10 ✅
```

### 2단계: 번역 문제 해결

**브라우저에서:**
1. **개발자 도구 열기** (F12)
2. **Console 탭** 클릭
3. 키 입력: `localStorage.clear()`
4. **페이지 새로고침** (F5)

**또는 수동으로:**
1. 브라우저 설정 → 개인정보 보호 → 쿠키 및 사이트 데이터
2. 이 사이트 데이터 삭제
3. 새로고침

### 3단계: 캐시 완전 삭제

**터미널에서:**
```bash
# Next.js 캐시 삭제
rm -rf .next

# node_modules 재설치 (필요시)
npm install

# 개발 서버 재시작
npm run dev
```

## 🔍 문제 진단

### 번역 키 문제 확인
브라우저 개발자 도구 Console에서 확인:
```javascript
// 언어 설정 확인
localStorage.getItem('amiko-language')

// 번역 객체 확인
console.log(window.translations)
```

### 퀴즈 데이터 확인
```sql
SELECT id, title, total_questions, category 
FROM public.quizzes 
ORDER BY created_at DESC;
```

## ✅ 복구 완료 확인

1. **퀴즈 목록 페이지**에서:
   - K-POP 스타 MBTI 테스트가 12개 질문으로 표시
   - 번역 키가 아닌 실제 텍스트로 표시

2. **퀴즈 페이지**에서:
   - "tests.mbti.title" → "K-POP 스타 MBTI 매칭 테스트"
   - "tests.mbti.description" → 실제 설명
   - 질문이 12개만 표시

## 🚨 여전히 문제가 있다면

### 번역 키가 계속 표시되는 경우:
```javascript
// 브라우저 Console에서 실행
localStorage.removeItem('amiko-language')
localStorage.removeItem('amiko_token')
location.reload()
```

### 퀴즈 데이터가 여전히 이상한 경우:
```sql
-- 강제로 올바른 값 설정
UPDATE public.quizzes 
SET total_questions = 12
WHERE id = '268caf0b-0031-4e58-9245-606e3421f1fd';

UPDATE public.quizzes 
SET total_questions = 10
WHERE id = 'a0000000-0000-0000-0000-000000000001';
```

## 📞 다음 단계

복구가 완료되면:
1. **기존 퀴즈는 건드리지 않고**
2. **새로운 퀴즈만 추가하는 방식**으로 진행
3. **마이그레이션 없이** 안전하게 작업

---

**지금 바로 1단계부터 실행해주세요!** 🚀
