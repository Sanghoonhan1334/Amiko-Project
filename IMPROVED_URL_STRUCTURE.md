# 개선된 URL 구조 문서

## 🎯 **개선 목표**
- 명확한 URL 구분으로 개발자 혼란 방지
- 직관적인 URL 구조로 사용자 경험 개선
- SEO 친화적인 URL 구조

## 📁 **새로운 URL 구조**

### **커뮤니티 시스템**
```
/community/
├── /gallery/[slug]/         # 갤러리별 게시물 목록
├── /post/[id]/              # 게시물 상세
├── /create/                 # 게시물 작성
├── /popular/                # 인기 게시물
└── /freeboard/              # 자유게시판
```

**참고**: `/community/galleries` 페이지는 2025년 1월에 제거되었습니다. 갤러리 목록은 `/main?tab=community`의 CommunityTab 내부 상태 관리로 처리됩니다.

### **기존 URL과의 매핑**
| 기존 URL | 새 URL | 설명 |
|---------|--------|------|
| `/main?tab=community&cTab=home` | `/main?tab=community` | 커뮤니티 홈 (SPA 내부 상태 관리) |
| `/main?tab=community&cTab=popular` | `/community/popular` | 인기 게시물 |
| `/main?tab=community&cTab=lounge` | `/community/freeboard` | 자유게시판 |
| `/community/post/[id]` | `/community/post/[id]` | 게시물 상세 (유지) |

## 🔄 **리다이렉트 로직**

### **기존 SPA 방식에서 새 URL로**
- `/community` → `/main?tab=community` (기본)
- `/community?tab=popular` → `/community/popular`
- `/community?tab=lounge` → `/community/freeboard`
- `/community?tab=freeboard` → `/community/freeboard`

### **페이지 간 이동**
- 갤러리 목록 → 갤러리별 게시물: `/community/gallery/[slug]`
- 갤러리별 게시물 → 게시물 상세: `/community/post/[id]`
- 게시물 상세 → 글쓰기: `/community/create?gallery=[slug]`
- 글쓰기 → 갤러리별 게시물: `/community/gallery/[slug]`

## 🎨 **페이지별 기능**

### **1. `/main?tab=community` (커뮤니티 홈)**
- **파일**: `src/components/main/app/community/CommunityTab.tsx`
- **컴포넌트**: `CommunityTab` (내부에서 상태 관리)
- **기능**: 커뮤니티 홈 화면, story/qa/news/tests 네비게이션

### **2. `/community/gallery/[slug]`**
- **파일**: `src/app/community/gallery/[slug]/page.tsx`
- **컴포넌트**: `GalleryPostList`
- **기능**: 특정 갤러리의 게시물 목록, 글쓰기

### **3. `/community/post/[id]`**
- **파일**: `src/app/community/post/[id]/page.tsx`
- **컴포넌트**: `PostDetail`
- **기능**: 게시물 상세, 수정/삭제 (구현 완료)

### **4. `/community/create`**
- **파일**: `src/app/community/create/page.tsx`
- **컴포넌트**: `PostCreate`
- **기능**: 게시물 작성

### **5. `/community/popular`**
- **파일**: `src/app/community/popular/page.tsx`
- **컴포넌트**: `PopularPosts`
- **기능**: 인기 게시물 목록

### **6. `/community/freeboard`**
- **파일**: `src/app/community/freeboard/page.tsx` (기존)
- **컴포넌트**: `FreeBoardList`
- **기능**: 자유게시판 게시물 목록

## 🔧 **구현된 개선사항**

### **1. 명확한 URL 구분**
- 각 URL이 하나의 명확한 기능을 담당
- URL만 봐도 어떤 기능인지 즉시 파악 가능

### **2. 수정/삭제 기능 통일**
- `CommunityMain.tsx`: ✅ 구현 완료
- `PostDetailPage.tsx`: ✅ 구현 완료
- 두 곳 모두 동일한 API 호출 및 에러 처리

### **3. 일관된 네비게이션**
- 모든 페이지에서 일관된 뒤로가기 동작
- 명확한 페이지 간 이동 경로

### **4. SEO 친화적 구조**
- 의미 있는 URL 구조
- 검색 엔진이 이해하기 쉬운 경로

## 🚀 **사용 예시**

### **갤러리 탐색 플로우**
```
1. /main?tab=community (커뮤니티 홈)
   ↓ 갤러리 선택 (현재 사용되지 않음)
2. /community/gallery/korean-food (한식 갤러리)
   ↓ 게시물 선택
3. /community/post/123 (게시물 상세)
   ↓ 수정/삭제 또는 목록으로 돌아가기
4. /community/gallery/korean-food (갤러리로 돌아가기)
```

### **글쓰기 플로우**
```
1. /community/gallery/korean-food (갤러리)
   ↓ 글쓰기 버튼 클릭
2. /community/create?gallery=korean-food (글쓰기)
   ↓ 작성 완료
3. /community/gallery/korean-food (갤러리로 돌아가기)
```

## 📊 **개선 효과**

### **개발자 관점**
- ✅ URL과 컴포넌트 매핑이 명확함
- ✅ 라우팅 충돌 문제 해결
- ✅ 디버깅이 쉬워짐

### **사용자 관점**
- ✅ 직관적인 URL 구조
- ✅ 브라우저 뒤로가기 동작 개선
- ✅ 북마크 및 공유 용이성

### **SEO 관점**
- ✅ 의미 있는 URL 구조
- ✅ 검색 엔진 크롤링 최적화
- ✅ 페이지 계층 구조 명확화

## 🔮 **향후 계획**

### **단기 개선**
- [ ] 게시물 수정 기능 구현
- [ ] 모바일 최적화
- [ ] 로딩 상태 개선

### **장기 개선**
- [ ] 서버 사이드 렌더링 (SSR) 적용
- [ ] 메타데이터 최적화
- [ ] 성능 모니터링

## 🗑️ **변경 이력**

### **2025년 1월**
- `/community/galleries` 페이지 제거됨
- 갤러리 기능은 SPA 방식으로 전환 (CommunityTab 내부 상태 관리)
- `/community` 기본 리다이렉트를 `/main?tab=community`로 변경

---
*이 문서는 2025년 1월 기준으로 작성되었으며, URL 구조 변경 시 업데이트가 필요합니다.*
