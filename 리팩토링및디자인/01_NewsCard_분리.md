# NewsCard 컴포넌트 분리 상세 내역

## 📅 작업 일자
2025년 12월 18일

## 📝 작업 내용

### 생성된 파일
`/src/components/main/app/community/ui/NewsCard.tsx`

### 컴포넌트 Props

```typescript
interface NewsCardProps {
  news: {
    id: string | number
    title: string
    source?: string
    date?: string
    thumbnail?: string
    views?: number
    likes?: number
    comments?: number
    is_pinned?: boolean
  }
  onClick: (news: any, e?: React.MouseEvent) => void
  isAdmin?: boolean
  onEdit?: (news: any) => void
  onTogglePin?: (news: any) => Promise<void>
  onDelete?: (news: any) => Promise<void>
}
```

### 주요 기능

1. **뉴스 카드 UI 렌더링**
   - 썸네일 이미지 표시
   - 제목, 출처, 날짜 표시
   - 조회수, 좋아요, 댓글 수 통계
   - 고정 뉴스 배지 표시

2. **관리자 기능** (isAdmin=true일 때)
   - ✏️ 편집 버튼
   - 📌 고정/해제 버튼
   - 🗑️ 삭제 버튼

3. **반응형 디자인**
   - 모바일: 작은 썸네일, 축약된 정보
   - 데스크톱: 큰 썸네일, 전체 정보

### 사용 예시

```tsx
// CommunityTab.tsx에서 사용
<NewsCard
  news={{
    id: news.id,
    title: showSpanishNews && news.title_es ? news.title_es : news.title,
    source: news.source,
    date: news.date,
    thumbnail: news.thumbnail,
    views: news.views,
    likes: news.likes,
    comments: news.comments,
    is_pinned: news.is_pinned
  }}
  onClick={handleNewsClick}
  isAdmin={isAdmin}
  onEdit={(news) => {
    setEditingNews(news)
    setShowNewsEditModal(true)
    // ...
  }}
  onTogglePin={async (news) => {
    // API 호출 로직
  }}
  onDelete={async (news) => {
    // API 호출 로직
  }}
/>
```

### 코드 감소량

- **Before**: 142줄 (인라인 JSX)
- **After**: 68줄 (컴포넌트 사용)
- **감소**: 74줄 (52% 감소)

### 장점

1. **가독성**: 뉴스 카드 UI가 명확하게 분리됨
2. **재사용성**: 다른 페이지에서도 사용 가능
3. **유지보수**: 디자인 변경 시 NewsCard.tsx만 수정
4. **테스트**: 독립적으로 테스트 가능

### 주의사항

- 모든 이벤트 핸들러는 CommunityTab에서 정의됨
- NewsCard는 순수 UI 컴포넌트 (로직 없음)
- Props 변경 시 타입 정의도 함께 업데이트 필요
