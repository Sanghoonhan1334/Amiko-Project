# 🛡️ CSS 가드레일 규칙

## 🚨 하드 규칙 (절대 위반 금지)

### 1. `!important` 사용 금지
```css
/* ❌ 금지 */
.logo-container img { 
  filter: none !important; 
}

/* ✅ 권장 */
.logo-container img { 
  filter: none; 
}
```

### 2. 전역 이미지 규칙 금지
```css
/* ❌ 금지 - globals.css에서 */
img { filter: invert(1); }
.dark img { opacity: 0.5; }

/* ✅ 권장 - 컴포넌트 스코프 */
.logo-container img { filter: invert(1); }
```

### 3. 다크모드 로고: CSS 필터 대신 자산 교체
```tsx
/* ❌ 금지 */
<img src="/logo.png" className="dark:invert" />

/* ✅ 권장 */
<Logo className="h-12" />
// 또는
<img src="/logo.png" className="block dark:hidden" />
<img src="/logo-dark.png" className="hidden dark:block" />
```

### 4. Logo 컴포넌트 강제 사용
```tsx
/* ❌ 금지 - 직접 img 사용 */
<img src="/amiko-logo.png" alt="Amiko" />

/* ✅ 권장 */
<Logo className="h-12" />
```

## 🔧 도구 설정

### Stylelint
- `!important` 사용 차단
- 전역 이미지 셀렉터 차단
- `filter`, `mix-blend-mode` 속성 차단

### Pre-commit 훅
- 커밋 전 자동 CSS 규칙 검사
- 위반 시 커밋 차단

### PR 템플릿
- CSS 가드레일 체크리스트 포함
- 위험도 평가 필수

## 🧪 테스트

### Playwright 테스트
```bash
npm run test:playwright
```
- 라이트/다크 모드 로고 가시성 확인
- 로고 클릭 기능 확인

## 📋 체크리스트

변경 전 반드시 확인:
- [ ] `!important` 사용하지 않음
- [ ] `globals.css`에 이미지 관련 규칙 추가하지 않음
- [ ] 다크모드 로고는 자산 교체 방식 사용
- [ ] `<Logo />` 컴포넌트 사용
- [ ] 참조하는 이미지 파일 존재 확인

## 🚨 문제 발생 시

1. **로고가 안 보임**: `globals.css`에서 `filter: none !important` 확인
2. **다크모드 문제**: CSS 필터 대신 별도 이미지 사용
3. **전역 스타일 충돌**: 컴포넌트 스코프로 이동

## 📞 문의

CSS 관련 문제 발생 시 이 문서를 먼저 확인하고, 필요시 팀에 문의하세요.
