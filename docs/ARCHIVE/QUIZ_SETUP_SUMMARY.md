# 🛡️ 퀴즈 네임스페이스 격리 시스템 설치 완료
# Quiz Namespace Isolation System Setup Complete

## ✅ 설치된 안전장치 요약

### 🗄️ 1. 데이터베이스 레벨

**파일**: `database/quiz-namespace-isolation-migration.sql`

✅ 추가된 컬럼:
- `quizzes.slug` (VARCHAR(100), UNIQUE)
- `quiz_results.slug` (VARCHAR(100))

✅ 생성된 인덱스:
- `idx_quizzes_slug` (UNIQUE)
- `idx_quiz_results_quiz_slug` (quiz_id + slug 복합 인덱스)
- `idx_quiz_questions_quiz_order` (quiz_id + question_order 복합 인덱스)

### 🔌 2. API 레벨

**수정된 파일**:
- `src/app/api/quizzes/route.ts`
- `src/app/api/quizzes/[id]/route.ts`

✅ 개선 사항:
- slug 기반 퀴즈 조회 지원
- ID와 slug 모두 사용 가능
- 자동 slug 생성 (제목에서)
- slug 중복 체크
- 모든 쿼리에 quiz_id 필터링 강제

### 🎨 3. 프론트엔드 레벨

**새로 생성된 파일**:
- `src/lib/quizHelpers.ts` - 헬퍼 함수 모음
- `src/hooks/useQuizData.ts` - React 커스텀 훅
- `src/types/quiz.ts` - TypeScript 타입 정의
- `src/lib/quizValidation.ts` - 검증 및 보호 규칙

✅ 기능:
- Quiz 전용 localStorage 키 생성 (`quiz:<slug>:<key>`)
- Quiz 전용 React Query 키 생성 (`['quiz', slug, ...]`)
- 이미지 경로 헬퍼 (`/quizzes/<slug>/`)
- 진행 상태 자동 저장/복원
- 캐시 무효화 로직

### 📁 4. 이미지 경로 레벨

**구조**:
```
public/
└── quizzes/
    ├── idol-roles/       # 기존 (idol-position으로 변경 가능)
    ├── kpop-star-match/  # MBTI 셀럽
    └── [새-퀴즈-slug]/   # 앞으로 추가될 퀴즈
```

✅ 규칙:
- 모든 퀴즈는 `/public/quizzes/<slug>/` 전용 폴더
- 헬퍼 함수로만 경로 생성
- 다른 퀴즈 이미지 절대 공유 금지

### 📚 5. 문서화

**생성된 가이드**:
1. `QUIZ_NAMESPACE_ISOLATION_GUIDE.md` - 종합 가이드
2. `QUIZ_IMAGE_PATH_GUIDE.md` - 이미지 경로 가이드
3. `QUIZ_SAFETY_CHECKLIST.md` - 안전 체크리스트
4. `QUIZ_SETUP_SUMMARY.md` - 이 문서

---

## 🚀 다음 단계: 새 퀴즈 만들기

### Step 1: DB 마이그레이션 실행 (최초 1회만)

```sql
-- Supabase 대시보드 > SQL Editor
-- database/quiz-namespace-isolation-migration.sql 복사해서 실행
```

### Step 2: 퀴즈 슬러그 결정

```typescript
const QUIZ_SLUG = 'idol-position'  // 고유하고 의미있는 이름
```

### Step 3: 이미지 폴더 생성

```bash
mkdir -p public/quizzes/idol-position
# 이미지 파일들을 이 폴더에 넣기
```

### Step 4: 퀴즈 생성 API 호출

```typescript
const response = await fetch('/api/quizzes', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  },
  body: JSON.stringify({
    title: '나에게 어울리는 아이돌 포지션은?',
    description: '10가지 질문으로 알아보는 나의 포지션',
    category: 'personality',
    slug: 'idol-position',
    thumbnail_url: '/quizzes/idol-position/thumbnail.jpg'
  })
})
```

### Step 5: 질문과 선택지 추가

DB에 직접 또는 Admin 페이지를 통해 추가

### Step 6: 결과 타입 추가

```sql
INSERT INTO quiz_results (quiz_id, slug, result_type, title, description, image_url)
VALUES 
  ((SELECT id FROM quizzes WHERE slug = 'idol-position'),
   'bailarina',
   'BAILARINA',
   '댄서형',
   '당신은 춤으로 무대를 장악하는 타입입니다!',
   '/quizzes/idol-position/bailarina.png');
```

### Step 7: 페이지에서 사용

```typescript
import { useQuizData } from '@/hooks/useQuizData'
import { getQuizImagePath } from '@/lib/quizHelpers'

function IdolPositionQuiz() {
  const { data, isLoading } = useQuizData('idol-position')
  
  // 자동으로 idol-position 퀴즈 데이터만 조회됨
  // 다른 퀴즈 데이터는 절대 섞이지 않음!
  
  return (
    <img src={getQuizImagePath('idol-position', 'bailarina.png')} />
  )
}
```

---

## 🔍 검증 방법

### 데이터 격리 테스트

```typescript
// 1. 퀴즈 A 데이터 조회
const quizA = useQuizData('idol-position')

// 2. 퀴즈 B 데이터 조회
const quizB = useQuizData('kpop-star-match')

// 3. 확인: quizA와 quizB가 완전히 분리되어야 함
console.assert(quizA.data.quiz.id !== quizB.data.quiz.id)
console.assert(quizA.data.questions.length !== quizB.data.questions.length)
```

### 캐시 격리 테스트

```typescript
// 1. 퀴즈 A 진행 상태 저장
saveQuizProgress('idol-position', { currentQuestion: 5 })

// 2. 퀴즈 B 진행 상태 저장
saveQuizProgress('kpop-star-match', { currentQuestion: 3 })

// 3. 확인: 각각 독립적으로 저장되어야 함
const progressA = loadQuizProgress('idol-position')
const progressB = loadQuizProgress('kpop-star-match')

console.assert(progressA.currentQuestion === 5)
console.assert(progressB.currentQuestion === 3)
```

### 이미지 경로 테스트

```typescript
// 1. 퀴즈 A 이미지
const imageA = getQuizImagePath('idol-position', 'bailarina.png')
// '/quizzes/idol-position/bailarina.png'

// 2. 퀴즈 B 이미지
const imageB = getQuizImagePath('kpop-star-match', 'iu.png')
// '/quizzes/kpop-star-match/iu.png'

// 3. 확인: 경로가 완전히 분리되어야 함
console.assert(imageA.includes('idol-position'))
console.assert(imageB.includes('kpop-star-match'))
```

---

## ⚠️ 주의사항

### 절대 하지 말 것

```typescript
// ❌ quiz_id 없이 DB 쿼리
supabase.from('quiz_questions').select('*')

// ❌ slug 없이 localStorage 사용
localStorage.setItem('progress', data)

// ❌ 다른 퀴즈 이미지 폴더 사용
<img src="/quizzes/other-quiz/image.png" />

// ❌ 하드코딩된 경로
const path = '/images/quiz/result.png'
```

### 반드시 할 것

```typescript
// ✅ quiz_id 필터링
supabase.from('quiz_questions').select('*').eq('quiz_id', quizId)

// ✅ slug 기반 localStorage
import { getQuizStorageKey } from '@/lib/quizHelpers'
localStorage.setItem(getQuizStorageKey(slug, 'progress'), data)

// ✅ 헬퍼 함수로 이미지 경로
import { getQuizImagePath } from '@/lib/quizHelpers'
<img src={getQuizImagePath(slug, 'image.png')} />

// ✅ 타입 안전성
import type { Quiz } from '@/types/quiz'
const quiz: Quiz = data
```

---

## 📊 파일 구조 요약

```
AMIKO-Project/
├── database/
│   └── quiz-namespace-isolation-migration.sql  ✅ DB 마이그레이션
├── src/
│   ├── app/
│   │   └── api/
│   │       └── quizzes/
│   │           ├── route.ts                     ✅ 수정됨
│   │           └── [id]/
│   │               ├── route.ts                 ✅ 수정됨
│   │               ├── submit/route.ts          (이미 안전함)
│   │               └── result/route.ts          (이미 안전함)
│   ├── lib/
│   │   ├── quizHelpers.ts                       ✅ 신규
│   │   └── quizValidation.ts                    ✅ 신규
│   ├── hooks/
│   │   └── useQuizData.ts                       ✅ 신규
│   └── types/
│       └── quiz.ts                              ✅ 신규
├── public/
│   └── quizzes/
│       ├── idol-roles/                          ✅ 기존
│       └── [새-퀴즈]/                           (앞으로 추가)
├── QUIZ_NAMESPACE_ISOLATION_GUIDE.md            ✅ 종합 가이드
├── QUIZ_IMAGE_PATH_GUIDE.md                     ✅ 이미지 가이드
├── QUIZ_SAFETY_CHECKLIST.md                     ✅ 체크리스트
└── QUIZ_SETUP_SUMMARY.md                        ✅ 이 문서
```

---

## 🎯 완료된 목표

✅ 각 퀴즈별 완전한 네임스페이스 격리  
✅ DB, API, 캐시, 이미지 경로 모두 분리  
✅ 새 퀴즈 추가 시 기존 퀴즈 영향 없음  
✅ 헬퍼 함수와 타입 정의 제공  
✅ 종합 가이드 및 체크리스트 제공  
✅ 검증 및 보호 규칙 구현  

---

## 📞 도움말

- 종합 가이드: `QUIZ_NAMESPACE_ISOLATION_GUIDE.md`
- 이미지 경로: `QUIZ_IMAGE_PATH_GUIDE.md`
- 체크리스트: `QUIZ_SAFETY_CHECKLIST.md`
- 헬퍼 함수: `src/lib/quizHelpers.ts`
- 검증 함수: `src/lib/quizValidation.ts`

---

**설치 완료 일자**: 2024  
**버전**: 1.0.0  
**상태**: ✅ 프로덕션 준비 완료

