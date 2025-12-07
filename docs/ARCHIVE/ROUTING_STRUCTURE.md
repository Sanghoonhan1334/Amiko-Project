# Amiko 프로젝트 라우팅 구조 문서

## 📋 **개요**
이 문서는 Amiko 프로젝트의 라우팅 구조를 체계적으로 정리한 문서입니다.

## 🗺️ **메인 라우팅 구조**

### **1. 랜딩 페이지**
- **URL**: `/`
- **파일**: `src/app/page.tsx`
- **컴포넌트**: `Hero` (동적 로딩)
- **설명**: 메인 랜딩 페이지

### **2. 메인 앱 페이지 (SPA 방식)**
- **URL**: `/main?tab=community&cTab=home`
- **파일**: `src/app/main/page.tsx`
- **컴포넌트**: `AppPageContent`
- **탭 구조**:
  - `home`: `HomeTab`
  - `meet`: `MeetTab`
  - `community`: `CommunityTab`
  - `me`: `MyTab`
  - `charging`: `ChargingTab`
  - `event`: `EventTab`

### **3. 커뮤니티 라우팅 (리다이렉트)**
- **URL**: `/community/*`
- **파일**: `src/app/community/page.tsx`
- **동작**: `/main?tab=community&cTab=*`로 리다이렉트

## 🏗️ **커뮤니티 내부 라우팅**

### **CommunityTab 구조**
- **메인 컴포넌트**: `src/components/main/app/community/CommunityTab.tsx`
- **서브 뷰**: `CommunityMain.tsx`에서 관리

### **CommunityMain 내부 라우팅**
```typescript
type ViewMode = 'galleries' | 'posts' | 'post-detail' | 'post-create' | 'popular'
```

1. **갤러리 목록**: `galleries` → `GalleryList`
2. **게시물 목록**: `posts` → `GalleryPostList`
3. **게시물 상세**: `post-detail` → `PostDetail`
4. **게시물 작성**: `post-create` → `PostCreate`
5. **인기 게시물**: `popular` → `PopularPosts`

## 🔄 **라우팅 플로우**

### **커뮤니티 게시물 상세 페이지 접근 경로**
```
1. /community → 리다이렉트 → /main?tab=community&cTab=home
2. CommunityTab 렌더링 → CommunityMain 렌더링
3. 갤러리 선택 → ViewMode: 'posts'
4. 게시물 선택 → ViewMode: 'post-detail'
5. PostDetail 컴포넌트 렌더링
```

### **URL과 컴포넌트 매핑 문제점**
- **실제 URL**: `/community/post/[id]` (사용되지 않음)
- **실제 컴포넌트**: `CommunityMain` 내부의 `PostDetail`
- **문제**: URL과 실제 렌더링되는 컴포넌트가 분리됨

## 🚨 **현재 문제점**

### **1. 라우팅 구조 복잡성**
- SPA 방식과 페이지 라우팅이 혼재
- URL과 컴포넌트 매핑이 직관적이지 않음
- 리다이렉트가 많아 디버깅 어려움

### **2. 컴포넌트 중첩**
- `CommunityTab` → `CommunityMain` → `PostDetail`
- 3단계 중첩으로 인한 props drilling
- 상태 관리 복잡성 증가

### **3. 파일 구조 불일치**
- 실제 사용되지 않는 페이지 파일들 존재
- API 라우트와 페이지 라우트 구조 불일치

## 💡 **개선 방안**

### **1. 단기 개선**
- 사용되지 않는 페이지 파일 정리
- 라우팅 로직 중앙화
- 컴포넌트 간 관계 명확화

### **2. 장기 개선**
- URL 기반 라우팅으로 전환 고려
- 상태 관리 라이브러리 도입 검토
- 컴포넌트 구조 단순화

## 📁 **주요 파일 위치**

### **커뮤니티 관련**
- `src/app/main/page.tsx`: 메인 SPA 페이지
- `src/app/community/page.tsx`: 리다이렉트 페이지
- `src/components/main/app/community/CommunityTab.tsx`: 커뮤니티 탭
- `src/components/main/app/community/CommunityMain.tsx`: 커뮤니티 메인 로직
- `src/components/main/app/community/PostDetail.tsx`: 게시물 상세 컴포넌트

### **API 라우트**
- `src/app/api/posts/[id]/route.ts`: 게시물 CRUD API
- `src/app/api/galleries/[slug]/posts/route.ts`: 갤러리 게시물 API

## 🔍 **디버깅 가이드**

### **커뮤니티 게시물 관련 문제 해결**
1. URL 확인: `/community/post/[id]`는 사용되지 않음
2. 실제 컴포넌트: `CommunityMain.tsx`의 `handlePostSelect` 확인
3. 상태 관리: `selectedPost` 상태 확인
4. 이벤트 핸들러: `onEdit`, `onDelete` props 전달 경로 추적

### **라우팅 문제 해결 순서**
1. 브라우저 URL 확인
2. 리다이렉트 로직 확인
3. 컴포넌트 렌더링 순서 확인
4. 상태 변화 추적
5. 이벤트 핸들러 실행 확인

---
*이 문서는 2025년 1월 기준으로 작성되었으며, 프로젝트 구조 변경 시 업데이트가 필요합니다.*
