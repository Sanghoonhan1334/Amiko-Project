# 빠른 브랜치 보호 규칙 설정 가이드 / Quick Branch Protection Setup Guide

이 가이드는 GitHub 웹 인터페이스를 통해 브랜치 보호 규칙을 빠르게 설정하는 방법입니다.
This guide shows how to quickly set up branch protection rules via GitHub web interface.

---

## 🚀 빠른 설정 (5분) / Quick Setup (5 minutes)

### 1단계: 브랜치 보호 설정 페이지로 이동 / Step 1: Go to Branch Protection Settings

**다음 링크를 브라우저에서 열어주세요:**
**Open the following link in your browser:**

```
https://github.com/Sanghoonhan1334/AMIKO-Project/settings/branches
```

---

### 2단계: main 브랜치 보호 규칙 추가 / Step 2: Add main Branch Protection

1. **"Add branch protection rule" 버튼 클릭** / Click "Add branch protection rule"

2. **Branch name pattern 입력** / Enter branch name pattern:
   - `main` 입력 / Type `main`

3. **다음 항목들을 체크** / Check the following items:

   ```
   ✅ Require a pull request before merging
      ✅ Require approvals: 1
      ✅ Dismiss stale reviews when new commits are pushed
   
   ✅ Require branches to be up to date before merging
   
   ❌ Do not allow force pushes
   
   ❌ Do not allow deletions
   
   ⚠️  Do not allow bypassing the above settings
      - ⚠️  중요: 관리자도 직접 푸시 불가 (PR만 가능)
      - ⚠️  Important: Even admins cannot push directly (only PR allowed)
   ```

4. **"Create" 버튼 클릭** / Click "Create"

---

### 3단계: develop 브랜치 보호 규칙 추가 / Step 3: Add develop Branch Protection

1. **다시 "Add branch protection rule" 버튼 클릭** / Click "Add branch protection rule" again

2. **Branch name pattern 입력** / Enter branch name pattern:
   - `develop` 입력 / Type `develop` (또는 `dev` 사용 시 `dev`)

3. **다음 항목들을 체크** / Check the following items:

   ```
   ✅ Require a pull request before merging
      ✅ Require approvals: 1
   
   ❌ Do not allow force pushes
   
   ❌ Do not allow deletions
   ```

4. **"Create" 버튼 클릭** / Click "Create"

---

## ✅ 완료! / Done!

설정이 완료되었습니다! 이제 main과 develop 브랜치에 직접 푸시할 수 없고, Pull Request를 통해서만 병합할 수 있습니다.
Setup is complete! You can no longer push directly to main and develop branches, and can only merge through Pull Requests.

---

## 🧪 테스트 / Test

설정이 제대로 되었는지 확인하려면:
To verify the setup is working correctly:

```bash
# main 브랜치에 직접 푸시 시도
git checkout main
git push origin main

# 다음과 같은 에러가 나와야 합니다:
# ❌ Error: GH006: Protected branch update failed
```

---

## 📝 참고사항 / Notes

### "Do not allow bypassing" 옵션

- ✅ **체크하면**: 관리자도 직접 푸시 불가, PR만 가능 (권장)
- ❌ **체크 안 하면**: 관리자는 직접 푸시 가능 (권장하지 않음)

### 승인 요구사항

- 현재 설정: 1명 이상의 승인 필요
- 혼자 작업 시: 자기 자신을 승인할 수 있음 (또는 승인 요구를 0으로 설정)

---

## 📚 더 자세한 정보 / More Information

- [docs/BRANCH_PROTECTION_SETUP.md](./BRANCH_PROTECTION_SETUP.md) - 상세 가이드
- [docs/BRANCH_PROTECTION.md](./BRANCH_PROTECTION.md) - 규칙 설명
- [docs/GIT_WORKFLOW.md](./GIT_WORKFLOW.md) - Git 워크플로우

---

**설정이 완료되면 Pull Request 워크플로우를 사용할 수 있습니다!**
**Once setup is complete, you can use the Pull Request workflow!**

