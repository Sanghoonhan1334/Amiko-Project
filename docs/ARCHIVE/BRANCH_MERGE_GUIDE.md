# 브랜치 간 변경사항 적용 가이드

## ❌ 자동으로 적용되지 않습니다!

브랜치는 **독립적**이기 때문에, main 브랜치에서 수정한 내용이 video-call 브랜치에 **자동으로 적용되지 않습니다**.

## ✅ 변경사항을 적용하는 방법

### 방법 1: 병합 (Merge) - 권장

#### 시나리오: main 브랜치에서 버그 수정 후 video-call 브랜치에 적용

```bash
# 1. main 브랜치에서 버그 수정 및 커밋
git checkout main
# ... 버그 수정 ...
git add .
git commit -m "fix: 버그 수정"

# 2. video-call 브랜치로 전환
git checkout feature/video-call-development

# 3. main 브랜치의 변경사항을 병합
git merge main

# 4. 충돌이 있으면 해결 후 커밋
# git add .
# git commit
```

### 방법 2: 체리픽 (Cherry-pick) - 특정 커밋만 적용

#### 시나리오: 특정 버그 수정 커밋만 video-call 브랜치에 적용

```bash
# 1. main 브랜치에서 버그 수정 커밋의 해시 확인
git checkout main
git log --oneline
# 예: abc1234 fix: 버그 수정

# 2. video-call 브랜치로 전환
git checkout feature/video-call-development

# 3. 특정 커밋만 적용
git cherry-pick abc1234
```

### 방법 3: Rebase - 브랜치 히스토리 재정렬

#### 시나리오: video-call 브랜치를 main의 최신 상태로 업데이트

```bash
# 1. video-call 브랜치로 전환
git checkout feature/video-call-development

# 2. main 브랜치의 최신 변경사항을 가져와서 rebase
git rebase main

# 3. 충돌이 있으면 해결 후 계속
# git add .
# git rebase --continue
```

## 🔄 권장 워크플로우

### 옵션 A: main에서 수정 → video-call에 병합

```bash
# main 브랜치에서 작업
git checkout main
# 버그 수정
git commit -m "fix: 버그 수정"

# video-call 브랜치에 적용
git checkout feature/video-call-development
git merge main
```

### 옵션 B: develop 브랜치 사용 (더 안전)

```bash
# develop 브랜치에서 작업
git checkout develop
# 버그 수정
git commit -m "fix: 버그 수정"

# main과 video-call 모두에 병합
git checkout main
git merge develop

git checkout feature/video-call-development
git merge develop
```

## ⚠️ 주의사항

### 1. 충돌 발생 가능
- 같은 파일의 같은 부분을 수정했을 경우 충돌 발생
- 충돌 해결 후 커밋 필요

### 2. 병합 순서
- main → video-call: main의 변경사항을 video-call에 적용
- video-call → main: video-call의 변경사항을 main에 적용

### 3. 테스트 필수
- 병합 후 반드시 테스트
- 개발 서버 실행하여 확인

## 📋 실전 예시

### 예시: main 브랜치에서 API 버그 수정 후 video-call 브랜치에 적용

```bash
# 1. main 브랜치에서 버그 발견 및 수정
git checkout main
# src/app/api/posts/route.ts 수정
git add src/app/api/posts/route.ts
git commit -m "fix: posts API 버그 수정"

# 2. video-call 브랜치로 전환
git checkout feature/video-call-development

# 3. main의 변경사항 병합
git merge main

# 4. 충돌 없으면 자동으로 병합 완료
# 충돌 있으면 해결 후:
# git add .
# git commit
```

## 🎯 요약

| 작업 | 자동 적용? | 필요한 작업 |
|------|-----------|------------|
| main에서 수정 | ❌ 아니요 | video-call 브랜치에서 `git merge main` |
| video-call에서 수정 | ❌ 아니요 | main 브랜치에서 `git merge feature/video-call-development` |
| 특정 커밋만 적용 | ❌ 아니요 | `git cherry-pick <커밋해시>` |

**결론: 브랜치는 독립적이므로, 변경사항을 적용하려면 병합(merge) 또는 체리픽(cherry-pick)을 해야 합니다.**

