# ✅ 퀴즈 안전 체크리스트
# Quiz Safety Checklist

새로운 퀴즈를 추가하거나 기존 퀴즈를 수정할 때 반드시 확인하세요.

---

## 📋 1단계: DB 설정 확인

### ✅ 마이그레이션 실행 여부
```bash
# Supabase SQL Editor에서 실행했는지 확인
# database/quiz-namespace-isolation-migration.sql
```

- [ ] `quiz-namespace-isolation-migration.sql` 실행 완료
- [ ] `quizzes` 테이블에 `slug` 컬럼 존재
- [ ] `quiz_results` 테이블에 `slug` 컬럼 존재
- [ ] 고유 인덱스(`idx_quizzes_slug`) 생성됨
- [ ] 복합 인덱스(`idx_quiz_results_quiz_slug`) 생성됨

### ✅ 검증 쿼리
```sql
-- 1. slug가 모든 퀴즈에 있는지
SELECT id, title, slug FROM public.quizzes WHERE slug IS NULL;
-- 결과: 0 rows ✅

-- 2. slug 중복 없는지
SELECT slug, COUNT(*) FROM public.quizzes GROUP BY slug HAVING COUNT(*) > 1;
-- 결과: 0 rows ✅

-- 3. 인덱스 확인
\d public.quizzes
-- idx_quizzes_slug (UNIQUE) 있어야 함 ✅
```

---

## 📋 2단계: 새 퀴즈 생성

### ✅ Slug 생성 규칙
- [ ] 영문 소문자, 숫자, 하이픈만 사용
- [ ] 1-100자 이내
- [ ] 의미 있는 이름 (예: `idol-position`)
- [ ] 예약어 회피 (`api`, `admin`, `new` 등)
- [ ] 기존 slug와 중복 없음

```typescript
// ✅ Good
'idol-position'
'kpop-star-match'
'mbti-celeb'

// ❌ Bad
'test123'          // 의미 없음
'New Quiz!'        // 대문자, 특수문자
'api'              // 예약어
'kpop_star'        // 언더스코어
```

### ✅ 퀴즈 데이터 생성
```typescript
const createData = {
  title: '나에게 어울리는 아이돌 포지션은?',       // ✅ 200자 이내
  description: '10가지 질문으로 알아보는...',      // ✅ 1000자 이내
  category: 'personality',                         // ✅ 유효한 카테고리
  slug: 'idol-position',                           // ✅ 고유한 slug
  thumbnail_url: '/quizzes/idol-position/thumb.jpg' // ✅ slug 포함 경로
}
```

- [ ] `title` 입력됨 (200자 이내)
- [ ] `description` 입력됨 (1000자 이내)
- [ ] `category` 유효함 (personality, celebrity, fun 등)
- [ ] `slug` 유효하고 고유함
- [ ] `thumbnail_url` 올바른 경로 (`/quizzes/[slug]/`)

---

## 📋 3단계: 이미지 설정

### ✅ 폴더 구조
```bash
public/
└── quizzes/
    └── idol-position/          # ✅ slug와 동일
        ├── thumbnail.jpg        # 썸네일
        ├── bailarina.png        # 결과 이미지 1
        ├── cantautora.png       # 결과 이미지 2
        └── ...
```

- [ ] `/public/quizzes/[slug]/` 폴더 생성됨
- [ ] 모든 이미지 파일이 해당 폴더에 있음
- [ ] 이미지 확장자 유효함 (jpg, png, webp, gif)
- [ ] 다른 퀴즈 폴더의 이미지 사용 안 함

### ✅ 이미지 경로 코드
```typescript
import { getQuizImagePath } from '@/lib/quizHelpers'

// ✅ 올바른 방법
const imagePath = getQuizImagePath('idol-position', 'bailarina.png')

// ❌ 잘못된 방법
const wrongPath = '/images/bailarina.png'
const wrongPath2 = '/public/quiz/bailarina.png'
```

- [ ] `getQuizImagePath()` 헬퍼 함수 사용
- [ ] 하드코딩된 경로 없음
- [ ] 모든 이미지 URL이 `/quizzes/[slug]/` 로 시작

---

## 📋 4단계: API 호출

### ✅ 퀴즈 조회
```typescript
// ✅ slug 또는 id로 조회
fetch(`/api/quizzes/${slug}`)
fetch(`/api/quizzes/${quizId}`)

// ❌ 필터 없이 전체 조회 금지
fetch('/api/quizzes/all')
```

- [ ] 퀴즈 조회 시 slug 또는 id 명시
- [ ] 질문 조회 시 quiz_id 필터링
- [ ] 결과 조회 시 quiz_id 필터링
- [ ] 전체 조회 API 사용 안 함 (목록 제외)

### ✅ DB 쿼리 (백엔드)
```typescript
// ✅ 필수: quiz_id 필터링
const { data } = await supabase
  .from('quiz_questions')
  .select('*')
  .eq('quiz_id', quizId)  // 필수!

// ❌ 금지: 필터 없는 조회
const { data } = await supabase
  .from('quiz_questions')
  .select('*')  // 모든 퀴즈 질문 조회됨!
```

- [ ] 모든 `quiz_questions` 쿼리에 `quiz_id` 필터
- [ ] 모든 `quiz_options` 쿼리에 `quiz_id` 필터 (또는 question_id)
- [ ] 모든 `quiz_results` 쿼리에 `quiz_id` 필터
- [ ] 모든 `user_quiz_responses` 쿼리에 `quiz_id` 필터

---

## 📋 5단계: 프론트엔드 상태 관리

### ✅ React Query 사용
```typescript
import { useQuizData, getQuizQueryKey } from '@/hooks/useQuizData'

// ✅ slug 기반 hook 사용
const { data } = useQuizData('idol-position')

// ✅ slug 포함 query key
const queryKey = getQuizQueryKey('idol-position', 'questions')
```

- [ ] `useQuizData(slug)` hook 사용
- [ ] Query key에 slug 포함
- [ ] 다른 퀴즈와 캐시 충돌 없음

### ✅ localStorage 사용
```typescript
import { getQuizStorageKey } from '@/lib/quizHelpers'

// ✅ prefix 사용
const key = getQuizStorageKey('idol-position', 'progress')
// 'quiz:idol-position:progress'

// ❌ prefix 없음
localStorage.setItem('progress', data)  // 충돌 위험!
```

- [ ] `getQuizStorageKey()` 사용
- [ ] 모든 키가 `quiz:[slug]:` 형식
- [ ] 하드코딩된 키 없음

---

## 📋 6단계: 라우팅

### ✅ 페이지 구조
```
/quiz/[id]                  # 동적 라우트 (slug 또는 UUID)
/quiz/idol-position         # slug 직접 접근 가능
/quiz/a0000000-000...001    # UUID 직접 접근 가능
```

- [ ] `/quiz/[id]` 동적 라우트 사용
- [ ] slug와 UUID 모두 처리 가능
- [ ] 커스텀 라우트 없음 (통일성 유지)

### ✅ 네비게이션
```typescript
// ✅ slug 사용
router.push(`/quiz/${slug}`)

// ✅ UUID 사용
router.push(`/quiz/${quizId}`)
```

- [ ] slug 또는 id로 라우팅
- [ ] 하드코딩된 경로 없음

---

## 📋 7단계: 검증 및 보호

### ✅ 타입 안전성
```typescript
import type { Quiz, QuizQuestion, QuizResult } from '@/types/quiz'

// ✅ 타입 사용
const quiz: Quiz = { ... }
const questions: QuizQuestion[] = [ ... ]
```

- [ ] `/src/types/quiz.ts` 타입 정의 사용
- [ ] 모든 퀴즈 데이터에 타입 적용
- [ ] `any` 타입 사용 최소화

### ✅ 검증 함수
```typescript
import { QuizValidator } from '@/lib/quizValidation'

// ✅ 데이터 검증
QuizValidator.slug('idol-position')
QuizValidator.imagePath('/quizzes/idol-position/image.png', 'idol-position')
```

- [ ] 중요한 입력에 검증 함수 사용
- [ ] slug 검증
- [ ] 이미지 경로 검증
- [ ] quiz_id 존재 확인

---

## 📋 8단계: 테스트

### ✅ 기능 테스트
- [ ] 퀴즈 목록에 새 퀴즈 표시됨
- [ ] 퀴즈 클릭 시 정상 진입
- [ ] 질문이 순서대로 표시됨
- [ ] 선택지 선택 가능
- [ ] 다음/이전 버튼 작동
- [ ] 제출 시 결과 표시됨
- [ ] 이미지가 정상 로드됨

### ✅ 격리 테스트
- [ ] 다른 퀴즈 데이터가 섞이지 않음
- [ ] 다른 퀴즈의 이미지가 표시되지 않음
- [ ] localStorage 키가 독립적임
- [ ] React Query 캐시가 분리됨
- [ ] 브라우저 새로고침 후에도 정상 작동

### ✅ 에러 처리
- [ ] 잘못된 slug 입력 시 404 에러
- [ ] 네트워크 에러 시 적절한 메시지
- [ ] 이미지 로드 실패 시 대체 이미지
- [ ] 중복 제출 방지

---

## 📋 9단계: 문서화

### ✅ 주석 작성
```typescript
/**
 * 아이돌 포지션 테스트
 * Slug: idol-position
 * Category: personality
 */
```

- [ ] 퀴즈 목적 및 slug 명시
- [ ] 복잡한 로직에 주석 추가
- [ ] 이미지 경로 규칙 설명

### ✅ 가이드 문서 참조
- [ ] `QUIZ_NAMESPACE_ISOLATION_GUIDE.md` 읽음
- [ ] `QUIZ_IMAGE_PATH_GUIDE.md` 읽음
- [ ] `QUIZ_SAFETY_CHECKLIST.md` (이 문서) 완료

---

## 📋 10단계: 배포 전 최종 확인

### ✅ 코드 리뷰
- [ ] 하드코딩된 값 없음
- [ ] console.log 정리
- [ ] 불필요한 코드 제거
- [ ] ESLint 에러 없음
- [ ] TypeScript 에러 없음

### ✅ DB 확인
```sql
-- 최종 검증
SELECT 
  q.id,
  q.slug,
  q.title,
  COUNT(DISTINCT qq.id) as question_count,
  COUNT(DISTINCT qr.id) as result_count
FROM quizzes q
LEFT JOIN quiz_questions qq ON qq.quiz_id = q.id
LEFT JOIN quiz_results qr ON qr.quiz_id = q.id
WHERE q.slug = 'idol-position'
GROUP BY q.id, q.slug, q.title;
```

- [ ] 퀴즈가 DB에 정상 저장됨
- [ ] 질문이 모두 연결됨
- [ ] 결과가 모두 연결됨
- [ ] slug가 고유함

### ✅ 파일 확인
- [ ] 이미지 파일이 모두 커밋됨
- [ ] 코드 파일이 모두 커밋됨
- [ ] `.gitignore`에 제외되지 않음

---

## 🎯 완료!

모든 체크리스트 항목이 ✅ 표시되면 안전하게 배포할 수 있습니다.

### 🚨 주의사항

1. **절대 하지 말아야 할 것**:
   - quiz_id 없이 DB 쿼리
   - slug 없이 localStorage 사용
   - 다른 퀴즈 이미지 폴더 공유
   - 하드코딩된 퀴즈 ID/slug

2. **반드시 해야 할 것**:
   - slug 고유성 확인
   - quiz_id 필터링 추가
   - 헬퍼 함수 사용
   - 타입 정의 활용

---

## 📞 문제 발생 시

1. `QUIZ_NAMESPACE_ISOLATION_GUIDE.md`의 트러블슈팅 참조
2. DB 마이그레이션 재실행
3. 브라우저 캐시 및 localStorage 클리어
4. 개발자 도구 콘솔 에러 확인

---

**버전**: 1.0.0  
**최종 업데이트**: 2024

