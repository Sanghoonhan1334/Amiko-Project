# 관심사 동적 번역 사용 예시

## 1. 기본 사용법

```tsx
import TranslatedInterests, { InterestBadges } from '@/components/common/TranslatedInterests'

// 사용자 관심사 데이터
const userInterests = ['K-POP', '드라마', '여행', '요리', '음악']

// 텍스트 형태로 표시
<TranslatedInterests 
  interests={userInterests}
  maxDisplay={2}
  showCount={true}
/>

// 결과:
// 한국어: "관심사: K-POP, 드라마 외 3개"
// 스페인어: "Intereses: K-POP, Dramas y 3 más"
```

## 2. 배지 형태로 표시

```tsx
<InterestBadges 
  interests={userInterests}
  maxDisplay={3}
  className="mt-2"
/>
```

## 3. 기존 컴포넌트에 적용

### UserProfileModal.tsx 수정 예시
```tsx
// 기존 코드 (하드코딩)
<h3 className="font-semibold mb-3 flex items-center gap-2">
  <Heart className="w-4 h-4" />
  관심 분야  {/* 하드코딩된 한국어 */}
</h3>

// 수정된 코드 (동적 번역)
<h3 className="font-semibold mb-3 flex items-center gap-2">
  <Heart className="w-4 h-4" />
  {t('profile.interests')}  {/* 동적 번역 */}
</h3>

// 관심사 표시도 수정
<InterestBadges interests={profile.interests} />
```

## 4. 번역 키 추가

새로운 관심사가 추가되면 `src/lib/translations.ts`에 추가:

```typescript
// 한국어 섹션
interests: {
  // 기존 관심사들...
  '새로운관심사': '새로운관심사',
}

// 스페인어 섹션  
interests: {
  // 기존 관심사들...
  '새로운관심사': 'Nuevo Interés',
}
```

## 5. 동적 번역의 장점

✅ **자동 언어 전환**: 사용자 언어 설정에 따라 자동으로 번역
✅ **확장 가능**: 새로운 관심사 쉽게 추가
✅ **일관성**: 전체 앱에서 동일한 번역 시스템 사용
✅ **성능**: 클라이언트 사이드 번역으로 빠른 로딩
✅ **유지보수**: 중앙 집중식 번역 관리

## 6. 실제 동작 예시

```tsx
// 사용자 언어가 한국어일 때
const interests = ['K-POP', '드라마', '여행']
<TranslatedInterests interests={interests} maxDisplay={2} />
// 출력: "관심사: K-POP, 드라마 외 1개"

// 사용자 언어가 스페인어일 때  
// 출력: "Intereses: K-POP, Dramas y 1 más"
```

## 7. 고급 기능

### 개수별 다른 메시지
```typescript
// translations.ts에 추가
profile: {
  interestCount: {
    one: '1개',
    many: '{count}개',
    // 스페인어
    one: '1',
    many: '{count}'
  }
}
```

### 관심사 카테고리별 그룹핑
```typescript
// 관심사를 카테고리별로 분류
const categorizedInterests = {
  entertainment: ['K-POP', '드라마', '영화'],
  lifestyle: ['여행', '요리', '패션'],
  // ...
}
```

이렇게 하면 **"관심사: K-POP, Dramas 외 3개"** 같은 텍스트가 사용자의 언어 설정에 따라 자동으로 번역됩니다! 🎉
