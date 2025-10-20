## 🛡️ CSS 가드레일 체크리스트

### 필수 체크사항
- [ ] **No `!important` added** - 전역 CSS에 `!important` 사용하지 않음
- [ ] **No new global CSS targeting `img` or `.dark img`** - `globals.css`에 이미지 관련 전역 규칙 추가하지 않음
- [ ] **Dark logo uses asset swap (no CSS filter)** - 다크모드 로고는 CSS 필터 대신 별도 자산 사용
- [ ] **All referenced images exist under `/public`** - 참조하는 모든 이미지가 `/public` 폴더에 존재
- [ ] **Logo component used** - 로고는 `<Logo />` 컴포넌트 사용 (직접 `<img>` 사용 금지)

### 변경사항 설명
<!-- 변경한 내용을 간단히 설명해주세요 -->

### 테스트
- [ ] 라이트 모드에서 로고 정상 표시
- [ ] 다크 모드에서 로고 정상 표시
- [ ] 브라우저 콘솔에 CSS 관련 에러 없음

### 위험도 평가
- [ ] **Low Risk**: 단순 텍스트/레이아웃 변경
- [ ] **Medium Risk**: 컴포넌트 스타일 변경
- [ ] **High Risk**: 전역 CSS, 로고, 다크모드 관련 변경

---
**⚠️ High Risk 변경사항의 경우, 반드시 로컬에서 라이트/다크 모드 모두 테스트 후 PR 생성해주세요.**
