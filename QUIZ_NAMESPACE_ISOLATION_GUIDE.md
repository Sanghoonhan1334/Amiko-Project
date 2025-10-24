# 🛡️ 퀴즈 네임스페이스 격리 가이드
# Quiz Namespace Isolation Guide

## 📋 목차

1. [개요](#개요)
2. [문제점](#문제점)
3. [해결책](#해결책)
4. [설치 방법](#설치-방법)
5. [사용 가이드](#사용-가이드)
6. [보호 규칙](#보호-규칙)
7. [트러블슈팅](#트러블슈팅)

---

## 개요

이 가이드는 **새로운 퀴즈를 추가할 때 기존 퀴즈와 데이터가 섞이지 않도록** 하는 안전장치에 대한 설명입니다.

### 🎯 목표
- 각 퀴즈(slug)별로 완전한 네임스페이스 격리
- DB, API, 프론트엔드, 캐시, 이미지 경로 모두에서 분리
- 새 퀴즈 추가 시 기존 퀴즈에 영향 없음

---

## 문제점

### ❌ 이전 상황
```
문제 1: 새 테스트 추가 시 기존 MBTI 데이터가 같이 조회됨
문제 2: 이미지 경로가 섞여서 잘못된 이미지 표시
문제 3: localStorage 캐시가 충돌
문제 4: React Query 캐시가 섞임
```

### 예시
```typescript
// ❌ 잘못된 방법
const questions = await supabase
  .from('quiz_questions')
  .select('*') // 모든 퀴즈의 질문이 조회됨!

// ❌ 캐시 충돌
localStorage.setItem('quiz-progress', data) // 모든 퀴즈가 같은 키 사용
```

---

## 해결책

### ✅ 현재 솔루션

1. **DB 레벨**: `slug` 컬럼으로 퀴즈 고유 식별
2. **API 레벨**: 모든 쿼리에 `quiz_id` 필터링 강제
3. **캐시 레벨**: `quiz:<slug>:<key>` 형식으로 네임스페이스 분리
4. **이미지 레벨**: `/quizzes/<slug>/` 폴더 분리

---

## 설치 방법

### 1단계: DB 마이그레이션 실행

```sql
-- database/quiz-namespace-isolation-migration.sql 실행
-- Supabase 대시보드 > SQL Editor에서 실행
```

**또는 CLI 사용:**
```bash
psql -h your-host -U your-user -d your-db -f database/quiz-namespace-isolation-migration.sql
```

### 2단계: 검증

```sql
-- 1. slug가 모든 퀴즈에 추가되었는지 확인
SELECT id, title, slug FROM public.quizzes WHERE slug IS NULL;
-- 결과: 0 rows (slug가 NULL인 퀴즈가 없어야 함)

-- 2. 중복된 slug가 있는지 확인
SELECT slug, COUNT(*) FROM public.quizzes GROUP BY slug HAVING COUNT(*) > 1;
-- 결과: 0 rows (중복된 slug가 없어야 함)

-- 3. 인덱스 확인
SELECT indexname, indexdef 
FROM pg_indexes 
WHERE tablename IN ('quizzes', 'quiz_results', 'quiz_questions') 
ORDER BY tablename, indexname;
```

### 3단계: 환경 확인

모든 파일이 생성되었는지 확인:

```bash
# 헬퍼 함수
ls -l src/lib/quizHelpers.ts

# React Hook
ls -l src/hooks/useQuizData.ts

# 타입 정의
ls -l src/types/quiz.ts

# 가이드 문서
ls -l QUIZ_NAMESPACE_ISOLATION_GUIDE.md
ls -l QUIZ_IMAGE_PATH_GUIDE.md
```

---

## 사용 가이드

### 📝 새 퀴즈 생성하기

#### 1. Slug 결정
```typescript
// slug는 고유하고 의미있는 이름으로
const QUIZ_SLUG = 'idol-position'  // ✅ Good
const QUIZ_SLUG = 'test123'        // ❌ Bad (의미 없음)
```

#### 2. 이미지 폴더 생성
```bash
mkdir -p public/quizzes/idol-position
```

#### 3. API를 통해 퀴즈 생성
```typescript
const response = await fetch('/api/quizzes', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  },
  body: JSON.stringify({
    title: '나에게 어울리는 아이돌 포지션은?',
    description: '10가지 질문으로 알아보는 나의 아이돌 포지션',
    category: 'personality',
    slug: 'idol-position', // 명시적으로 제공
    thumbnail_url: '/quizzes/idol-position/thumbnail.jpg'
  })
})
```

#### 4. 이미지 경로 사용
```typescript
import { getQuizImagePath } from '@/lib/quizHelpers'

// ✅ 올바른 방법
const imagePath = getQuizImagePath('idol-position', 'bailarina.png')
// '/quizzes/idol-position/bailarina.png'

// ❌ 잘못된 방법
const wrongPath = '/images/bailarina.png'
```

#### 5. 데이터 조회
```typescript
import { useQuizData } from '@/hooks/useQuizData'

function IdolPositionQuiz() {
  const { data, isLoading, error } = useQuizData('idol-position')
  
  // data는 idol-position 퀴즈만 포함
  // 다른 퀴즈 데이터는 절대 섞이지 않음
}
```

#### 6. 진행 상태 저장
```typescript
import { useQuizProgress } from '@/hooks/useQuizData'

function QuizPage() {
  const { progress, saveProgress, clearProgress } = useQuizProgress('idol-position')
  
  // localStorage에 'quiz:idol-position:progress'로 저장됨
  // 다른 퀴즈와 충돌 없음
}
```

---

## 보호 규칙

### 🚨 필수 준수 사항

#### 1. DB 쿼리
```typescript
// ❌ 금지: quiz_id 없이 조회
const questions = await supabase
  .from('quiz_questions')
  .select('*')

// ✅ 필수: quiz_id로 필터링
const questions = await supabase
  .from('quiz_questions')
  .select('*')
  .eq('quiz_id', quizId)
```

#### 2. 이미지 경로
```typescript
// ❌ 금지: 루트 또는 공유 폴더
'/public/images/result.png'
'/public/shared/result.png'

// ✅ 필수: slug 기반 폴더
'/quizzes/idol-position/result.png'
'/quizzes/kpop-star-match/result.png'
```

#### 3. localStorage 키
```typescript
// ❌ 금지: prefix 없이 사용
localStorage.setItem('progress', data)
localStorage.setItem('quiz-result', data)

// ✅ 필수: quiz prefix 사용
import { getQuizStorageKey } from '@/lib/quizHelpers'
localStorage.setItem(getQuizStorageKey('idol-position', 'progress'), data)
```

#### 4. React Query 키
```typescript
// ❌ 금지: slug 없이 사용
useQuery({ queryKey: ['quiz', 'questions'] })

// ✅ 필수: slug 포함
import { getQuizQueryKey } from '@/lib/quizHelpers'
useQuery({ queryKey: getQuizQueryKey('idol-position', 'questions') })
```

#### 5. API 호출
```typescript
// ❌ 금지: ID/slug 없이 호출
fetch('/api/quizzes/questions')

// ✅ 필수: ID 또는 slug 포함
fetch('/api/quizzes/idol-position')
fetch(`/api/quizzes/${quizId}`)
```

---

## 트러블슈팅

### 문제 1: 새 퀴즈 데이터가 보이지 않음

**원인**: slug가 DB에 제대로 저장되지 않음

**해결**:
```sql
-- slug 확인
SELECT id, title, slug FROM quizzes WHERE title LIKE '%idol%';

-- slug가 없으면 추가
UPDATE quizzes 
SET slug = 'idol-position' 
WHERE id = 'your-quiz-id';
```

### 문제 2: 이미지가 표시되지 않음

**원인**: 이미지 경로가 잘못됨

**해결**:
```bash
# 1. 폴더 구조 확인
ls -la public/quizzes/idol-position/

# 2. 이미지 파일 존재 확인
ls -la public/quizzes/idol-position/bailarina.png

# 3. DB 경로 확인
SELECT result_type, image_url FROM quiz_results 
WHERE quiz_id = (SELECT id FROM quizzes WHERE slug = 'idol-position');
```

### 문제 3: 다른 퀴즈 데이터가 섞여서 나옴

**원인**: API 쿼리에서 quiz_id 필터링이 누락됨

**해결**:
```typescript
// API 코드 확인
// 모든 SELECT 쿼리에 .eq('quiz_id', quizId) 추가

const { data } = await supabase
  .from('quiz_questions')
  .select('*')
  .eq('quiz_id', quizId) // 이 부분 확인!
```

### 문제 4: 캐시가 꼬임

**원인**: localStorage 키가 slug 없이 사용됨

**해결**:
```typescript
// 기존 캐시 모두 삭제
import { clearAllQuizData } from '@/lib/quizHelpers'
clearAllQuizData('idol-position')

// 또는 전체 퀴즈 캐시 삭제
Object.keys(localStorage)
  .filter(key => key.startsWith('quiz:'))
  .forEach(key => localStorage.removeItem(key))
```

---

## 체크리스트

새 퀴즈 추가 전에 확인하세요:

- [ ] DB 마이그레이션 실행 완료
- [ ] 퀴즈에 고유한 slug 할당
- [ ] `/public/quizzes/[slug]/` 폴더 생성
- [ ] 모든 이미지를 해당 폴더에 저장
- [ ] `getQuizImagePath()` 헬퍼 사용
- [ ] `useQuizData(slug)` hook 사용
- [ ] API 호출 시 slug 또는 id 명시
- [ ] localStorage 사용 시 `getQuizStorageKey()` 사용
- [ ] React Query 키에 `getQuizQueryKey()` 사용

---

## 관련 파일

- **DB 마이그레이션**: `database/quiz-namespace-isolation-migration.sql`
- **헬퍼 함수**: `src/lib/quizHelpers.ts`
- **React Hooks**: `src/hooks/useQuizData.ts`
- **타입 정의**: `src/types/quiz.ts`
- **API 라우트**:
  - `src/app/api/quizzes/route.ts`
  - `src/app/api/quizzes/[id]/route.ts`
  - `src/app/api/quizzes/[id]/submit/route.ts`
  - `src/app/api/quizzes/[id]/result/route.ts`

---

## 📞 문의

문제가 발생하거나 궁금한 점이 있으면:
1. 이 가이드의 트러블슈팅 섹션 확인
2. DB 마이그레이션 재실행
3. 브라우저 캐시 및 localStorage 클리어

---

**⚠️ 중요**: 이 안전장치를 우회하지 마세요. 퀴즈 데이터가 섞이면 사용자 경험이 크게 손상됩니다!

