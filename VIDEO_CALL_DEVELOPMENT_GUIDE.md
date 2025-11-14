# 영상통화 기능 개발 가이드

## 🎯 권장 방법: Git 브랜치 사용

### 방법 1: 기존 브랜치 사용 (권장)
이미 `feature/video-call-development` 브랜치가 있으므로 이를 활용:

```bash
# 1. 현재 변경사항 커밋
git add .
git commit -m "chore: 프로젝트 정리 및 문서화"

# 2. 기존 video-call 브랜치로 전환
git checkout feature/video-call-development

# 또는 브랜치가 없으면 새로 생성
git checkout -b feature/video-call-development
```

### 방법 2: 새 브랜치 생성
```bash
# 1. 현재 변경사항 커밋
git add .
git commit -m "chore: 프로젝트 정리 및 문서화"

# 2. develop 브랜치에서 새 브랜치 생성
git checkout develop
git pull origin develop
git checkout -b feature/video-call-v2

# 3. 영상통화 개발 시작
```

## ✅ Git 브랜치 사용의 장점

1. **안전성**: 현재 작업 중인 코드를 보존
2. **유연성**: 언제든지 main/develop 브랜치로 돌아갈 수 있음
3. **병합 용이**: 개발 완료 후 쉽게 병합 가능
4. **협업**: 여러 기능을 동시에 개발 가능
5. **롤백**: 문제 발생 시 쉽게 되돌릴 수 있음

## 🔄 작업 흐름

```
main/develop (안정 버전)
    ↓
feature/video-call-development (영상통화 개발)
    ↓
개발 완료 후
    ↓
develop → main (병합)
```

## 📋 현재 상태

- **현재 브랜치**: main
- **변경사항**: 프로젝트 정리 작업 (커밋 필요)
- **기존 브랜치**: feature/video-call-development 존재

## 🚀 다음 단계

1. 현재 변경사항 커밋
2. 영상통화 개발 브랜치로 전환
3. 영상통화 기능 개발
4. 개발 완료 후 develop/main에 병합

