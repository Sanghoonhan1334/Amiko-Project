# 기여 가이드 (Contributing Guide)

Amiko 프로젝트에 기여해 주셔서 감사합니다! 이 문서는 프로젝트에 기여하기 위한 가이드를 제공합니다.

## 📋 목차

1. [브랜치 전략](#브랜치-전략)
2. [코드 스타일](#코드-스타일)
3. [커밋 메시지 규칙](#커밋-메시지-규칙)
4. [PR (Pull Request) 절차](#pr-pull-request-절차)
5. [개발 환경 설정](#개발-환경-설정)

## 🌿 브랜치 전략

### 주요 브랜치

- `main` - 프로덕션 브랜치 (안정적인 코드만 포함)
- `dev` - 개발 브랜치 (통합 테스트용)

### 기능 브랜치

새로운 기능을 개발할 때는 `dev` 브랜치에서 `feature/*` 브랜치를 생성합니다.

**브랜치 명명 규칙:**
- `feature/paypal-integration` - PayPal 결제 통합
- `feature/legal-terms` - 법적 약관 추가
- `feature/class-tab` - 강의 탭 구현
- `feature/latin-ui` - 라틴아메리카 UI 개선
- `fix/payment-bug` - 버그 수정
- `chore/update-dependencies` - 의존성 업데이트

**예시:**
```bash
# dev 브랜치에서 시작
git checkout dev
git pull origin dev

# 새 기능 브랜치 생성
git checkout -b feature/paypal-integration

# 작업 후 커밋
git add .
git commit -m "feat: PayPal 결제 통합 초기 구현"

# 원격 저장소에 푸시
git push origin feature/paypal-integration
```

## 💻 코드 스타일

### TypeScript

- TypeScript 엄격 모드 사용
- 타입 명시 (any 사용 지양)
- 인터페이스/타입 정의는 `src/types/`에 위치

### ESLint

프로젝트는 ESLint를 사용합니다. 코드를 작성한 후 반드시 린트를 실행하세요:

```bash
npm run lint
```

린트 오류가 있으면 PR 전에 수정해 주세요.

### Prettier

현재 Prettier는 설정되지 않았으나, 추후 추가 예정입니다.

### 파일 구조

- 컴포넌트: `src/components/`
- API 라우트: `src/app/api/`
- 유틸리티: `src/lib/`
- 타입 정의: `src/types/`

## 📝 커밋 메시지 규칙

커밋 메시지는 다음 형식을 따릅니다:

```
<type>: <subject>

<body> (선택사항)

<footer> (선택사항)
```

### Type

- `feat`: 새로운 기능 추가
- `fix`: 버그 수정
- `docs`: 문서 수정
- `style`: 코드 포맷팅, 세미콜론 누락 등 (기능 변경 없음)
- `refactor`: 코드 리팩토링
- `test`: 테스트 추가 또는 수정
- `chore`: 빌드 프로세스 또는 보조 도구 변경

### 예시

```bash
# 기능 추가
git commit -m "feat: PayPal 결제 통합 구현"

# 버그 수정
git commit -m "fix: 결제 웹훅 처리 오류 수정"

# 문서 수정
git commit -m "docs: README에 환경 변수 설명 추가"

# 리팩토링
git commit -m "refactor: 결제 API 코드 구조 개선"
```

## 🔄 PR (Pull Request) 절차

### 1. 이슈 생성 (선택사항)

큰 기능 개발의 경우 먼저 이슈를 생성하여 논의하는 것을 권장합니다.

### 2. 브랜치 생성 및 개발

1. `dev` 브랜치에서 최신 코드를 가져옵니다:
   ```bash
   git checkout dev
   git pull origin dev
   ```

2. 새 기능 브랜치를 생성합니다:
   ```bash
   git checkout -b feature/your-feature-name
   ```

3. 코드를 작성하고 커밋합니다.

### 3. PR 생성 전 체크리스트

PR을 생성하기 전에 다음 사항을 확인하세요:

- [ ] 코드가 빌드됩니다 (`npm run build`)
- [ ] ESLint를 통과합니다 (`npm run lint`)
- [ ] 커밋 메시지가 규칙을 따릅니다
- [ ] 관련 문서를 업데이트했습니다 (필요한 경우)
- [ ] 테스트를 수행했습니다 (가능한 경우)

### 4. PR 생성

1. GitHub에서 PR을 생성합니다.
2. PR 제목은 커밋 메시지 형식을 따릅니다.
3. PR 설명에 다음을 포함하세요:
   - 변경 사항 요약
   - 관련 이슈 번호 (있는 경우)
   - 테스트 방법
   - 스크린샷 (UI 변경의 경우)

**PR 제목 예시:**
```
feat: PayPal 결제 통합 구현
```

**PR 설명 예시:**
```markdown
## 변경 사항
- PayPal 결제 API 연동
- 결제 버튼 컴포넌트 추가
- 웹훅 처리 로직 구현

## 관련 이슈
Closes #123

## 테스트 방법
1. 결제 페이지에서 PayPal 버튼 클릭
2. PayPal 샌드박스 계정으로 결제 진행
3. 결제 완료 확인
```

### 5. 코드 리뷰

- 리뷰어의 피드백에 적극적으로 응답하세요
- 필요한 경우 코드를 수정하고 다시 커밋하세요
- 모든 리뷰가 완료되면 `dev` 브랜치로 머지됩니다

## 🛠️ 개발 환경 설정

### 필수 요구사항

- Node.js 18 이상
- npm 또는 yarn
- Git

### 초기 설정

1. 저장소 클론:
   ```bash
   git clone <repository-url>
   cd Amiko-Project-main
   ```

2. 의존성 설치:
   ```bash
   npm install
   ```

3. 환경 변수 설정:
   ```bash
   cp .env.local.example .env.local
   # .env.local 파일을 열어 실제 값으로 채우기
   ```

4. 개발 서버 실행:
   ```bash
   npm run dev
   ```

### 유용한 명령어

```bash
# 개발 서버 실행
npm run dev

# 프로덕션 빌드
npm run build

# 린트 실행
npm run lint

# 프로덕션 서버 실행 (빌드 후)
npm start
```

## 📞 문의

질문이나 제안사항이 있으면 이슈를 생성하거나 팀에 직접 문의하세요.

감사합니다! 🎉
