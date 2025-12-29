# 브랜치 보호 규칙 설정 가이드 / Branch Protection Setup Guide

이 문서는 GitHub에서 브랜치 보호 규칙을 설정하는 상세한 단계별 가이드입니다.
This document is a detailed step-by-step guide for setting up branch protection rules on GitHub.

---

## 🎯 목적 / Purpose

Pull Request 워크플로우를 강제하여 코드 품질을 보장하고 협업을 효율적으로 만들기 위한 브랜치 보호 규칙 설정.
Set up branch protection rules to enforce Pull Request workflow, ensure code quality, and make collaboration efficient.

---

## 📋 사전 준비 / Prerequisites

- GitHub 저장소 관리자 권한 / Repository admin access
- GitHub 웹 브라우저 접속 / Access to GitHub website

---

## 🔒 1단계: main 브랜치 보호 규칙 설정 / Step 1: Configure main Branch Protection

### GitHub 웹사이트에서 설정하기 / Setup via GitHub Website

1. **저장소로 이동**
   - https://github.com/Sanghoonhan1334/Amiko-Project 접속

2. **Settings(설정) 메뉴 클릭**
   - 저장소 상단 메뉴에서 "Settings" 클릭

3. **Branches(브랜치) 메뉴 선택**
   - 왼쪽 사이드바에서 "Branches" 클릭

4. **"Add branch protection rule" 버튼 클릭**

5. **Branch name pattern 입력**
   - `main` 입력

6. **다음 항목들을 체크:**

   ```
   ✅ Require a pull request before merging
      - ✅ Require approvals: 1
      - ✅ Dismiss stale reviews when new commits are pushed
   
   ✅ Require status checks to pass before merging
      - (CI가 설정되어 있으면 나중에 추가)
      - (Can be added later when CI is set up)
   
   ✅ Require branches to be up to date before merging
   
   ❌ Do not allow force pushes
   
   ❌ Do not allow deletions
   
   ⚠️  Do not allow bypassing the above settings
      - ⚠️  중요: 관리자도 직접 푸시 불가 (PR만 가능)
      - ⚠️  Important: Even admins cannot push directly (only PR allowed)
   ```

7. **"Create" 버튼 클릭**

---

## 🔒 2단계: develop 브랜치 보호 규칙 설정 / Step 2: Configure develop Branch Protection

1. **다시 "Add branch protection rule" 버튼 클릭**

2. **Branch name pattern 입력**
   - `develop` 입력 (또는 `dev` 사용 시 `dev`)

3. **다음 항목들을 체크:**

   ```
   ✅ Require a pull request before merging
      - ✅ Require approvals: 1
   
   ✅ Require status checks to pass before merging
      - (CI가 설정되어 있으면 나중에 추가)
      - (Can be added later when CI is set up)
   
   ❌ Do not allow force pushes
   
   ❌ Do not allow deletions
   ```

4. **"Create" 버튼 클릭**

---

## ✅ 3단계: 설정 확인 / Step 3: Verify Configuration

설정이 완료되면 다음이 작동해야 합니다:
After setup, the following should work:

### main 브랜치에 직접 푸시 시도 / Attempting Direct Push to main

```bash
git checkout main
git push origin main
# ❌ Error: GH006: Protected branch update failed
# ✅ PR을 통해서만 병합 가능
```

### develop 브랜치에 직접 푸시 시도 / Attempting Direct Push to develop

```bash
git checkout develop
git push origin develop
# ❌ Error: GH006: Protected branch update failed
# ✅ PR을 통해서만 병합 가능
```

---

## 🚀 4단계: 앞으로의 워크플로우 / Step 4: Future Workflow

### 새로운 기능 개발 시 / When Developing New Features

```bash
# 1. develop 브랜치로 이동
git checkout develop
git pull origin develop

# 2. 새로운 feature 브랜치 생성
git checkout -b feature/기능명
# 예: git checkout -b feature/chat-real-name-display

# 3. 코드 작성 & 커밋
git add .
git commit -m "feat: 새로운 기능 추가"
git push origin feature/기능명

# 4. GitHub에서 Pull Request 생성
# - feature/기능명 → develop
# - 팀원이 검토 후 승인
# - 승인 후 병합

# 5. develop → main도 PR로 진행
```

---

## 📝 5단계: Pull Request 생성 방법 / Step 5: How to Create Pull Request

### GitHub 웹사이트에서:

1. **저장소 메인 페이지 접속**
   - https://github.com/Sanghoonhan1334/Amiko-Project

2. **"Pull requests" 탭 클릭**

3. **"New pull request" 버튼 클릭**

4. **브랜치 선택**
   - base: `develop` (또는 `main`)
   - compare: `feature/기능명`

5. **PR 제목 및 설명 작성**

6. **"Create pull request" 클릭**

7. **팀원에게 리뷰 요청**

8. **승인 후 "Merge pull request" 클릭**

---

## ⚠️ 중요 참고사항 / Important Notes

### 1. "Do not allow bypassing" 옵션

- ✅ **체크하면**: 관리자도 직접 푸시 불가, PR만 가능
- ❌ **체크 안 하면**: 관리자는 직접 푸시 가능 (권장하지 않음)

### 2. 승인 요구사항

- 현재 설정: 1명 이상의 승인 필요
- 혼자 작업 시: 자기 자신을 승인할 수 있음 (또는 승인 요구를 0으로 설정)

### 3. Status Checks

- CI/CD가 설정되어 있으면 나중에 추가 가능
- 현재는 선택 사항

---

## 🔧 설정 수정 방법 / How to Modify Settings

1. **Settings → Branches**
2. **해당 브랜치 보호 규칙 옆의 연필 아이콘 클릭**
3. **설정 수정 후 "Save changes"**

---

## ❓ 문제 해결 / Troubleshooting

### Q: main에 직접 푸시가 계속 되요
A: "Do not allow bypassing" 옵션이 체크되어 있는지 확인하세요.

### Q: PR을 만들었는데 병합이 안 되요
A: 승인이 필요한지, status checks가 통과했는지 확인하세요.

### Q: 승인 요구사항을 변경하고 싶어요
A: Settings → Branches → 해당 규칙 수정 → Require approvals 수정

---

## 📚 참고 문서 / References

- [GitHub Branch Protection Documentation](https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-protected-branches)
- [docs/BRANCH_PROTECTION.md](./BRANCH_PROTECTION.md) - 상세 규칙 설명
- [docs/GIT_WORKFLOW.md](./GIT_WORKFLOW.md) - Git 워크플로우 가이드

---

## ✅ 체크리스트 / Checklist

설정 완료 후 확인:
After setup, verify:

- [ ] main 브랜치 보호 규칙이 설정되었는가?
- [ ] develop 브랜치 보호 규칙이 설정되었는가?
- [ ] 직접 푸시가 차단되는지 확인했는가?
- [ ] PR 생성 및 병합이 정상 작동하는가?

---

**설정이 완료되면 Pull Request 워크플로우를 사용할 수 있습니다!**
**Once setup is complete, you can use the Pull Request workflow!**

