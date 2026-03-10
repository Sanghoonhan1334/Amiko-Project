# GitHub 저장소 연결 가이드

## 🔗 저장소 정보
- **GitHub URL**: `https://github.com/Sanghoonhan1334/AMIKO-Project.git`

## 📋 단계별 연결 방법

### 1단계: Git 설치 확인

PowerShell이나 터미널에서 다음 명령어를 실행하세요:
```bash
git --version
```

만약 Git이 설치되어 있지 않다면:
- **다운로드**: https://git-scm.com/download/win
- 설치 파일 실행 후 기본 설정으로 설치
- 설치 후 **새 터미널 창**을 열어주세요

---

### 2단계: Git 사용자 정보 설정 (처음 한 번만)

```bash
git config --global user.name "당신의 이름"
git config --global user.email "당신의 이메일"
```

예시:
```bash
git config --global user.name "Sanghoonhan1334"
git config --global user.email "your-email@example.com"
```

---

### 3단계: 프로젝트 폴더로 이동

```bash
cd C:\Projects\AMIKO-Project
```

---

### 4단계: Git 저장소 초기화 (아직 안 되어 있다면)

```bash
git init
```

---

### 5단계: 원격 저장소 연결

```bash
git remote add origin https://github.com/Sanghoonhan1334/AMIKO-Project.git
```

**이미 원격 저장소가 연결되어 있다면:**
```bash
git remote set-url origin https://github.com/Sanghoonhan1334/AMIKO-Project.git
```

**원격 저장소 확인:**
```bash
git remote -v
```

---

### 6단계: 현재 상태 확인

```bash
git status
```

---

### 7단계: 파일 추가 및 커밋

**모든 변경사항 추가:**
```bash
git add .
```

**커밋:**
```bash
git commit -m "Initial commit 또는 변경사항 설명"
```

---

### 8단계: GitHub에 푸시

**첫 푸시 (main 브랜치):**
```bash
git branch -M main
git push -u origin main
```

**이미 main 브랜치가 있고 연결되어 있다면:**
```bash
git push -u origin main
```

---

## ⚠️ 주의사항

1. **GitHub 인증**: 푸시할 때 GitHub 로그인 정보가 필요할 수 있습니다.
   - Personal Access Token (PAT) 사용 권장
   - 또는 GitHub Desktop 사용

2. **충돌 방지**: GitHub에 이미 코드가 있다면 먼저 pull 받아야 할 수 있습니다:
   ```bash
   git pull origin main --allow-unrelated-histories
   ```

3. **브랜치 확인**: 현재 브랜치 확인:
   ```bash
   git branch
   ```

---

## 🔐 GitHub 인증 방법

### Personal Access Token 사용 (권장)

1. GitHub → Settings → Developer settings → Personal access tokens → Tokens (classic)
2. "Generate new token" 클릭
3. 필요한 권한 선택 (repo 권한 필요)
4. 토큰 생성 후 복사
5. 푸시할 때 비밀번호 대신 토큰 사용

### GitHub Desktop 사용

Git 명령어 대신 GitHub Desktop 앱을 사용할 수도 있습니다:
- 다운로드: https://desktop.github.com/

---

## ✅ 연결 확인

연결이 잘 되었는지 확인:
```bash
git remote -v
```

다음과 같이 나와야 합니다:
```
origin  https://github.com/Sanghoonhan1334/AMIKO-Project.git (fetch)
origin  https://github.com/Sanghoonhan1334/AMIKO-Project.git (push)
```

