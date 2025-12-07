# 퀴즈 이미지 경로 가이드
# Quiz Image Path Guide

## 📁 이미지 폴더 구조 (Image Folder Structure)

모든 퀴즈 관련 이미지는 **반드시** 퀴즈의 `slug`를 기준으로 폴더를 분리해야 합니다.

```
public/
└── quizzes/
    ├── kpop-star-match/           # MBTI 셀럽 매칭 테스트
    │   ├── thumbnail.jpg
    │   ├── result-iu.png
    │   ├── result-bts.png
    │   └── ...
    ├── idol-position/              # 아이돌 포지션 테스트
    │   ├── thumbnail.jpg
    │   ├── bailarina.png
    │   ├── cantautora.png
    │   ├── centro.png
    │   └── ...
    ├── mbti-celeb/                 # MBTI 셀럽 테스트
    │   └── ...
    └── [새로운-퀴즈-slug]/         # 새로 추가되는 퀴즈
        └── ...
```

## 🔧 이미지 경로 생성 방법

### 1. 헬퍼 함수 사용 (권장)

```typescript
import { getQuizImagePath } from '@/lib/quizHelpers'

// 사용 예시
const imagePath = getQuizImagePath('idol-position', 'bailarina.png')
// 결과: '/quizzes/idol-position/bailarina.png'
```

### 2. 직접 경로 작성

```typescript
// ❌ 잘못된 방법 - 퀴즈가 섞일 수 있음
const wrongPath = '/public/quiz-images/bailarina.png'

// ✅ 올바른 방법 - slug로 폴더 분리
const correctPath = '/quizzes/idol-position/bailarina.png'
```

## 📝 퀴즈 생성 시 체크리스트

새로운 퀴즈를 만들 때 반드시 확인하세요:

- [ ] 1. 퀴즈에 고유한 `slug` 생성 (예: 'idol-position')
- [ ] 2. `/public/quizzes/[slug]/` 폴더 생성
- [ ] 3. 모든 이미지를 해당 폴더에 저장
- [ ] 4. DB에 이미지 경로 저장 시 `/quizzes/[slug]/[filename]` 형식 사용
- [ ] 5. 코드에서 `getQuizImagePath()` 헬퍼 함수 사용

## 🚫 금지 사항

1. **절대 다른 퀴즈의 이미지 폴더를 공유하지 마세요**
   ```
   ❌ /public/quizzes/shared/image.png  (여러 퀴즈가 공유)
   ✅ /public/quizzes/idol-position/image.png
   ✅ /public/quizzes/kpop-star/image.png
   ```

2. **루트 public 폴더에 직접 저장하지 마세요**
   ```
   ❌ /public/quiz-image.png
   ✅ /public/quizzes/[slug]/quiz-image.png
   ```

3. **slug 없이 ID만 사용하지 마세요**
   ```
   ❌ /public/quizzes/a0000000-0000-0000-0000-000000000001/image.png
   ✅ /public/quizzes/kpop-star-match/image.png
   ```

## 🎯 예시: 아이돌 포지션 테스트

```typescript
// 퀴즈 slug
const QUIZ_SLUG = 'idol-position'

// 이미지 경로들
const images = {
  thumbnail: getQuizImagePath(QUIZ_SLUG, 'thumbnail.jpg'),
  // '/quizzes/idol-position/thumbnail.jpg'
  
  resultBailarina: getQuizImagePath(QUIZ_SLUG, 'bailarina.png'),
  // '/quizzes/idol-position/bailarina.png'
  
  resultCentro: getQuizImagePath(QUIZ_SLUG, 'centro.png'),
  // '/quizzes/idol-position/centro.png'
}

// 사용 예시
<Image 
  src={images.resultBailarina} 
  alt="Bailarina" 
/>
```

## 🔄 기존 퀴즈 마이그레이션

기존 퀴즈의 이미지가 올바른 폴더에 없다면:

1. 퀴즈의 `slug` 확인
2. `/public/quizzes/[slug]/` 폴더 생성
3. 이미지 파일 이동
4. DB의 `image_url` 필드 업데이트

```sql
-- 예시: 이미지 경로 업데이트
UPDATE quiz_results
SET image_url = '/quizzes/idol-position/bailarina.png'
WHERE quiz_id = (SELECT id FROM quizzes WHERE slug = 'idol-position')
  AND result_type = 'bailarina';
```

## ✅ 검증 방법

퀴즈 이미지 경로가 올바른지 확인:

```typescript
// 모든 이미지 경로가 slug로 시작하는지 확인
const isValidImagePath = (imagePath: string, slug: string) => {
  return imagePath.startsWith(`/quizzes/${slug}/`)
}

// 사용 예시
const path = '/quizzes/idol-position/bailarina.png'
const slug = 'idol-position'
console.log(isValidImagePath(path, slug)) // true
```

## 🔗 관련 파일

- 헬퍼 함수: `/src/lib/quizHelpers.ts`
- 타입 정의: `/src/types/quiz.ts`
- 이미지 폴더: `/public/quizzes/`

---

**중요**: 이 규칙을 따르지 않으면 새로운 퀴즈를 추가할 때 기존 퀴즈의 이미지가 섞여서 표시될 수 있습니다!

