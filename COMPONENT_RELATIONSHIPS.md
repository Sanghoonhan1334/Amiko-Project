# Amiko 프로젝트 컴포넌트 관계 문서

## 📋 **개요**
이 문서는 Amiko 프로젝트의 주요 컴포넌트 간 관계와 데이터 흐름을 정리한 문서입니다.

## 🏗️ **커뮤니티 시스템 컴포넌트 구조**

### **1. 메인 앱 구조**
```
src/app/main/page.tsx (AppPageContent)
├── HomeTab
├── MeetTab  
├── CommunityTab ← 커뮤니티 진입점
├── MyTab
├── ChargingTab
└── EventTab
```

### **2. 커뮤니티 탭 구조**
```
CommunityTab
└── CommunityMain (갤러리 시스템)
    ├── GalleryList (갤러리 목록)
    ├── GalleryPostList (게시물 목록)
    ├── PostDetail (게시물 상세) ← 수정/삭제 버튼 위치
    ├── PostCreate (게시물 작성)
    └── PopularPosts (인기 게시물)
```

### **3. 자유게시판 구조**
```
src/app/community/freeboard/page.tsx
└── FreeBoardList
    ├── 게시물 목록 표시
    ├── 게시물 클릭 → PostDetailPage로 이동
    └── 글쓰기 → PostCreate로 이동
```

## 🔄 **데이터 흐름**

### **1. 게시물 상세 페이지 접근 경로**

#### **SPA 방식 (CommunityMain)**
```
1. CommunityTab 렌더링
2. CommunityMain 내부 상태: viewMode = 'galleries'
3. 갤러리 선택 → viewMode = 'posts'
4. 게시물 선택 → viewMode = 'post-detail'
5. PostDetail 컴포넌트 렌더링
   ├── onEdit: handlePostEdit (구현 완료)
   └── onDelete: handlePostDelete (구현 완료)
```

#### **페이지 라우팅 방식**
```
1. /community/post/[id] 접근
2. PostDetailPage 컴포넌트 렌더링
3. PostDetail 컴포넌트 사용
   ├── onEdit: console.log만 실행 (미구현)
   └── onDelete: console.log + handleBack() (미구현)
```

### **2. 수정/삭제 기능 구현 상태**

| 컴포넌트 | 수정 기능 | 삭제 기능 | 상태 |
|---------|----------|----------|------|
| CommunityMain | ✅ 구현 완료 | ✅ 구현 완료 | 완료 |
| PostDetailPage | ❌ 미구현 | ❌ 미구현 | 문제 있음 |

## 🎯 **컴포넌트별 책임**

### **CommunityMain.tsx**
- **역할**: 갤러리 시스템의 상태 관리 및 라우팅
- **상태**: `viewMode`, `selectedGallery`, `selectedPost`
- **주요 함수**:
  - `handlePostEdit()`: 수정 기능 (구현 완료)
  - `handlePostDelete()`: 삭제 기능 (구현 완료)
  - `handlePostSelect()`: 게시물 선택
  - `handleBackToPosts()`: 목록으로 돌아가기

### **PostDetail.tsx**
- **역할**: 게시물 상세 정보 표시 및 상호작용
- **Props**:
  - `postId`: 게시물 ID
  - `onBack`: 뒤로가기 함수
  - `onEdit`: 수정 함수 (선택사항)
  - `onDelete`: 삭제 함수 (선택사항)
- **기능**:
  - 게시물 정보 표시
  - 댓글 시스템
  - 추천/비추천 기능
  - 수정/삭제 버튼 (권한에 따라)

### **FreeBoardList.tsx**
- **역할**: 자유게시판 게시물 목록 표시
- **Props**:
  - `showHeader`: 헤더 표시 여부
  - `onPostSelect`: 게시물 선택 함수 (새로 추가)
- **기능**:
  - 게시물 목록 조회 및 표시
  - 게시물 클릭 처리
  - 글쓰기 기능

## 🚨 **현재 문제점**

### **1. 라우팅 충돌**
- **문제**: 두 개의 다른 라우팅 시스템이 공존
- **영향**: 사용자 경험 혼란, 개발 복잡성 증가
- **해결책**: 하나의 방식으로 통일 필요

### **2. 기능 구현 불일치**
- **문제**: 같은 컴포넌트(PostDetail)가 다른 곳에서 다르게 동작
- **영향**: 사용자 혼란, 버그 발생 가능성
- **해결책**: 일관된 구현 필요

### **3. Props 전달 복잡성**
- **문제**: 여러 단계의 props drilling
- **영향**: 코드 유지보수성 저하
- **해결책**: 상태 관리 라이브러리 도입 검토

## 💡 **개선 권장사항**

### **1. 단기 개선**
1. **PostDetailPage 수정/삭제 기능 구현**
   - CommunityMain과 동일한 로직 적용
   - API 호출 및 에러 처리 추가

2. **라우팅 방식 통일**
   - SPA 방식 또는 페이지 라우팅 방식 중 선택
   - 불필요한 파일 정리

3. **컴포넌트 재사용성 개선**
   - 공통 로직 추출
   - Props 인터페이스 표준화

### **2. 장기 개선**
1. **상태 관리 개선**
   - Context API 또는 Redux 도입
   - 전역 상태 관리

2. **컴포넌트 구조 단순화**
   - 단일 책임 원칙 적용
   - 컴포넌트 분리

3. **타입 안정성 강화**
   - 공통 타입 정의
   - Props 타입 표준화

## 📊 **수정/삭제 기능 구현 상태**

### **✅ 완료된 작업**
- [x] CommunityMain.tsx 수정/삭제 기능 구현
- [x] FreeBoardList.tsx onPostSelect prop 추가
- [x] 라우팅 구조 분석 및 문서화
- [x] 컴포넌트 관계 정리

### **🔄 진행 중인 작업**
- [ ] PostDetailPage 수정/삭제 기능 구현
- [ ] 라우팅 방식 통일
- [ ] 불필요한 파일 정리

### **⏳ 예정된 작업**
- [ ] 상태 관리 개선
- [ ] 컴포넌트 구조 최적화
- [ ] 타입 안정성 강화

---
*이 문서는 2025년 1월 기준으로 작성되었으며, 프로젝트 구조 변경 시 업데이트가 필요합니다.*
